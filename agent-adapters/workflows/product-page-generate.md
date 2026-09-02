# Product page generate workflow

Input: one page slug. Any role (PM, Designer, RD) may trigger it; the flow is identical
because the safety boundary is which paths may be written, not who runs it.

## Boundary

Writable: `product-pages/<page>/generated/**`, `product-pages/<page>/evidence/**`,
`.prototype-state/**`, `.collab-cache/**`. Everything else is read-only. If a role-owned
source needs a change, stop and report which owner must change which file.

## Procedure

1. Read `AGENTS.md`, `collab-space.map.yaml`, `product-pages/<page>/source/page.source.yaml`
   and `brief.md`. Stop if `status` is not `confirmed`.
2. Run:

   ```bash
   npm run page:validate:pages -- --page <page>
   npm run page:binding
   npm run library:product:index
   npm run page:update:begin -- <page>
   ```

   The snapshot fails the run later if any protected source changes during generation.
3. **Stage A — content.** Read `product-library/skills/spec-to-content/SKILL.md` and follow it
   exactly. Write `generated/content.json`. Record which model you are (builder model).
4. **Harness A — independent review.** Follow `agent-adapters/workflows/product-page-review.md`:
   spawn a reviewer subagent that is a different model from the builder (see
   `agent-adapters/model-policy.example.json` → `specComplianceReview`). It writes
   `generated/review/spec-compliance.json`. If the verdict is `fail`, fix content.json using
   only the findings, and re-run the review. Maximum three review rounds; then stop and report.
5. **Stage B — layout.** Read `design-library/skills/page-layout/SKILL.md`; write
   `generated/layout.json` with `contentHash` = sha256 of content.json.
6. **Stage C — Strapi payload.** Read `strapi/skills/content-to-strapi/SKILL.md` and
   `strapi/mapping/rules.md`; write `generated/strapi-payload.json`.
7. Run:

   ```bash
   npm run page:update:check -- <page>
   npm run page:record -- --page <page> --adapter <adapter> --model <builder-model>
   npm run page:validate -- --page <page>
   ```

   Every `[content]`, `[layout]`, `[payload]`, `[review]` or `[generation]` error blocks the run.
   Fix only files under `generated/**`, re-record, re-validate.
8. Optionally run `npm run page:publish -- --page <page>` **without** `--confirm` to show the
   dry-run summary (assets to upload, sections, component uids).
9. Report: builder model, reviewer model and verdict, input hash, sections and their
   patterns/components, selected media (shared / design-library / mock), warnings, and the
   dry-run summary. Never record a stage approval; the PM confirms
   `/product-page-promote <page> page-generated` separately.

## If a role's source is insufficient

| Symptom | Owner to notify | Where |
|---|---|---|
| A claim the PM wants has no spec source | PM | `features/<feature>/product/prd.md` or `product-library/products/<slug>/product.yaml` |
| No pattern for a content role, or copy limits too tight | Designer | `design-library/patterns/product-page/` |
| Payload needs a field or component the registry lacks | RD | `strapi/components/`, `strapi/mapping/rules.md` |

Do not work around a gap by editing the owner's file yourself.
