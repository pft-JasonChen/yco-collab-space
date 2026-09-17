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
  // Secondary/Tertiary no longer have dedicated stories — Type is Controls-only
  // (see platform/ui/button/Button.stories.jsx). Their old checks only asserted
  // label visibility with no variant-specific behaviour, so nothing here replaces
  // them; Primary above already covers "the button renders and is visible".
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
    id: 'ui-button--trailing-icon',
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
    // Same known, pre-existing debt as the button/video-info-dialog exception
    // above (Round 2 sidebar work, 2026-09-11): .menuButtonActive's active-tab
    // label is --text-brand on white, 2.59:1 — below WCAG AA. Unrelated to
    // today's NavigationHeader merge; recorded the same way rather than
    // silently fixed in passing.
    id: 'ui-result-page-shell--video-tool',
    axeRules: brandContrastException,
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
    axeRules: brandContrastException,
    async interact(page) {
      // testid updated (2026-09-14 NavigationHeader/ProductHeader merge):
      // the info button now comes from NavigationHeader's own featureName
      // slot (data-testid="feature-name-info"), not ProductHeader's old
      // "product-title-info" — that component no longer exists.
      assert.equal(await page.getByTestId('feature-name-info').count(), 0);
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
      // Label is 'Trim' since the story's actionSlot swapped to the shared
      // icon font (2026-09-11) — this check was left pointing at the old
      // placeholder label until now (2026-09-15, found while re-running
      // test:storybook after the VideoTimeline testid-collision fix).
      await page.getByRole('button', { name: 'Trim' }).waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-credit-controls--generate-disabled',
    async interact(page) {
      // Reference (2026-09-15, requested live — "當disable的時候無法偵測所需
      // credits所以可以把credit拿掉"): the credit badge is now hidden while
      // disabled (the real cost isn't knowable yet), not shown — this check
      // used to assert the opposite (badge visible while disabled).
      assert.equal(await page.getByRole('button', { name: /Generate/ }).isEnabled(), false);
      await page.getByTestId('generate-credit-cost').waitFor({ state: 'hidden' });
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
    label: 'ui-video-trim-modal--free-drag-past-maximum-shows-error',
    axeRules: brandContrastException,
    async interact(page) {
      // The 48s source starts with 0–30 selected. Reference (2026-09-15,
      // corrected live — "handler應該要讓user隨意拉動，而不是根據時間限制鎖
      // 死，如果影片是有限制時長的話，user調整範圍若超出hint就會變成紅色的
      // 字"): dragging the end handle past the 30s maximum must NOT clamp the
      // selection — RD's own baseline (use-trim-drag.js) only clamps to the
      // minimum segment length and the track's own bounds, never to a
      // maximum. Exceeding it instead surfaces as a longer duration reading
      // and a disabled confirm button, not an un-draggable handle.
      const duration = page.getByTestId('trim-selection-duration');
      await duration.waitFor({ state: 'visible' });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="trim-selection-duration"]')?.textContent === '00:30',
      );
      const confirm = page.getByTestId('trim-use-video');
      assert.equal(await confirm.isDisabled(), false);
      const handle = page.getByTestId('trim-handle-end');
      const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 600, box.y + box.height / 2, { steps: 12 });
      await page.mouse.up();
      const durationText = await duration.textContent();
      assert.notEqual(durationText, '00:30');
      const match = durationText.match(/^(\d\d):(\d\d)$/);
      assert.equal(Number(match[1]) * 60 + Number(match[2]) > 30, true);
      assert.equal(await confirm.isDisabled(), true);
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
  {
    // The justified row is the whole point of this component: cells must share a
    // row and the row must stay inside the 200-240px band. Asserting the band
    // rather than exact heights keeps the check honest about what the algorithm
    // actually guarantees.
    id: 'ui-gallery-grid--justified',
    async interact(page) {
      const container = page.locator('[data-component-role="gallery-grid"]');
      await container.waitFor({ state: 'visible' });
      assert.equal(await container.getAttribute('data-layout'), 'justified');
      const heights = await container.evaluate((element) =>
        [...element.children]
          .filter((child) => child.firstElementChild)
          .map((child) => Math.round(child.getBoundingClientRect().height)),
      );
      assert.equal(heights.length > 0, true);
      assert.equal(
        heights.every((height) => height >= 200 && height <= 240),
        true,
        `justified rows must stay within 200-240px, got ${heights.join(', ')}`,
      );
    },
  },
  {
    // The masonry is the one axis Controls cannot express, and the reason the
    // component measures its own box instead of the viewport: this story forces
    // the layout inside a 375px wrapper while the browser window stays wide.
    id: 'ui-gallery-grid--masonry',
    async interact(page) {
      const container = page.locator('[data-component-role="gallery-grid"]');
      await container.waitFor({ state: 'visible' });
      assert.equal(await container.getAttribute('data-layout'), 'masonry');
      assert.equal(await container.locator('> div').count(), 2);
    },
  },
  {
    id: 'ui-gallery-cell--image',
    async interact(page) {
      const cell = page.locator('[data-component-role="gallery-cell"]');
      await cell.waitFor({ state: 'visible' });
      assert.equal(await cell.getAttribute('data-state'), 'default');
    },
  },
  {
    // Selection mode must suppress the actions slot: a cell that showed both the
    // checkbox and the overflow button at once would be two competing targets in
    // the same corner.
    id: 'ui-gallery-cell--selected',
    async interact(page) {
      const cell = page.locator('[data-component-role="gallery-cell"]');
      await cell.waitFor({ state: 'visible' });
      assert.equal(await cell.getAttribute('data-state'), 'editing');
      assert.equal(await cell.getAttribute('data-selected'), 'true');
    },
  },
  {
    // The opt-in selection treatment: the box moves to the top-left, is a real
    // checkbox rather than RD's decorative span, and one click both selects the
    // item and reports it — no separate mode switch first.
    id: 'ui-gallery-cell--hover-select-top-left',
    async interact(page) {
      const cell = page.locator('[data-component-role="gallery-cell"]').first();
      await cell.waitFor({ state: 'visible' });
      assert.equal(await cell.getAttribute('data-checkbox'), 'top-left');
      assert.equal(await cell.getAttribute('data-checkbox-on-hover'), 'true');
      assert.equal(await cell.getAttribute('data-selected'), 'false');

      const box = cell.locator('[role="checkbox"]');
      assert.equal(await box.getAttribute('aria-checked'), 'false');
      await box.click();
      assert.equal(await cell.getAttribute('data-selected'), 'true');
      assert.equal(await box.getAttribute('aria-checked'), 'true');
    },
  },
  {
    // A value picker: opening keeps focus on the trigger and points at the
    // highlighted row, which is what makes RD's combobox model work.
    id: 'ui-dropdownselect--value-picker',
    axeRules: brandContrastException,
    async interact(page) {
      const trigger = page.locator('[data-component-role="dropdown-select"] [role="combobox"]');
      await trigger.waitFor({ state: 'visible' });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await trigger.click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');

      const list = page.locator('[role="listbox"]');
      assert.equal(await list.isVisible(), true);
      assert.ok(await trigger.getAttribute('aria-activedescendant'));

      await page.locator('[role="option"][data-option-key="size"]').click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      // The closed menu stays in the DOM (hidden), so visibility is the check,
      // not presence.
      assert.equal(await list.isVisible(), false, 'the menu closes after a pick');
      assert.equal(
        await page.locator('[role="option"][data-selected="true"]').getAttribute('data-option-key'),
        'size',
      );
    },
  },
  {
    // The pill exists so on-photo glyphs stay legible: it carries the ground and
    // the buttons are transparent. The menu's children stay valid — labelled
    // runs are real groups, never bare dividers.
    id: 'ui-cellactions--download-and-more',
    async interact(page) {
      const root = page.locator('[data-component-role="cell-actions"]');
      await root.waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-testid="cell-action-download"]').isVisible(), true);

      const more = page.locator('[data-testid="cell-more"]');
      assert.equal(await more.getAttribute('aria-haspopup'), 'menu');
      assert.equal(await more.getAttribute('aria-expanded'), 'false');

      const menu = page.locator('[data-testid="cell-menu"]');
      assert.equal(await menu.isVisible(), false);
      await more.click();
      assert.equal(await menu.isVisible(), true);
      assert.equal(await page.locator('[role="menuitem"]').count(), 6);
      assert.equal(await page.locator('[data-component-role="cell-actions-group"]').count(), 2);
      assert.equal(await menu.locator(':scope > hr').count(), 0);

      const trash = page.locator('[role="menuitem"][data-option-key="trash"]');
      assert.equal(await trash.getAttribute('data-destructive'), 'true');
      assert.equal(await trash.getAttribute('data-menu-position'), 'last');

      await page.keyboard.press('Escape');
      assert.equal(await menu.isVisible(), false);
    },
  },
  {
    // A lone action drops the Download-to-More inset rather than keeping a gap
    // where the second button would have been.
    id: 'ui-cellactions--download-only',
    async interact(page) {
      const root = page.locator('[data-component-role="cell-actions"]');
      await root.waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-testid="cell-action-download"]').isVisible(), true);
      assert.equal(await page.locator('[role="menuitem"]').count(), 0);
    },
  },
  {
    // Two independent radio groups in one menu: picking an order leaves the
    // field's tick alone, which a single selectedKey could not express.
    id: 'ui-dropdownselect--two-groups',
    axeRules: brandContrastException,
    async interact(page) {
      const trigger = page.locator('[data-component-role="dropdown-select"] [role="combobox"]');
      await trigger.waitFor({ state: 'visible' });
      await trigger.click();
      assert.equal(await page.locator('[data-component-role="dropdown-group"]').count(), 2);
      assert.equal(await page.locator('[role="option"][data-selected="true"]').count(), 2);

      await page.locator('[role="option"][data-option-key="asc"]').click();
      await trigger.click();
      assert.equal(
        await page.locator('[role="option"][data-option-key="modified"]').getAttribute('data-selected'),
        'true',
        'changing the order leaves the field selected',
      );
      assert.equal(
        await page.locator('[role="option"][data-option-key="asc"]').getAttribute('data-selected'),
        'true',
      );
    },
  },
  {
    // The ghost selection bar: a leading exit control and unfilled actions, with
    // the destructive one carrying colour rather than a filled ground.
    id: 'ui-selection-toolbar--ghost-selecting',
    async interact(page) {
      const bar = page.locator('[data-component-role="selection-toolbar"]');
      await bar.waitFor({ state: 'visible' });
      assert.equal(await bar.getAttribute('data-variant'), 'ghost');
      assert.equal(await page.locator('[data-testid="selection-exit"]').isVisible(), true);
      assert.equal(await page.locator('[data-testid="selection-toggle"]').count(), 0);
      assert.equal(
        await page.locator('[data-testid="selection-delete"]').getAttribute('data-destructive'),
        'true',
      );
    },
  },
  {
    // An action menu, not a value picker: menu/menuitem roles, no tick, and the
    // destructive row is marked so it can be styled without the caller reaching
    // into the component.
    id: 'ui-dropdownselect--action-menu',
    axeRules: brandContrastException,
    async interact(page) {
      const trigger = page.locator('[data-component-role="dropdown-select"] button').first();
      await trigger.waitFor({ state: 'visible' });
      assert.equal(await trigger.getAttribute('aria-haspopup'), 'menu');
      await trigger.click();

      const menu = page.locator('[role="menu"]');
      assert.equal(await menu.isVisible(), true);
      assert.equal(await page.locator('[role="menuitem"]').count(), 7);
      assert.equal(await page.locator('[data-component-role="dropdown-group"]').count(), 3);

      const trash = page.locator('[role="menuitem"][data-option-key="trash"]');
      assert.equal(await trash.getAttribute('data-destructive'), 'true');

      await page.keyboard.press('Escape');
      assert.equal(await menu.isVisible(), false);
    },
  },
  {
    id: 'ui-gallery-cell--loading',
    async interact(page) {
      const cell = page.locator('[data-component-role="gallery-cell"]');
      await cell.waitFor({ state: 'visible' });
      assert.equal(await cell.getAttribute('data-state'), 'loading');
    },
  },
  {
    // The row is a real tab list: selecting moves aria-current, and the tabs are
    // buttons rather than RD's click-handling divs, so they are keyboard
    // reachable. Both are the reasons this was extracted rather than rebuilt.
    id: 'ui-gallery-tabs--storage-sections',
    // The active tab is RD's own `--text-brand` on the page ground: 2.45:1,
    // below AA. Same class of accepted production pairing as the brand button,
    // recorded as a design gap in the consuming feature rather than recoloured
    // here — changing it would make the prototype disagree with production.
    axeRules: brandContrastException,
    async interact(page) {
      const row = page.locator('[data-component-role="gallery-tab-row"]');
      await row.waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-component-role="gallery-tab"]').count(), 5);
      const videos = page.locator('[data-tab-key="videos"]');
      await videos.click();
      assert.equal(await videos.getAttribute('aria-current'), 'page');
      assert.equal(await page.locator('[data-testid="gallery-tab-red-dot"]').count(), 1);
    },
  },
  {
    id: 'ui-gallery-tabs--overflowing',
    axeRules: brandContrastException,
    async interact(page) {
      const row = page.locator('[data-component-role="gallery-tab-row"]');
      await row.waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-component-role="gallery-tab"]').count(), 5);
    },
  },
  {
    // Out of selection mode there is exactly one action and no destructive one.
    id: 'ui-selection-toolbar--browsing',
    axeRules: brandContrastException,
    async interact(page) {
      const toolbar = page.locator('[data-component-role="selection-toolbar"]');
      await toolbar.waitFor({ state: 'visible' });
      assert.equal(await toolbar.getAttribute('data-editing'), 'false');
      assert.equal(await page.locator('[data-testid="selection-delete"]').count(), 0);
      await page.locator('[data-testid="selection-toggle"]').click();
      assert.equal(await toolbar.getAttribute('data-editing'), 'true');
    },
  },
  {
    // Selection mode swaps the left side to a real checkbox — RD's own markup
    // leaves an unbound input beside a span that carries the handler, so this
    // asserts the repair rather than the port.
    id: 'ui-selection-toolbar--selecting',
    axeRules: brandContrastException,
    async interact(page) {
      // The input is deliberately visually hidden behind the styled ring, so it
      // is driven the way a user drives it: by clicking the label. That the
      // click reaches the real control at all is the repair being asserted —
      // RD's own markup leaves the input unbound and the span carrying the
      // handler, so a label click there toggles nothing.
      const checkbox = page.locator('[data-testid="select-all-input"]');
      await checkbox.waitFor({ state: 'attached' });
      assert.equal(await checkbox.isChecked(), false);
      await page.getByText('Select all').click();
      assert.equal(await checkbox.isChecked(), true);
      await page.locator('[data-testid="selection-delete"]').waitFor({ state: 'visible' });
      await page.locator('[data-testid="selection-download"]').waitFor({ state: 'visible' });
    },
  },
  {
    id: 'ui-selection-toolbar--nothing-selected',
    axeRules: brandContrastException,
    async interact(page) {
      assert.equal(await page.locator('[data-testid="selection-delete"]').isEnabled(), false);
      assert.equal(await page.locator('[data-testid="selection-download"]').isEnabled(), false);
    },
  },
  {
    // Always a real dialog: the surface acceptance flagged the pricing overlay
    // for opening without one, so this component asserts the role, the
    // accessible name and that Escape dismisses it.
    id: 'ui-confirm-dialog--move-to-trash',
    axeRules: brandContrastException,
    async interact(page) {
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.getAttribute('aria-modal'), 'true');
      assert.equal((await dialog.getAttribute('aria-labelledby'))?.length > 0, true);
      await page.locator('[data-testid="confirm-dialog-confirm"]').waitFor({ state: 'visible' });
      await page.locator('[data-testid="confirm-dialog-cancel"]').waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    },
  },
  {
    // The rail's whole reason for being extracted rather than rebuilt is the
    // interaction model: a roving tabindex where exactly one row is tabbable,
    // arrows move it, and Enter selects. RD moves the index but never the
    // caret, so the focus-follows assertion is the repair.
    id: 'ui-category-rail--gallery-selected',
    axeRules: brandContrastException,
    async interact(page) {
      const rail = page.locator('[data-component-role="category-rail"]');
      await rail.waitFor({ state: 'visible' });
      const rows = rail.locator('button');
      assert.equal(await rows.count(), 12);

      const gallery = rail.locator('[data-key="gallery"]');
      assert.equal(await gallery.getAttribute('aria-current'), 'page');
      assert.equal(await gallery.getAttribute('tabindex'), '0');
      assert.equal(
        await rail.locator('button[tabindex="0"]').count(),
        1,
        'exactly one row may be tabbable',
      );

      await gallery.focus();
      await page.keyboard.press('ArrowDown');
      const focusedKey = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-key'),
      );
      assert.equal(focusedKey, 'video-template', 'focus follows the roving index');

      await page.keyboard.press('Enter');
      assert.equal(
        await rail.locator('[data-key="video-template"]').getAttribute('aria-current'),
        'page',
      );
    },
  },
  {
    id: 'ui-category-rail--compact',
    axeRules: brandContrastException,
    async interact(page) {
      const rail = page.locator('[data-component-role="category-rail"]');
      await rail.waitFor({ state: 'visible' });
      assert.equal(await rail.getAttribute('data-compact'), 'true');
    },
  },
  {
    // The surface acceptance recorded that the RD IAP preview opens without a
    // dialog role. This overlay renders through the shared Modal with an
    // accessible name always supplied, so the role, the tablist and Escape are
    // all asserted here rather than left to a passing open/close test.
    id: 'ui-pricing-overlay--subscription',
    axeRules: brandContrastException,
    async interact(page) {
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.getAttribute('aria-modal'), 'true');

      const tabs = page.locator('[data-component-role="plan-tabs"]');
      assert.equal(await tabs.getAttribute('role'), 'tablist');
      const plus = page.locator('[data-tab-key="plus"]');
      await plus.click();
      assert.equal(await plus.getAttribute('aria-selected'), 'true');

      // Selecting a card is what enables checkout; RD disables it until a plan
      // is chosen and that gate is kept.
      const monthly = page.locator('[data-plan-key="monthly"]');
      await monthly.click();
      assert.equal(await monthly.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-testid="pricing-checkout"]').isEnabled(), true);

      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    },
  },
  {
    // RD shows a static pill rather than a one-tab switcher when a single offer
    // applies, so there must be no tablist at all here.
    id: 'ui-pricing-overlay--single-offer',
    axeRules: brandContrastException,
    async interact(page) {
      const tabs = page.locator('[data-component-role="plan-tabs"]');
      await tabs.waitFor({ state: 'visible' });
      assert.equal(await tabs.getAttribute('data-single'), 'true');
      assert.equal(await page.locator('[role="tablist"]').count(), 0);
    },
  },
  {
    // Cloud Storage's capacity path reuses the same overlay with packs instead
    // of tiers and no switcher.
    id: 'ui-pricing-overlay--capacity-packs',
    axeRules: brandContrastException,
    async interact(page) {
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-component-role="plan-tabs"]').count(), 0);
      assert.equal(await page.locator('[data-plan-key="pack-100"]').getAttribute('aria-pressed'), 'true');
    },
  },
  {
    id: 'ui-data-table--default',
    async interact(page) {
      const table = page.locator('[data-component-role="data-table"]');
      await table.waitFor({ state: 'visible' });
      assert.equal(await table.locator('[role="columnheader"]').count(), 5);
      assert.equal(await table.locator('[role="row"]').count(), 4); // header plus three rows

      // The action glyphs are white artwork masked into the button's own
      // colour. An unquoted url() token — which a bundler-inlined data URI
      // produces — fails to parse, and the declaration is dropped silently:
      // the background colour survives and the icon renders as a filled
      // square. Asserting the computed mask is what catches that.
      const glyph = table.locator('button[aria-label="Download"] span').first();
      const mask = await glyph.evaluate((node) => getComputedStyle(node).maskImage);
      assert.ok(mask.startsWith('url('), `expected a mask image, got ${mask}`);
    },
  },
  {
    id: 'ui-data-table--selectable',
    async interact(page) {
      const table = page.locator('[data-component-role="data-table"]');
      await table.waitFor({ state: 'visible' });

      const rows = table.locator('[role="row"][data-selected]');
      assert.equal(await rows.count(), 3);
      assert.equal(await rows.first().getAttribute('data-selected'), 'false');

      // The native control is laid over the styled box rather than collapsed to
      // nothing, so it is what a pointer actually hits.
      await rows.first().locator('input[type="checkbox"]').click();
      assert.equal(await rows.first().getAttribute('data-selected'), 'true');

      await page.locator('[data-testid="table-select-all"]').click();
      assert.equal(await rows.nth(2).getAttribute('data-selected'), 'true');
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
