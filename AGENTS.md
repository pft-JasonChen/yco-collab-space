# AGENTS.md — YCO Collab Space

This repository generates reviewable React prototypes from PM-owned product inputs and,
later, Designer-owned Figma and token inputs.

## Read first

1. Read `prototype.config.json`.
2. Read the target feature's `product/intake.md`, `product/prd.md`,
   `product/prototype.contract.yaml`, `product/surface-intent.yaml`,
   `product/decisions.md` and `product/validation.yaml`.
3. Read `design/design-gaps.yaml`.
4. Resolve the feature's `reuse`, `hybrid` or `novel` Surface context.
5. Never infer a backend or production API from mock data.

## Source-of-truth boundaries

- `features/*/product/**`: PM-owned product behaviour and fake-data requirements.
- `features/*/design/**`: design references and explicitly recorded gaps.
- `features/*/generated/**`: AI-generated derived code. Do not hand-edit it outside an
  explicit `prototype-update` run.
- `platform/**` and `tools/**`: shared platform code. Changes require the Prototype
  Platform Owner's approval.

Phase 0 documents these boundaries but does not enforce CODEOWNERS yet.

## Hard rules

- Prototype data is synthetic. Do not call a backend, production API or test API.
- Never copy `.env*`, credentials, certificates, keys, `node_modules` or build output
  from the RD snapshot.
- RD token CSS under `platform/tokens/rd/**` is immutable upstream input.
- Feature styles use existing CSS variables. Do not invent token names or raw colours.
- Missing design decisions go into `design/design-gaps.yaml`.
- Ports, routes, URLs and viewports come from `prototype.config.json`.
- A PASS requires an HTTP-rendered browser check and a clean browser console.
- Generated code is committed with input and generator metadata.

## Commands

```bash
npm run dev
npm run validate
npm run validate:intake -- --feature <feature>
npm run build
npm run test:rendered -- --feature <feature>
npm run prototype:create -- <feature> "<Feature title>"
npm run eval:workflow -- --case collab-space-readiness-regression
npm run eval:mutations
```

The user-facing AI workflows are `/prototype-intake <feature>` and
`/prototype-update <feature>`. Phase 0 reserves
`/prototype-promote` but does not automate promotion.
