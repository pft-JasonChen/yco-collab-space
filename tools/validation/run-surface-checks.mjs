import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { publicSurfaceIndex } from "../design-library/surface-bindings.mjs";
import { fromRoot, readJson } from "../prototype-cli/project.mjs";

const config = await readJson("prototype.config.json");
const base =
  process.env.SURFACE_TEST_URL ??
  `http://${config.server.host}:${config.server.previewPort}`;
const output =
  process.env.SURFACE_EVIDENCE_DIR ?? fromRoot("work/surface-evidence");
await fs.mkdir(output, { recursive: true });
const index = await publicSurfaceIndex();
let server;
let browser;
const errors = [];
const results = [];
try {
  if (!process.env.SURFACE_TEST_URL) {
    server = spawn(
      process.execPath,
      [
        fromRoot("node_modules/vite/bin/vite.js"),
        "preview",
        "--host",
        config.server.host,
        "--port",
        String(config.server.previewPort),
        "--strictPort",
      ],
      { cwd: fromRoot(), stdio: "ignore" },
    );
    let spawnError;
    server.on("error", (e) => {
      spawnError = e;
    });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null)
        throw new Error(
          "Surface preview server exited; the configured port may be in use.",
        );
      try {
        if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!ready) throw new Error("Surface preview server did not become ready");
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  page.on("request", (r) => {
    if (
      /^https?:/.test(r.url()) &&
      new URL(r.url()).origin !== new URL(base).origin
    )
      errors.push("Unexpected network request: " + r.url());
  });
  await page.goto(base + "/");
  await page.getByRole("link", { name: /Surface Browser/ }).click();
  await page
    .getByRole("heading", { name: "Surface Browser", exact: true })
    .waitFor();
  await page.getByRole("searchbox", { name: "搜尋" }).fill("not-found");
  assert.match(await page.locator("main").innerText(), /顯示 0 \/ 26/);
  await page.getByRole("searchbox", { name: "搜尋" }).fill("");
  await page.getByLabel("狀態", { exact: true }).selectOption("planned");
  assert.match(await page.locator("main").innerText(), /顯示 16 \/ 26/);
  await page.getByLabel("狀態", { exact: true }).selectOption("all");
  await page.getByLabel("預覽", { exact: true }).selectOption("preview");
  assert.match(await page.locator("main").innerText(), /顯示 7 \/ 26/);
  await page.screenshot({ path: path.join(output, "surface-browser.png") });
  await page.goto(
    base +
      config.routes.surfacePrefix +
      "/?" +
      new URLSearchParams({ pack: "workspace/tool-video@2026-09" }),
  );
  await page
    .getByLabel("版本", { exact: true })
    .selectOption("workspace/tool-video@2026-08");
  assert.equal(await page.locator("iframe").count(), 0);
  assert.match(
    await page.getByRole("region", { name: "Surface 詳情" }).innerText(),
    /此版本採用：無/,
  );
  await page
    .getByLabel("版本", { exact: true })
    .selectOption("workspace/tool-video@2026-09");
  await page.getByLabel("畫面尺寸").selectOption("tablet");
  assert.equal(
    await page.locator("iframe").evaluate((el) => el.style.width),
    "768px",
  );
  for (const viewport of config.viewports) {
    await page.setViewportSize(viewport);
    for (const pack of index.versions.filter((v) => v.bindings.preview)) {
      await page.goto(
        base +
          config.routes.surfacePrefix +
          "/?" +
          new URLSearchParams({ pack: pack.key, preview: "1" }),
      );
      await page.locator("[data-surface-preview]").waitFor();
      assert.equal(await page.locator("vite-error-overlay").count(), 0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert.equal(overflow, false, `${pack.key} overflow at ${viewport.name}`);
      if (pack.bindings.preview.recipe === "tool-video") {
        await page.getByRole("button", { name: "Load sample video" }).click();
        await page.getByRole("button", { name: "Remove video" }).waitFor();
        await page.getByRole("button", { name: /Generate sample/ }).click();
        await page.getByTestId("generation-processing-card").waitFor();
        await page.getByLabel("範例狀態").selectOption("failed");
        await page.getByRole("button", { name: "Retry", exact: true }).click();
        await page.getByRole("button", { name: "Open sample details" }).click();
        await page.getByRole("dialog").waitFor();
        await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("dialog").count(), 0);
        await page.screenshot({
          path: path.join(output, `tool-video-${viewport.name}.png`),
        });
      }
      if (pack.bindings.preview.recipe === "detail-modal") {
        await page.getByRole("button", { name: "Open sample details" }).click();
        await page.getByRole("dialog").waitFor();
        await page.screenshot({
          path: path.join(output, `detail-modal-${viewport.name}.png`),
        });
        await page.getByRole("button", { name: "Close video details" }).click();
      }
      results.push({ pack: pack.key, viewport: viewport.name, status: "pass" });
    }
  }
  assert.deepEqual(errors, [], "Browser console / network errors");
  await fs.writeFile(
    path.join(output, "surface-checks.json"),
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(
    `[surface-rendered] PASS ${results.length} pack/viewport checks; search, filters, version pins, state changes, dialog, console and network`,
  );
} finally {
  await browser?.close();
  server?.kill();
}
