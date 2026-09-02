# Product page spec-compliance review workflow

Input: one page slug and a `generated/content.json` to review.

## Independence rules

- The reviewer is a **separate subagent**. It must run on a different model than the
  builder that wrote content.json (`agent-adapters/model-policy.example.json` →
  `specComplianceReview.mustDifferFromBuilder`). Record both model ids.
- The reviewer receives only the inputs listed in
  `product-library/review/spec-compliance-rubric.md`. Do not pass it the builder's reasoning,
  layout.json or strapi-payload.json.
- The reviewer never edits files other than `generated/review/spec-compliance.json`.

## Reviewer prompt (give this to the subagent)

```text
You are the independent spec-compliance reviewer for product page <page>.
Read, in this order:
  1. product-library/review/spec-compliance-rubric.md
  2. product-library/messaging/claim-rules.md and brand-voice.md
  3. product-pages/<page>/source/page.source.yaml and brief.md
  4. every features/<feature>/product/{intake.md,prd.md,prototype.contract.yaml,decisions.md} listed in upstream.features
  5. every product-library/products/<slug>/product.yaml (+ cited pages/*.md) listed in upstream.products
  6. product-pages/<page>/generated/content.json
For every sentence in content.json decide whether it is fully supported by the cited
sourceRefs. Report each unsupported capability, limit, platform, number or comparison as
a finding with a JSON pointer path. Write the result to
product-pages/<page>/generated/review/spec-compliance.json following
tools/product-page/schemas/spec-review.schema.json, with contentHash = sha256 of
content.json (run: shasum -a 256 product-pages/<page>/generated/content.json), reviewer.model
= your own model id, builder.model = "<builder-model>", independentOfBuilder = true.
Do not modify any other file.
```

## After the reviewer returns

```bash
npm run page:validate:pages -- --page <page>
```

- `fail` → the builder fixes only what the findings name, then a fresh review runs.
- `pass-with-notes` → continue; PM sees the notes at the next stage transition.
- `pass` → continue.

Any edit to content.json invalidates the review because `contentHash` no longer matches.
