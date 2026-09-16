---
description: Prepare PM source-of-truth inputs through the YCO Prototype Intake workflow
argument-hint: <feature>
---

Follow `agent-adapters/workflows/prototype-intake.md` exactly for `$ARGUMENTS`.

The runnable Claude Code command is `.claude/commands/prototype-intake.md`; hooks in
`.claude/settings.json` enforce the write boundary. Use the current configured
high-capability Claude model for the interview and the `prototype-reviewer` sub-agent
for the rubric. Ask adaptive questions and wait for PM confirmation before writing
confirmed source files.
