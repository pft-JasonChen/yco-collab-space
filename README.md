# YCO Collab Space

Shared React prototype collaboration space for PM review and later Designer/RD/QA
handoff.

不同角色第一次使用時，請先閱讀
[`COLLABORATION.md`](COLLABORATION.md)：包含跨部門流程圖、角色責任、
source-of-truth 地圖、操作方式、目前限制與 repo 使用原則。

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

Review and approve `product/prototype.contract.yaml` before generation. Do not edit
`generated/` by hand.

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

Phase 0.5 includes Intake, flexible Surface resolution and workflow evaluation. It does
not yet include Figma ingestion, YCO-spec generation, automatic promotion,
repository-policy enforcement or protected preview URLs. See `docs/phase0-scope.md`.
