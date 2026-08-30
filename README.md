# YCO Prototype Factory

React prototype factory for PM review and later Designer/RD/QA handoff.

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
/features/factory-readiness/
```

## Create a feature

```bash
npm run prototype:create -- my-feature "My Feature"
```

Then ask a supported AI agent to run:

```text
/prototype-update my-feature
```

Review and approve `product/prototype.contract.yaml` before generation. Do not edit
`generated/` by hand.

## Validate in a browser

Install a compatible Playwright Chromium once, or set `PLAYWRIGHT_BROWSERS_PATH` to an
existing compatible cache.

```bash
npm run test:rendered -- --feature factory-readiness
```

Evidence is written below the feature's `evidence/` directory.

## Preview deployment

`vercel.json` builds the static Vite output, adds SPA fallback routing and marks every
preview `noindex`. The repository contains no backend function or runtime secret.

Vercel project linking is intentionally not automated until the repository owner logs
in and approves the destination project.

## Current limits

Phase 0 does not yet include Figma ingestion, YCO-spec generation, automatic promotion,
repository-policy enforcement or protected preview URLs. See `docs/phase0-scope.md`.
