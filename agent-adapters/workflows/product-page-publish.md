# Product page publish workflow (Strapi draft)

Input: one page slug, optionally an existing Strapi entry id to update.

## Boundary

Writable: `product-pages/<page>/evidence/**` only. The payload is never edited here; if it
is wrong, go back to `/product-page-generate`.

## Procedure

1. Run `npm run page:validate -- --page <page>`. Any failure blocks publishing.
2. Read `product-pages/<page>/releases.json`. The page should be at `page-pm-review` or
   later; if it is still `page-brief`/`page-generated`, tell the PM and ask whether they
   want a draft anyway (allowed, but the PM must say so explicitly).
3. Run the dry run and show the summary to the human:

   ```bash
   npm run page:publish -- --page <page>
   ```

   List: target uid, create vs update, shared assets reused, files that will be uploaded,
   section component uids, and any `mock:` assets (they are allowed in a draft only).
4. Wait for an explicit "yes, create/update the Strapi draft" from PM or RD in this
   conversation. Earlier agreement does not count.
5. Run:

   ```bash
   npm run page:publish -- --page <page> --confirm [--entry <id>]
   ```

   The tool authenticates with `.env` values, uploads pending assets, creates or updates a
   **draft** entry, and writes `evidence/publish/<timestamp>.json`.
6. Report the entry id, the Strapi admin preview URL and the evidence path. Remind the
   PM that publishing to the live site and triggering localisation both happen inside
   Strapi, not here.
7. If PM wants the stage recorded, run the stage transition workflow for
   `page-strapi-draft`.

## Never

- Never set `publishedAt` or call a publish endpoint.
- Never paste tokens, passwords or `.env` contents into the conversation or any file.
- Never retry a failed create automatically; a half-created entry must be inspected by RD.
