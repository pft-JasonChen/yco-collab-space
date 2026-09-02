# Claim rules（draft for PM review）

These rules decide what the generator may write and what the reviewer must reject.

## Allowed

- Capabilities listed in `features/<feature>/product/prd.md` or `product.yaml.features`.
- Steps that match the feature contract states and actions in order.
- Use cases listed in the feature spec or `product.yaml.useCases`.
- Output formats, limits and plans only when the spec states them.

## Requires a source line

- Any number (ratings, counts, durations, resolutions, prices).
- Any comparison ("faster than", "unlike other tools") — must cite a competitor analysis and stay about positioning, not about a competitor's defects.
- Any platform mention (TikTok, Reels, Shorts) — must appear in the spec or product library.

## Forbidden

- Capabilities that are not in the spec, even if plausible (e.g. "voice sync", "4K export") — this is the primary "exceeds PM spec" failure.
- Superlatives without evidence: best, #1, most accurate, fastest.
- Promises about privacy, safety or legal outcomes unless the spec provides approved wording.
- Anything that implies real-person impersonation is a supported use.
- Placeholder text ("lorem ipsum", "TBD") in any customer-facing field.
