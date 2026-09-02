---
name: product-page-generate
description: Generate one YCO product page from confirmed PM spec, Designer patterns and the RD Strapi registry, with an independent spec-compliance review, then validate it.
---

# Product page generate

Read `../../../AGENTS.md` and `../../../agent-adapters/workflows/product-page-generate.md`
completely before acting. Follow the three role-owned skills in order:
`product-library/skills/spec-to-content`, `design-library/skills/page-layout`,
`strapi/skills/content-to-strapi`. Spawn the reviewer described in
`agent-adapters/workflows/product-page-review.md` on a different model than yourself.
Write only under `product-pages/<page>/generated/**`. Do not report completion until
`npm run page:validate -- --page <page>` passes.
