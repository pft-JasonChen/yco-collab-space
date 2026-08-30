---
name: prototype-update
description: Generate or update one YCO React prototype from approved PM inputs, then run deterministic and rendered validation.
---

# Prototype update

Read `../../../AGENTS.md`, `../../../prototype.config.json` and
`../../../agent-adapters/workflows/prototype-update.md` completely before acting.

Treat the requested feature slug as the only target. Keep `product/**` and `design/**`
read-only during generation. Write derived React and SCSS only under `generated/**`,
then record provenance and run every deterministic and rendered gate.

Do not report completion without an HTTP-rendered browser check, interaction
assertions, configured multi-viewport screenshots and a clean browser console.
