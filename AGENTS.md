# AGENTS.md — YCO Collab Space

This repository generates reviewable React prototypes from PM-owned product inputs and,
later, Designer-owned Figma and token inputs.

## Read first

1. Read `prototype.config.json`.
2. Read `collab-space.map.yaml`; it is the machine-readable authority for stages,
   actors, artifacts and path boundaries.
3. For generation, run `npm run feature:digest -- <feature>` and read
   `.collab-cache/features/<feature>/digest.md`: the contract, the resolved surface
   with presence, every role's reuse resolution, the shared component APIs, the
   canonical decisions, open gaps and i18n keys. Read `product/prd.md`,
   `product/validation.yaml` and `product/mocks/**` alongside it. For Intake, read
   `product/research/brief.md` first when it exists, then the feature's `product/**`.
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
- `platform/rd-baseline/**`: vendored read-only RD source. Allowed files are the
  component contracts' `rd.sourcePaths` and the migration manifest's explicit
  site-map/page-entry derivation sources. `validate:snapshot` checks this inventory;
  `validate:rd-parity` additionally checks local equivalence for `verbatimFiles`.
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
- Generated code contains no hardcoded user-facing strings. Copy comes from
  `product/i18n.json` through `platform/runtime/i18n.js`, keyed the way RD keys it.
- Shared components in `platform/ui/**` take copy through props with English defaults;
  they never translate internally.
- A component role a catalogued shared component already covers must reuse it. Record
  the resolution in `surface-intent.yaml` `componentReuse[]`.
- `product/payload-samples/**` is optional, PM-owned and must be de-identified. It never
  reaches the public build.
- Missing design decisions go into `design/design-gaps.yaml`.
- Ports, routes, URLs and viewports come from `prototype.config.json`.
- A PASS requires an HTTP-rendered browser check and a clean browser console.
- Generated code is committed with input and generator metadata.
- PM temporary media belongs in `product/mock-assets/**` and cannot reach `design-final`.
- Designer uploads media into `design-library/assets/<type>/<collection>/`; the feature
  selects a collection in natural language and `generation.json` pins exact files/hashes.
- Stage approvals must use `stage:transition`; never infer approval from prose or edit
  `releases.json` by hand.
- `surface-intent.yaml` declares the complete composition; `layoutIntent.presence`
  marks what is not on screen before an interaction (`on-interaction`, `conditional`,
  `deferred` with a reason). The rendered check asserts only the at-rest set. Never
  satisfy a structure failure by forcing a dialog open or deleting a zone.
- `product/decisions.md` keeps `## Decisions` canonical — rewrite a bullet in place when
  it changes — and appends each PM pass to `## Review log`. The digest reads only the
  canonical sections.
- `product/i18n.json` keys authored before generation carry `status: planned`; after
  generation every key must be used.
- `product/research/**` and `product/wireframe/**` are PM review material, excluded
  from the generation input hash. A confirmed brief must be cited by `intake.md`.
- A generation ends with `npm run prototype:finish -- <feature> --adapter <adapter>
  --model <model-id>`; `generation.json` without an adapter and model is not evidence.
- Fix loops run through the validator role, re-run only failing checks, and stop after
  three rounds or when the same check fails twice in a row.

## Commands

```bash
npm run dev
npm run validate
npm run validate:intake -- --feature <feature>
npm run build
npm run library:browser
npm run library:components
npm run test:surfaces # after npm run build; starts its own preview server
npm run validate:rd-parity
npm run test:rendered -- --feature <feature>
npm run prototype:create -- <feature> "<Feature title>"
npm run feature:digest -- <feature>
npm run prototype:check:fast -- <feature> [--check a,b] [--viewport name] [--no-build]
npm run rendered:summary -- <feature>
npm run prototype:finish -- <feature> --adapter <adapter> --model <model-id> [--usage '{...}'] [--skip-guard]
npm run workflow:begin -- <workflow> <feature>   # also written by Claude's prompt hook
npm run workflow:end
npm run stage:transition -- --feature <feature> --to <stage> --actor <actor> --confirm
npm run eval:workflow -- --case collab-space-readiness-regression
npm run eval:workflow -- --case cloud-storage-regression
npm run eval:mutations
```

The user-facing AI workflows are `/prototype-research`, `/prototype-intake`,
`/prototype-wireframe`, `/prototype-update` and `/prototype-revise`, each taking a
feature slug. `/prototype-promote` shows the evidence and runs `stage:transition` after
the named role confirms. Procedures live in `agent-adapters/workflows/`; the Claude
harness (hooks, sub-agents, context packs) is described in `CLAUDE.md`.
