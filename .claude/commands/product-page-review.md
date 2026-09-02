---
description: Run the independent spec-compliance reviewer on a generated product page
argument-hint: <page>
---

Read and follow `agent-adapters/workflows/product-page-review.md` for `$ARGUMENTS`.

Spawn the reviewer as a separate subagent on a different model than the builder. It may
write only `generated/review/spec-compliance.json`.
