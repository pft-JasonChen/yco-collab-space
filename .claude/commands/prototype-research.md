---
description: Research one feature before Intake — production audit, competitive teardown and a sourced UX proposal
argument-hint: <feature> "<one-line need>"
---

Read and follow `agent-adapters/workflows/prototype-research.md` for `$ARGUMENTS`.

If `.prototype-state/active-workflow.json` does not say `prototype-research` for this
feature, run `npm run workflow:begin -- prototype-research <feature>` first.

Delegate the browser work to the `prototype-researcher` sub-agent. The main context reads
only the returned brief. Write nothing outside `features/<feature>/product/research/**`.
The brief stays `Status: draft` until the PM confirms it here.
