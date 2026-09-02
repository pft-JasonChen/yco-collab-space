# AGENTS.md — YCO Collab Space

This repository generates reviewable React prototypes from PM-owned product inputs and,
later, Designer-owned Figma and token inputs.

## Read first

1. Read `prototype.config.json`.
2. Read `collab-space.map.yaml`; it is the machine-readable authority for stages,
   actors, artifacts and path boundaries.
3. Read the target feature's `product/intake.md`, `product/prd.md`,
   `product/prototype.contract.yaml`, `product/surface-intent.yaml`,
   `product/decisions.md` and `product/validation.yaml`.
4. Read `product/media-intent.yaml`, `design/design-gaps.yaml` and `releases.json`.
5. Index only the Design Library collections named in media intent; do not search every asset.
6. Resolve the feature's `reuse`, `hybrid` or `novel` Surface context.
7. Never infer a backend or production API from mock data.

## Source-of-truth boundaries

- `features/*/product/**`: PM-owned product behaviour and fake-data requirements.
- `design-library/**`: Designer-owned shared assets, tokens, components and patterns.
- `features/*/design/**`: design references and explicitly recorded gaps.
- `features/*/generated/**`: AI-generated derived code. Do not hand-edit it outside an
  explicit `prototype-update` run.
- `platform/**` and `tools/**`: shared platform code. Changes require the Prototype
  Platform Owner's approval.
- `.collab-cache/**`: generated local indexes. Never commit or publish them.

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
- PM temporary media belongs in `product/mock-assets/**` and cannot reach `design-final`.
- Designer uploads media into `design-library/assets/<type>/<collection>/`; the feature
  selects a collection in natural language and `generation.json` pins exact files/hashes.
- Stage approvals must use `stage:transition`; never infer approval from prose or edit
  `releases.json` by hand.

## Product-page track

`collab-space.map.yaml` entries with `track: product-page` govern product pages under
`product-pages/<page>/`. Read `product-pages/README.md` and the workflow in
`agent-adapters/workflows/product-page-generate.md` before touching them.

- PM owns `product-library/**` and `product-pages/<page>/source/**`; Designer owns
  `design-library/patterns/product-page/**`; RD owns `strapi/**`. The agent writes only
  `product-pages/<page>/generated/**` and `evidence/**`.
- Every generated claim needs `sourceRefs`; an independent reviewer subagent on a different
  model must pass before layout and payload are accepted.
- Only registered Strapi components, Designer patterns and locked RD tokens may be used.
- Strapi automation creates drafts only; `publishedAt` is forbidden and credentials never
  enter the repository.

## Commands

```bash
npm run dev
npm run validate
npm run validate:intake -- --feature <feature>
npm run build
npm run library:browser
npm run test:rendered -- --feature <feature>
npm run prototype:create -- <feature> "<Feature title>"
npm run stage:transition -- --feature <feature> --to <stage> --actor <actor> --confirm
npm run eval:workflow -- --case collab-space-readiness-regression
npm run eval:mutations
npm run page:validate -- --page <page>
npm run page:record -- --page <page> --adapter <adapter> --model <model>
npm run page:publish -- --page <page> [--confirm]
npm run page:stage:transition -- --page <page> --to <stage> --actor <actor> --confirm
```

The user-facing AI workflows are `/prototype-intake <feature>` and
`/prototype-update <feature>`. Phase 0 reserves
`/prototype-promote` but does not automate promotion. Product pages use
`/product-page-brief`, `/product-page-generate`, `/product-page-review`,
`/product-page-publish` and `/product-page-promote`.
