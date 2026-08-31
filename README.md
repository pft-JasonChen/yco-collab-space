# YCO Collab Space

Shared React prototype collaboration space for PM review, Designer refinement and
evidence-bound RD／QA handoff.

不同角色第一次使用時，請先閱讀
[`COLLABORATION.md`](COLLABORATION.md)：包含跨部門流程圖、角色責任、
source-of-truth 地圖、操作方式、目前限制與 repo 使用原則。

Designer 與 RD 規劃 Phase 1 Design System Foundation 時，請閱讀
[`docs/design-system/phase1-designer-rd-foundation-guide.md`](docs/design-system/phase1-designer-rd-foundation-guide.md)。

## What it does

- PM owns PRD, executable feature contract, validation and fake data.
- AI generates React and SCSS into a committed `generated/` folder.
- Designer can later supply Figma and design tokens without editing prototype code.
- RD can inspect the entire private repository and reuse presentational UI code.
- Every prototype is static and uses mock data only.

## Phase 0 quick start

Prerequisites:

- Node.js 22.12 or newer
- npm

```bash
npm install
npm run validate
npm run build
npm run dev
```

Open the URL printed by the dev command. Ports and feature route prefixes live in
`prototype.config.json`.

The built-in readiness feature is:

```text
/features/collab-space-readiness/
```

## Create a feature

```bash
npm run prototype:create -- my-feature "My Feature"
```

First ask a supported AI agent to run:

```text
/prototype-intake my-feature
```

Intake asks for the problem, review goal, states, fake data, acceptance and a
`reuse`／`hybrid`／`novel` surface strategy. A novel feature does not need an existing
Surface Pack. Confirm the Intake summary before source files are written.

When Intake passes, run:

```text
/prototype-update my-feature
```

The update workflow snapshots `product/**` and `design/**` before generation and fails
if either source tree changes while React／SCSS is being generated.

若功能需要共用圖片、icon或影片，PM只要在需求中說「請 index
`assets/<type>/<collection>`」；Designer把檔案上傳至相同的
`design-library/assets/<type>/<collection>/`。Designer不需要寫 manifest，實際採用檔案與
hash會自動記錄在 `generation.json`。PM第一版暫時素材可放在
`features/<feature>/product/mock-assets/`，但不能進入 design-final。

Review and approve `product/prototype.contract.yaml` before generation. Do not edit
`generated/` by hand.

本機瀏覽所有 Designer collections：

```bash
npm run library:browser
```

頁面只綁定 `127.0.0.1`，不會被打進公開 prototype。

## Review stage

PM／Designer可直接用自然語言請 Agent「把 `<feature>` 送到 PM review／design review／
design final」。Agent會先列出本次輸入、token、素材 selection與 gaps，再等待必要角色明確
同意。維護者使用的底層指令是：

```bash
npm run stage:transition -- --feature <feature> --to <stage> --actor <actor> --confirm
```

正式角色、階段與路徑速查由契約生成：
[`docs/generated/collab-space-reference.md`](docs/generated/collab-space-reference.md)。

## Validate in a browser

Install a compatible Playwright Chromium once, or set `PLAYWRIGHT_BROWSERS_PATH` to an
existing compatible cache.

```bash
npm run test:rendered -- --feature collab-space-readiness
```

Evidence is written below the feature's `evidence/` directory.

## Evaluate the generation workflow

```bash
npm run eval:workflow -- --case collab-space-readiness-regression
npm run eval:mutations
npm run eval:visual:packet -- --feature collab-space-readiness
```

- Workflow eval runs in a clean isolated workspace and fails if PM／Designer source
  changes, any deterministic gate fails or rendered behavior fails.
- Mutation eval deliberately injects known failures and requires every grader to catch
  them.
- Visual packet gathers the rendered screenshots and Surface rubric for an independent
  human or multimodal judge. It stays `human-required` until calibrated labels exist.

Run artifacts are written to the ignored `evals/runs/` directory.

## Preview deployment

`vercel.json` builds the static Vite output, adds SPA fallback routing and marks every
preview `noindex`. The repository contains no backend function or runtime secret.

Vercel project linking is intentionally not automated until the repository owner logs
in and approves the destination project.

## Current limits

目前已包含 Intake、flexible Surface resolution、shared Design Library、素材／token
provenance、stage approval gate與 workflow evaluation。仍未包含自動 Figma API ingestion、
YCO-spec adapter、human Git path enforcement或 protected preview URLs。見
`docs/phase0-scope.md`。
