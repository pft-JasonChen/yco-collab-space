---
description: Turn PM review feedback into a source delta and regenerate only the affected layers
argument-hint: <feature>
---

Read and follow `agent-adapters/workflows/prototype-revise.md` for `$ARGUMENTS`.

If `.prototype-state/active-workflow.json` does not say `prototype-revise` for this
feature, run `npm run workflow:begin -- prototype-revise <feature>` first.

Read the digest, not the whole product folder. Map each feedback item to the source
file it changes before touching any generated file. Rewrite `## Decisions` in place and
append the pass to `## Review log`. Regenerate only the layers the delta touches, run the
fix loop through `prototype-validator`, and finish with `npm run prototype:finish --
<feature> --adapter claude --model <model-id> --skip-guard`.
