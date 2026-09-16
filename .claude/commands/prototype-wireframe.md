---
description: Low-cost layout review before React generation — zones and roles on a static wireframe the PM approves
argument-hint: <feature>
---

Read and follow `agent-adapters/workflows/prototype-wireframe.md` for `$ARGUMENTS`.

If `.prototype-state/active-workflow.json` does not say `prototype-wireframe` for this
feature, run `npm run workflow:begin -- prototype-wireframe <feature>` first.

Write only under `features/<feature>/product/wireframe/**`. The wireframe is review
material: no React, no tokens beyond names, no generated code. Layout decisions the PM
takes on it are recorded by `/prototype-revise` or `/prototype-intake` into
`surface-intent.yaml` and `decisions.md`, not here.
