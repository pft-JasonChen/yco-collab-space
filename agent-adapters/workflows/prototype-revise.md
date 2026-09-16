# Prototype Revise workflow

Input: one feature slug and the PM's review feedback, in the PM's words.

Revise is the loop between a generated prototype and the next PM review. It replaces
"edit the source, then run the whole update again". It may change PM source and it may
regenerate code, but only what the feedback touches, and it ends by re-recording
provenance.

## Boundary

- May write `features/<feature>/product/**`, `design/design-gaps.yaml`,
  `generated/**` and `evidence/**`.
- Never edits `platform/**`, the Design Library or `collab-space.map.yaml`.
- Does not take a source-guard snapshot: product edits are the point. It therefore
  finishes with `--skip-guard`, and the new input hash is what the re-record binds.
- Never records or infers a stage approval.

## Procedure

1. Run `npm run feature:digest -- <feature>` and read the digest. Do not read the whole
   product folder; read a source file only when a feedback item maps to it.
2. Triage the feedback into a table before changing anything:

   | # | Feedback (PM's words) | Kind | Source file to change | Generated layer affected |
   |---|---|---|---|---|

   Kinds: `behaviour` (contract states／actions／acceptance, PRD, validation),
   `layout` (surface-intent zones／roles／presence, PRD), `copy` (i18n.json), `data`
   (mocks), `visual` (design gap — not a source change), `question` (needs a PM
   answer before anything is written).
   Show the table and wait for the PM to confirm the mapping when any item is a
   `question` or would reverse a recorded decision.
3. Apply the source delta:
   - `decisions.md`: rewrite the affected bullets in `## Decisions` in place so the
     section stays canonical, and append one dated entry to `## Review log` that lists
     what changed and why, in the PM's words. Never append "replaces the above" to
     Decisions.
   - Contract, validation, PRD, surface-intent, i18n, mocks: change only the entries the
     table names. A new acceptance criterion needs its validation check in the same
     pass. A new i18n key may carry `status: planned` until generation uses it.
   - A `visual` item becomes a design gap, not a code change.
4. Run `npm run validate:intake -- --feature <feature>`. A red intake gate stops the
   pass before any generated file changes.
5. Regenerate only the layers in the table. Layers follow the RD anatomy:
   `settings/` or `data/` for composition and product data, `index.jsx` for
   orchestration, `contract/` for handoff. Leave untouched layers byte-identical.
6. Fix loop through the validator sub-agent, with the limits in the update workflow:
   fast gate, re-run only failing checks, three rounds, stop when the same check fails
   twice.
7. Finish:

   ```bash
   npm run prototype:finish -- <feature> --adapter <adapter> --model <model-id> --skip-guard --usage '{"inputTokens":0,"outputTokens":0,"rounds":0}'
   npm run build
   ```

8. Report: the triage table with what was done per row, the diff summary per layer,
   new or planned i18n keys, new design gaps, gate results and the preview URL. Then
   ask whether the PM wants a stage transition; do not run one.

## Stop conditions

- A feedback item would reverse a decision that has a recorded decision basis and the
  PM has not confirmed the reversal.
- A feedback item needs a new shared component; propose a Platform Owner change instead.
- The intake gate is red after the source delta.
