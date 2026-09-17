---
description: Generate or update one YCO React prototype from approved source inputs
argument-hint: <feature>
---

Follow `agent-adapters/workflows/prototype-update.md` exactly for `$ARGUMENTS`.

The runnable Claude Code command is `.claude/commands/prototype-update.md`. Use the
current configured high-capability Claude model to generate, the `prototype-validator`
sub-agent for every gate run, and `npm run prototype:finish` to record the model id.
Do not modify product or design source files.
