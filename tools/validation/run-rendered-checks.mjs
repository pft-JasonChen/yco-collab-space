import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  fromRoot,
  normaliseFeatureSlug,
  pathExists,
  readJson,
  readYaml,
} from '../prototype-cli/project.mjs';
import { resolveSurfaceContext } from '../prototype-cli/surface-policy.mjs';
import { measuredFacts } from '../design-library/geometry.mjs';

function cliFeature() {
  const index = process.argv.indexOf('--feature');
  return normaliseFeatureSlug(
    index >= 0 ? process.argv[index + 1] : process.argv[2],
  );
}

// Fix-loop filters. `--check a,b` and `--viewport name` re-run only what failed; a
// filtered run writes its evidence as rendered-validation.partial.* so it can never
// be mistaken for the full evidence a stage transition is approved against.
function cliList(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  return String(process.argv[index + 1] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const SURFACE_CHECK_ID = 'surface-structure';

async function waitForServer(url, child) {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error('Preview server exited before becoming ready.');
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server has not started listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('Preview server did not answer before the deadline.');
}

async function applyStep(page, step) {
  const locator = page.locator(step.selector);

  if (step.action === 'click') {
    await locator.click();
    return;
  }

  if (step.action === 'fill') {
    await locator.fill(String(step.value));
    return;
  }

  if (step.action === 'select') {
    await locator.selectOption(String(step.value));
    return;
  }

  if (step.action === 'check') {
    await locator.check();
    return;
  }

  if (step.action === 'uncheck') {
    await locator.uncheck();
    return;
  }

  if (step.action === 'press') {
    await locator.press(String(step.value));
    return;
  }

  if (step.action === 'hover') {
    await locator.hover();
    return;
  }

  if (step.action === 'set-files') {
    await locator.setInputFiles({
      name: String(step.name || 'synthetic-file.txt'),
      mimeType: String(step.mimeType || 'text/plain'),
      buffer: Buffer.from(String(step.value || 'synthetic test file')),
    });
    return;
  }

  throw new Error('Unsupported action: ' + step.action);
}

async function applyAssertion(page, assertion) {
  const locator = page.locator(assertion.selector);

  if (assertion.type === 'visible') {
    if (!(await locator.isVisible())) {
      throw new Error('Expected visible: ' + assertion.selector);
    }
    return;
  }

  if (assertion.type === 'hidden') {
    if (!(await locator.isHidden())) {
      throw new Error('Expected hidden: ' + assertion.selector);
    }
    return;
  }

  if (assertion.type === 'text') {
    const text = (await locator.textContent()) || '';
    if (!text.includes(String(assertion.value))) {
      throw new Error(
        'Expected text "' +
          assertion.value +
          '" in ' +
          assertion.selector +
          ', received "' +
          text.trim() +
          '"',
      );
    }
    return;
  }

  if (assertion.type === 'count') {
    const count = await locator.count();
    if (count !== assertion.value) {
      throw new Error(
        'Expected ' +
          assertion.value +
          ' matches for ' +
          assertion.selector +
          ', received ' +
          count,
      );
    }
    return;
  }

  if (assertion.type === 'attribute') {
    const value = await locator.getAttribute(assertion.name);
    if (value !== String(assertion.value)) {
      throw new Error(
        'Expected attribute ' +
          assertion.name +
          '="' +
          assertion.value +
          '" on ' +
          assertion.selector,
      );
    }
    return;
  }

  if (assertion.type === 'value') {
    const value = await locator.inputValue();
    if (value !== String(assertion.value)) {
      throw new Error(
        'Expected value "' +
          assertion.value +
          '" on ' +
          assertion.selector +
          ', received "' +
          value +
          '"',
      );
    }
    return;
  }

  if (assertion.type === 'checked') {
    const checked = await locator.isChecked();
    if (checked !== Boolean(assertion.value)) {
      throw new Error(
        'Expected checked=' +
          Boolean(assertion.value) +
          ' on ' +
          assertion.selector,
      );
    }
    return;
  }

  throw new Error('Unsupported assertion type: ' + assertion.type);
}

/**
 * Two measurements: the document, and the PrototypeFrame content container. The
 * frame is `overflow: auto`, so a feature wider than the viewport scrolls inside
 * it and the document never grows; measuring only the document would pass.
 */
async function assertNoHorizontalOverflow(page, viewport) {
  const measurements = await page.evaluate(() => {
    const read = (element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    });
    const frame = document.querySelector('[data-prototype-frame="content"]');
    return {
      document: read(document.documentElement),
      frame: frame ? read(frame) : null,
    };
  });

  for (const [label, dimensions] of Object.entries(measurements)) {
    if (!dimensions) continue;
    if (dimensions.scrollWidth > dimensions.clientWidth + 1) {
      throw new Error(
        'Horizontal overflow at ' +
          viewport.name +
          ' (' +
          label +
          '): scrollWidth=' +
          dimensions.scrollWidth +
          ', clientWidth=' +
          dimensions.clientWidth,
      );
    }
  }
}

/**
 * Measured geometry: values no stylesheet declares, so only a rendered page can
 * produce them. Facts are matched to the viewport they were measured at.
 */
async function assertGeometry(page, viewport, facts) {
  for (const fact of facts) {
    if (fact.viewport !== viewport.name) continue;
    const box = await page.locator(fact.selector).first().boundingBox();
    if (!box) throw new Error('Geometry target is not rendered: ' + fact.id + ' (' + fact.selector + ')');
    const actual = fact.dimension === 'height' ? box.height : box.width;
    if (Math.abs(actual - fact.value) > fact.tolerance) {
      throw new Error(
        'Geometry drifted: ' + fact.id + ' expected ' + fact.value + 'px but measured ' +
          Math.round(actual) + 'px (tolerance ' + fact.tolerance + 'px)',
      );
    }
  }
}

/**
 * Only the at-rest composition is asserted here. A zone or role the intent marks
 * on-interaction, conditional or deferred is reached by the validation checks
 * whose steps open it, not by looking for it on the entry route.
 */
async function assertSurfaceStructure(page, surface) {
  const zones = surface.atRestZones ?? surface.requiredZones;
  const roles = surface.atRestComponentRoles ?? surface.requiredComponentRoles;

  // A role such as gallery-cell legitimately matches many elements; the structure
  // check asks whether the composition is present, so the first match decides.
  // Playwright's strict mode would otherwise throw on any repeated role.
  for (const zone of zones) {
    const selector = '[data-surface-zone="' + zone + '"]';

    if (!(await page.locator(selector).first().isVisible())) {
      throw new Error('Missing required surface zone: ' + zone);
    }
  }

  for (const role of roles) {
    const selector = '[data-component-role~="' + role + '"]';

    if (!(await page.locator(selector).first().isVisible())) {
      throw new Error('Missing required component role: ' + role);
    }
  }
}

function reportMarkdown(feature, baseUrl, results) {
  const lines = [
    '# Rendered validation — ' + feature,
    '',
    '- URL: ' + baseUrl,
    '- Result: ' + (results.every((result) => result.passed) ? 'PASS' : 'FAIL'),
    '',
    '| Viewport | Check | Criterion | Result | Evidence |',
    '|---|---|---|---|---|',
  ];

  for (const result of results) {
    lines.push(
      '| ' +
        result.viewport +
        ' | ' +
        result.check +
        ' | ' +
        result.criterion +
        ' | ' +
        (result.passed ? 'PASS' : 'FAIL: ' + result.error) +
        ' | ' +
        result.screenshot +
        ' |',
    );
  }

  return lines.join('\n') + '\n';
}

const feature = cliFeature();
const config = await readJson('prototype.config.json');
const validation = await readYaml(
  path.join('features', feature, 'product', 'validation.yaml'),
);
const selectedChecks = cliList('--check');
const selectedViewports = cliList('--viewport');
const partialRun = Boolean(selectedChecks || selectedViewports);

if (selectedChecks) {
  const knownChecks = new Set([SURFACE_CHECK_ID, ...validation.checks.map((check) => check.id)]);
  const unknownChecks = selectedChecks.filter((id) => !knownChecks.has(id));
  if (unknownChecks.length > 0) {
    throw new Error('Unknown --check id(s): ' + unknownChecks.join(', '));
  }
}

if (selectedViewports) {
  const knownViewports = new Set(config.viewports.map((viewport) => viewport.name));
  const unknownViewports = selectedViewports.filter((name) => !knownViewports.has(name));
  if (unknownViewports.length > 0) {
    throw new Error('Unknown --viewport name(s): ' + unknownViewports.join(', '));
  }
}

const runSurfaceCheck = !selectedChecks || selectedChecks.includes(SURFACE_CHECK_ID);
const selectedValidationChecks = validation.checks.filter(
  (check) => !selectedChecks || selectedChecks.includes(check.id),
);
const runViewports = config.viewports.filter(
  (viewport) => !selectedViewports || selectedViewports.includes(viewport.name),
);
const surfaceResult = await resolveSurfaceContext(feature);

if (surfaceResult.errors.length > 0 || !surfaceResult.context) {
  throw new Error(
    'Surface context cannot be rendered:\n' + surfaceResult.errors.join('\n'),
  );
}

const surface = surfaceResult.context;
// Patterns the feature's pinned pack composes; a novel surface composes none.
const composedPacks = new Set();
for (const reference of [surface.primaryPack, ...(surface.borrowedPacks ?? [])].filter(Boolean)) {
  const slotsPath = path.join(
    'platform', 'surfaces', ...reference.id.split('/'), reference.version, 'component-slots.yaml',
  );
  if (!(await pathExists(fromRoot(slotsPath)))) continue;
  const slots = await readYaml(slotsPath);
  for (const composed of slots.composes ?? []) composedPacks.add(composed.split('@')[0]);
}
const geometry = await measuredFacts({ packs: composedPacks });
const host = config.server.host;
const port = config.server.previewPort;
const baseUrl = 'http://' + host + ':' + port;
const routeUrl = baseUrl + validation.route;
const evidenceRoot = fromRoot('features', feature, 'evidence');
const screenshotRoot = path.join(evidenceRoot, 'screenshots');
await fs.mkdir(screenshotRoot, { recursive: true });

const serverOutput = [];
const server = spawn(
  process.execPath,
  [fromRoot('tools', 'prototype-cli', 'run-vite.mjs'), 'preview'],
  {
    cwd: fromRoot(),
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()));
server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));

