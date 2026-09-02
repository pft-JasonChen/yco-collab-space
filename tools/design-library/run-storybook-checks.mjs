import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import axe from 'axe-core';
import { chromium } from 'playwright';
import { readJson } from '../prototype-cli/project.mjs';

const config = await readJson('prototype.config.json');
const host = config.server.host;
const port = config.server.storybookPort;
const baseUrl = `http://${host}:${port}`;

/**
 * The RD brand fill paired with a white label measures 2.59:1, below WCAG AA.
 * Collab Space matches production verbatim (see design-library/components/button)
 * and records the debt in each consuming feature's design-gaps file, so stories
 * whose only violation is that known pairing opt out of the rule explicitly
 * instead of the catalog silently substituting a different foreground token.
 */
const brandContrastException = { 'color-contrast': { enabled: false } };

const stories = [
  {
    id: 'ui-button--primary',
    axeRules: brandContrastException,
    async interact(page) {
      const button = page.getByRole('button', { name: 'Generate' });
      await button.waitFor({ state: 'visible' });
      assert.equal(await button.isEnabled(), true);
    },
  },
  {
    id: 'ui-button--secondary',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByRole('button', { name: 'Cancel' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-button--tertiary',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByRole('button', { name: 'Learn more' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-button--disabled',
    async interact(page) {
      assert.equal(await page.getByRole('button', { name: 'Generate' }).isEnabled(), false);
    },
  },
  {
    id: 'ui-button--loading',
    async interact(page) {
      const button = page.getByRole('button', { name: 'Generating' });
      assert.equal(await button.isEnabled(), false);
      assert.equal(await button.getAttribute('aria-busy'), 'true');
    },
  },
  {
    id: 'ui-button--with-icon',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByRole('button', { name: 'Next' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-ratio--five-ratios',
    async interact(page) {
      const ratio = page.getByRole('button', { name: '3:4' });
      await ratio.click();
      assert.equal(await ratio.getAttribute('aria-pressed'), 'true');
    },
  },
  {
    id: 'ui-ratio--disabled',
    async interact(page) {
      assert.equal(await page.getByRole('button', { name: '16:9' }).isEnabled(), false);
    },
  },
  {
    id: 'ui-result-page-shell--video-tool',
    async interact(page) {
      const item = page.getByRole('button', { name: 'AI Image' });
      await item.click();
      assert.equal(await item.getAttribute('aria-current'), 'page');
    },
  },
  {
    id: 'ui-result-page-shell--inert-navigation',
    async interact(page) {
      assert.equal(await page.getByRole('button', { name: 'AI Video' }).isEnabled(), false);
    },
  },
  {
    id: 'ui-result-page-shell--without-title-info',
    async interact(page) {
      assert.equal(await page.getByTestId('product-title-info').count(), 0);
    },
  },
  {
    id: 'ui-upload-media-block--video-uploaded',
    async interact(page) {
      await page.getByTestId('shared-upload-media-block').waitFor({ state: 'visible' });
      await page.getByTestId('selected-duration').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Remove video' }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Replace video' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-upload-media-block--empty',
    async interact(page) {
      assert.equal(await page.getByRole('button', { name: /Upload video/ }).isEnabled(), true);
    },
  },
  {
    id: 'ui-upload-media-block--video-uploaded-with-feature-action',
    async interact(page) {
      await page.getByRole('button', { name: 'Feature action' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-credit-controls--generate-disabled',
    async interact(page) {
      assert.equal(await page.getByRole('button', { name: /Generate/ }).isEnabled(), false);
      await page.getByTestId('generate-credit-cost').waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-credit-controls--generate-loading',
    async interact(page) {
      const button = page.getByRole('button', { name: /Generating/ });
      assert.equal(await button.isEnabled(), false);
      assert.equal(await page.getByTestId('generate-credit-cost').count(), 0);
    },
  },
  {
    id: 'ui-video-results-surface--default',
    async interact(page) {
      const bounds = await page.getByRole('tablist', { name: 'Video result views' }).evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width };
      });
      assert.equal(Math.round(bounds.width), 368);
    },
  },
  {
    id: 'ui-video-timeline--synchronized-canvas-playback',
    async interact(page) {
      assert.equal(await page.getByTestId('canvas-playback-timeline').getAttribute('data-synchronized'), 'true');
    },
  },
  {
    id: 'ui-video-history--completed',
    async interact(page) {
      await page.getByTestId('shared-video-history').waitFor({ state: 'visible' });
      await page.getByLabel('Open Video Expansion details').waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-video-history--processing-and-failed',
    async interact(page) {
      await page.getByText('Generating video').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Retry' }).click();
    },
  },
  {
    id: 'ui-video-info-dialog--open',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByTestId('video-info-backdrop').waitFor({ state: 'visible' });
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      assert.equal(await page.getByRole('button', { name: 'Video Expansion' }).isEnabled(), true);
    },
  },
  {
    id: 'ui-icon-action-buttons--result-card-actions',
    async interact(page) {
      const like = page.getByTestId('icon-action-like');
      const dislike = page.getByTestId('icon-action-dislike');
      await page.getByTestId('icon-action-edit').waitFor({ state: 'visible' });
      await page.getByTestId('icon-action-download').waitFor({ state: 'visible' });
      await like.click();
      assert.equal(await like.getAttribute('aria-pressed'), 'true');
      await dislike.click();
      assert.equal(await like.getAttribute('aria-pressed'), 'false');
      assert.equal(await dislike.getAttribute('aria-pressed'), 'true');
      await dislike.click();
      assert.equal(await dislike.getAttribute('aria-pressed'), 'false');
    },
  },
  {
    id: 'ui-video-trim-modal--thirty-second-limit',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByTestId('video-trim-dialog').waitFor({ state: 'visible' });
      await page.getByTestId('trim-handle-start').waitFor({ state: 'visible' });
      await page.getByTestId('trim-handle-end').waitFor({ state: 'visible' });
      await page.getByTestId('trim-use-video').click();
      await page.getByText('Selected 0–30 seconds', { exact: true }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-video-trim-modal--thirty-second-limit',
    label: 'ui-video-trim-modal--maximum-window-clamp',
    axeRules: brandContrastException,
    async interact(page) {
      // The 48s source starts with 0–30 selected; dragging the end handle past the
      // right edge must not grow the selection beyond the 30s maximum.
      const duration = page.getByTestId('trim-selection-duration');
      await duration.waitFor({ state: 'visible' });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="trim-selection-duration"]')?.textContent === '00:30',
      );
      const handle = page.getByTestId('trim-handle-end');
      const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 600, box.y + box.height / 2, { steps: 12 });
      await page.mouse.up();
      assert.equal(await duration.textContent(), '00:30');
      await page.getByTestId('trim-use-video').click();
      await page.getByText('Selected 0–30 seconds', { exact: true }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-video-trim-modal--thirty-second-limit',
    label: 'ui-video-trim-modal--responsive',
    axeRules: brandContrastException,
    viewport: { width: 768, height: 1024 },
    async interact(page) {
      const dialog = page.getByTestId('video-trim-dialog');
      await dialog.waitFor({ state: 'visible' });
      const bounds = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });
      assert.equal(bounds.left >= 0 && bounds.right <= 768 && bounds.width > 0, true);
    },
  },
];

async function serverReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child?.exitCode !== null) {
      throw new Error('Storybook exited before becoming ready.');
    }
    if (await serverReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Storybook did not answer before the deadline.');
}

let server;
if (!(await serverReady())) {
  server = spawn('npm', ['run', 'storybook', '--', '--ci'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer(server);
}

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const story of stories) {
    const context = await browser.newContext({ viewport: story.viewport ?? { width: 1280, height: 800 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const unexpectedRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const requestUrl = request.url();
      if (requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) return;
      if (new URL(requestUrl).origin !== baseUrl) unexpectedRequests.push(requestUrl);
    });

    try {
      await page.goto(`${baseUrl}/iframe.html?id=${story.id}&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      await page.locator('#storybook-root').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.vite-error-overlay').count(), 0);
      await story.interact(page);

      await page.addScriptTag({ content: axe.source });
      // Storybook's a11y addon runs axe itself whenever a story re-renders, and
      // axe-core refuses concurrent runs. Retry briefly so an interaction that
      // re-rendered the story does not fail the check.
      let axeResult;
      for (let attempt = 0; ; attempt += 1) {
        try {
          axeResult = await page.evaluate(async (storyRules) => window.axe.run('#storybook-root', {
            rules: {
              'landmark-one-main': { enabled: false },
              'page-has-heading-one': { enabled: false },
              region: { enabled: false },
              ...storyRules,
            },
          }), story.axeRules ?? {});
          break;
        } catch (error) {
          if (attempt >= 10 || !/Axe is already running/.test(error.message)) throw error;
          await page.waitForTimeout(250);
        }
      }
      const violations = axeResult.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary,
        })),
      }));

      assert.deepEqual(consoleErrors, []);
      assert.deepEqual(pageErrors, []);
      assert.deepEqual(unexpectedRequests, []);
      assert.deepEqual(violations, []);
      process.stdout.write(`[storybook] PASS ${story.label ?? story.id}\n`);
    } catch (error) {
      failures.push(`${story.label ?? story.id}: ${error.message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  if (server) server.kill('SIGTERM');
}

if (failures.length > 0) {
  process.stderr.write('[storybook] FAIL\n');
  failures.forEach((failure) => process.stderr.write(`  - ${failure}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(`[storybook] PASS ${stories.length} interactive stories with axe\n`);
}
