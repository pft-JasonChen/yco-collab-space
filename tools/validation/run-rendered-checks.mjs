import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  fromRoot,
  normaliseFeatureSlug,
  readJson,
  readYaml,
} from '../prototype-cli/project.mjs';
import { resolveSurfaceContext } from '../prototype-cli/surface-policy.mjs';

function cliFeature() {
  const index = process.argv.indexOf('--feature');
  return normaliseFeatureSlug(
    index >= 0 ? process.argv[index + 1] : process.argv[2],
  );
}

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

async function assertNoHorizontalOverflow(page, viewport) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  if (dimensions.scrollWidth > dimensions.clientWidth + 1) {
    throw new Error(
      'Horizontal overflow at ' +
        viewport.name +
        ': scrollWidth=' +
        dimensions.scrollWidth +
        ', clientWidth=' +
        dimensions.clientWidth,
    );
  }
}

async function assertSurfaceStructure(page, surface) {
  for (const zone of surface.requiredZones) {
    const selector = '[data-surface-zone="' + zone + '"]';

    if (!(await page.locator(selector).isVisible())) {
      throw new Error('Missing required surface zone: ' + zone);
    }
  }

  for (const role of surface.requiredComponentRoles) {
    const selector = '[data-component-role~="' + role + '"]';

    if (!(await page.locator(selector).isVisible())) {
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
const surfaceResult = await resolveSurfaceContext(feature);

if (surfaceResult.errors.length > 0 || !surfaceResult.context) {
  throw new Error(
    'Surface context cannot be rendered:\n' + surfaceResult.errors.join('\n'),
  );
}

const surface = surfaceResult.context;
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

  for (const viewport of config.viewports) {
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

    try {
      const response = await page.goto(routeUrl, {
        waitUntil: 'networkidle',
      });

      if (!response?.ok()) {
        throw new Error('HTTP navigation failed: ' + response?.status());
      }

      await assertSurfaceStructure(page, surface);
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
      check: 'surface-structure',
      criterion: 'surface:' + surface.strategy,
      passed: surfacePassed,
      error: surfaceError,
      screenshot: 'screenshots/' + surfaceScreenshotName,
    });

    for (const check of validation.checks) {
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
  surface: {
    strategy: surface.strategy,
    primaryPack: surface.primaryPack,
    borrowedPacks: surface.borrowedPacks,
    contextHash: surface.contextHash,
    visualReview: surface.visualReview,
  },
  results,
};

await fs.writeFile(
  path.join(evidenceRoot, 'rendered-validation.json'),
  JSON.stringify(report, null, 2) + '\n',
);
await fs.writeFile(
  path.join(evidenceRoot, 'rendered-validation.md'),
  reportMarkdown(feature, baseUrl, results),
);

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
      config.viewports.length +
      ' viewports\n',
  );
}
