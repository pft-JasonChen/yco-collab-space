---
name: prototype-update
description: Generate or update one YCO React prototype from approved PM inputs, then run deterministic and rendered validation.
---

# Prototype update

Read `../../../AGENTS.md`, `../../../prototype.config.json` and
`../../../agent-adapters/workflows/prototype-update.md` completely before acting.

Treat the requested feature slug as the only target. Start from
`npm run feature:digest -- <feature>` instead of reading the whole product folder.
Keep `product/**` and `design/**` read-only during generation. Write derived React and
SCSS only under `generated/**`, one layer at a time.

Run the fix loop through the validator role (`../../../agent-adapters/codex/subagents.md`):
`prototype:check:fast`, then `rendered:summary`, re-run only failing checks, at most
three rounds. Finish with `npm run prototype:finish -- <feature> --adapter codex --model
<model-id>`; a run without recorded provenance is unfinished.

Do not report completion without an HTTP-rendered browser check, interaction
assertions, configured multi-viewport screenshots and a clean browser console.
