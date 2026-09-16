---
description: Interview PM and prepare confirmed prototype source inputs
argument-hint: <feature>
---

Read and follow `agent-adapters/workflows/prototype-intake.md` for `$ARGUMENTS`.

If `.prototype-state/active-workflow.json` does not say `prototype-intake` for this
feature, run `npm run workflow:begin -- prototype-intake <feature>` first.

Read the context pack for intake in `CLAUDE.md`; do not read `generated/**` or platform
source. If `product/research/brief.md` exists, read it before asking any question and
ask which recommendations the PM adopts.

Do not write confirmed PM source until the PM approves the Intake summary. Never edit
`generated/**` during Intake. After `validate:intake` passes, ask the
`prototype-reviewer` sub-agent to score the intake rubric and report its JSON with the
gate result.
