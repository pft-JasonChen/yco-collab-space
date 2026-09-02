# Spec-compliance rubric（PM-owned）

Used by the independent reviewer subagent in `/product-page-review`. The reviewer reads the
PM spec and `content.json`, then returns `generated/review/spec-compliance.json`
(`tools/product-page/schemas/spec-review.schema.json`).

## What the reviewer receives

- `features/<feature>/product/{intake.md, prd.md, prototype.contract.yaml, decisions.md}` for every upstream feature;
- `product-library/products/<slug>/product.yaml` and cited page snapshots;
- `product-library/messaging/claim-rules.md`, `brand-voice.md`;
- `product-pages/<page>/source/{page.source.yaml, brief.md}`;
- `generated/content.json` and its sha256.

The reviewer must not receive the builder's reasoning, the layout or the Strapi payload.

## Findings

Every finding has `severity`, `path` (JSON pointer into content.json), `type`, `evidence`.

| type | severity | Meaning |
|---|---|---|
| `exceeds-spec` | blocker | Claims a capability, limit, platform, format or benefit not in any cited source. |
| `contradicts-spec` | blocker | States something the spec says otherwise (wrong step order, wrong model name). |
| `unsupported-number` | blocker | A number without a source line. |
| `missing-required` | major | A section the page.source.yaml `requiredSections` lists is absent or empty. |
| `weak-source` | major | `sourceRefs` exist but do not actually support the sentence. |
| `competitor-as-capability-source` | major | A product capability cites only a competitor file. |
| `voice` | minor | Violates brand-voice.md (tone, superlatives, vocabulary). |
| `length` | minor | Copy obviously too long for the section role. |

## Verdict

- `pass`: no blocker, no major.
- `pass-with-notes`: no blocker, at most 2 major, PM may accept.
- `fail`: any blocker or 3+ major. The generate workflow must revise content and re-review.

## Independence

- The reviewer records its own `model` and the builder's `model`; they must differ.
- The verdict is bound to `contentHash`; any content change invalidates the review.
- The reviewer never edits content; it only reports.
