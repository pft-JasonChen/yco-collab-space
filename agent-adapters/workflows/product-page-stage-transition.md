# Product page stage transition workflow

Input: one page slug and one requested target stage
(`page-generated`, `page-pm-review`, `page-strapi-draft`, `page-published`, or back to `page-brief`).

1. Read `collab-space.map.yaml` (product-page track), `product-pages/<page>/releases.json`
   and `generated/generation.json`.
2. Explain what the target stage means and who must approve it.
3. Show the evidence being approved: input hash, builder and reviewer models, review
   verdict and notes, selected media (flag any `mock:` asset), Strapi publish evidence if any.
4. Stop if the review verdict is `fail`, the generation is stale, or a temporary asset is
   still selected for `page-pm-review` or later.
5. Wait for explicit confirmation from the named human role in this conversation.
6. Record it:

   ```bash
   npm run page:stage:transition -- --page <page> --to <stage> --actor <actor> --confirm
   ```

7. If another actor is still required (for example RD on `page-published`), report the
   remaining approval. Do not impersonate it.

Humans should not edit `releases.json` directly.