let browser;
const results = [];

try {
  await waitForServer(baseUrl, server);
  browser = await chromium.launch({ headless: true });

  for (const viewport of runViewports) {
    const context = await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const unexpectedRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const requestUrl = request.url();
      if (requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) {
        return;
      }

      if (new URL(requestUrl).origin !== baseUrl) {
        unexpectedRequests.push(requestUrl);
      }
    });

    const surfaceScreenshotName =
      viewport.name + '-surface-structure.png';
    const surfaceScreenshotPath = path.join(
      screenshotRoot,
      surfaceScreenshotName,
    );
    let surfacePassed = true;
    let surfaceError = null;

    if (runSurfaceCheck) {
      try {
        const response = await page.goto(routeUrl, {
          waitUntil: 'networkidle',
        });

        if (!response?.ok()) {
          throw new Error('HTTP navigation failed: ' + response?.status());
        }

        await assertSurfaceStructure(page, surface);
        await assertGeometry(page, viewport, geometry);
        await assertNoHorizontalOverflow(page, viewport);

        if (consoleErrors.length > 0) {
          throw new Error('Console errors: ' + consoleErrors.join('; '));
        }

        if (pageErrors.length > 0) {
          throw new Error('Page errors: ' + pageErrors.join('; '));
        }

        if (unexpectedRequests.length > 0) {
          throw new Error(
            'Unexpected network requests: ' + unexpectedRequests.join('; '),
          );
        }
      } catch (caughtError) {
        surfacePassed = false;
        surfaceError = caughtError.message;
      }

      await page.screenshot({
        path: surfaceScreenshotPath,
        fullPage: true,
      });

      results.push({
        viewport: viewport.name,
        check: SURFACE_CHECK_ID,
        criterion: 'surface:' + surface.strategy,
        passed: surfacePassed,
        error: surfaceError,
        screenshot: 'screenshots/' + surfaceScreenshotName,
      });
    }

    for (const check of selectedValidationChecks) {
      const errorStart = {
        console: consoleErrors.length,
        page: pageErrors.length,
        request: unexpectedRequests.length,
      };
      const screenshotName =
        viewport.name + '-' + check.id + '.png';
      const screenshotPath = path.join(screenshotRoot, screenshotName);
      let passed = true;
      let error = null;

      try {
        const response = await page.goto(routeUrl, {
          waitUntil: 'networkidle',
        });

        if (!response?.ok()) {
          throw new Error('HTTP navigation failed: ' + response?.status());
        }

        for (const step of check.steps || []) {
          await applyStep(page, step);
        }

        for (const assertion of check.assertions) {
          await applyAssertion(page, assertion);
        }

        await assertNoHorizontalOverflow(page, viewport);

        const newConsoleErrors = consoleErrors.slice(errorStart.console);
        const newPageErrors = pageErrors.slice(errorStart.page);
        const newUnexpectedRequests = unexpectedRequests.slice(
          errorStart.request,
        );

        if (newConsoleErrors.length > 0) {
          throw new Error('Console errors: ' + newConsoleErrors.join('; '));
        }

        if (newPageErrors.length > 0) {
          throw new Error('Page errors: ' + newPageErrors.join('; '));
        }

        if (newUnexpectedRequests.length > 0) {
          throw new Error(
            'Unexpected network requests: ' +
              newUnexpectedRequests.join('; '),
          );
        }
      } catch (caughtError) {
        passed = false;
        error = caughtError.message;
      }

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      results.push({
        viewport: viewport.name,
        check: check.id,
        criterion: check.criterion,
        passed,
        error,
        screenshot:
          'screenshots/' + screenshotName,
      });
    }

    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

