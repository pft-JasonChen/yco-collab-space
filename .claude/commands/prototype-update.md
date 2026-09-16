---
description: Generate or update a feature prototype and validate it
argument-hint: <feature>
---

Read and follow `agent-adapters/workflows/prototype-update.md` for `$ARGUMENTS`.

If `.prototype-state/active-workflow.json` does not say `prototype-update` for this
feature, run `npm run workflow:begin -- prototype-update <feature>` first.

Start from `npm run feature:digest -- <feature>` and the update context pack in
`CLAUDE.md`. Run gates through the `prototype-validator` sub-agent and follow the fix
loop limits. Finish with `npm run prototype:finish -- <feature> --adapter claude
--model <model-id> --usage '{"inputTokens":…,"outputTokens":…,"rounds":…}'`; the Stop
hook will not let the turn end without it.
