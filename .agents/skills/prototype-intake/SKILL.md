---
name: prototype-intake
description: Interview the PM, resolve reuse/hybrid/novel surface intent, and prepare confirmed source-of-truth files before YCO prototype generation.
---

# Prototype Intake

Read `../../../AGENTS.md`, `../../../prototype.config.json` and
`../../../agent-adapters/workflows/prototype-intake.md` completely before acting.

Treat the requested feature slug as the only target. If `product/research/brief.md`
exists, read it before asking any question. Ask adaptive questions, preserve confirmed
decisions and show a confirmation summary before changing PM source files.

Declare the full composition in `surface-intent.yaml` and mark what is not at rest in
`layoutIntent.presence`. Author `i18n.json` keys with `status: planned`.

Never edit `generated/**`. A novel feature does not need a Surface Pack. Do not report
Intake completion until `npm run validate:intake -- --feature <feature>` passes and the
reviewer role (see `../../../agent-adapters/codex/subagents.md`) has returned its rubric
JSON.
