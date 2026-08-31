---
name: prototype-intake
description: Interview the PM, resolve reuse/hybrid/novel surface intent, and prepare confirmed source-of-truth files before YCO prototype generation.
---

# Prototype Intake

Read `../../../AGENTS.md`, `../../../prototype.config.json` and
`../../../agent-adapters/workflows/prototype-intake.md` completely before acting.

Treat the requested feature slug as the only target. Ask adaptive questions, preserve
confirmed decisions and show a confirmation summary before changing PM source files.

Never edit `generated/**`. A novel feature does not need a Surface Pack. Do not report
Intake completion until `npm run validate:intake -- --feature <feature>` passes.