const report = {
  schemaVersion: 2,
  feature,
  baseUrl,
  generatedAt: new Date().toISOString(),
  passed: results.every((result) => result.passed),
  partial: partialRun,
  selection: partialRun
    ? { checks: selectedChecks, viewports: selectedViewports }
    : null,
  surface: {
    strategy: surface.strategy,
    primaryPack: surface.primaryPack,
    borrowedPacks: surface.borrowedPacks,
    contextHash: surface.contextHash,
    visualReview: surface.visualReview,
  },
  results,
};

const evidenceBaseName = partialRun
  ? 'rendered-validation.partial'
  : 'rendered-validation';

await fs.writeFile(
  path.join(evidenceRoot, evidenceBaseName + '.json'),
  JSON.stringify(report, null, 2) + '\n',
);
await fs.writeFile(
  path.join(evidenceRoot, evidenceBaseName + '.md'),
  reportMarkdown(feature, baseUrl, results),
);

if (partialRun) {
  process.stdout.write(
    '[rendered] PARTIAL run (' +
      (selectedChecks ? 'checks: ' + selectedChecks.join(',') : 'all checks') +
      '; ' +
      (selectedViewports ? 'viewports: ' + selectedViewports.join(',') : 'all viewports') +
      ') — evidence written to ' +
      evidenceBaseName +
      '.json; run the full check before any stage transition\n',
  );
}

if (!report.passed) {
  process.stderr.write('[rendered] FAIL ' + feature + '\n');
  for (const result of results.filter((item) => !item.passed)) {
    process.stderr.write(
      '  - ' +
        result.viewport +
        '/' +
        result.check +
        ': ' +
        result.error +
        '\n',
    );
  }
  if (serverOutput.length > 0) {
    process.stderr.write(serverOutput.join(''));
  }
  process.exitCode = 1;
} else {
  process.stdout.write(
    '[rendered] PASS ' +
      feature +
      ' — ' +
      results.length +
      ' checks across ' +
      runViewports.length +
      ' viewports\n',
  );
}
