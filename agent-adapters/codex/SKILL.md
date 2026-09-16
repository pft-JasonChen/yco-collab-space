---
name: prototype-update
description: Generate or update one feature in yco-collab-space from approved PM inputs, then run deterministic and rendered validation.
---

# Prototype update

Read `../../AGENTS.md`, `../../prototype.config.json` and
`../workflows/prototype-update.md` completely before acting.

Treat the user's feature slug as the only target. Start from
`npm run feature:digest -- <feature>`. Keep product and design inputs read-only.
Generated React/SCSS and evidence are derived output, written one layer at a time.

Run gates through the validator role described in `subagents.md` and finish with
`npm run prototype:finish -- <feature> --adapter codex --model <model-id>`.

Do not report completion without a rendered HTTP check, interaction assertions,
multi-viewport screenshots and a clean console.
