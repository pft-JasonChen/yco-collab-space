# Product page brief workflow

Input: one page slug and the PM's intent for the page.

## Boundary

Brief may create or update `product-pages/<page>/source/**` and `releases.json`. It must
not touch `generated/**`, `features/**`, `product-library/**`, `design-library/**` or
`strapi/**`. If the PM wants to change the feature spec or the product library, stop and
point them to `/prototype-intake <feature>` or the `product-library/` folder instead.

## Procedure

1. Read `AGENTS.md`, `collab-space.map.yaml` (product-page track) and `product-pages/README.md`.
2. If the page folder does not exist, run:

   ```bash
   npm run page:create -- <page> "<Page title>"
   ```

3. Read existing `source/page.source.yaml` and `source/brief.md`; preserve confirmed values.
4. List candidate upstream sources: `features/*/product/prd.md` titles,
   `.collab-cache/product-library-index.json` (run `npm run library:product:index` first).
5. Ask short, adaptive question groups. Skip what is already answered. Resolve:
   - page goal and target user;
   - which features, products and competitors the page draws from;
   - required sections (`intro`, `benefits`, `how-to`, `use-case`, `faq`);
   - app links and locale;
   - media collections to request and whether mock assets are allowed;
   - must-say / must-not-say statements;
   - layout preferences (order, excluded patterns).
6. Show a confirmation summary. Wait for explicit PM confirmation.
7. Write `page.source.yaml` (set `status: confirmed`) and `brief.md`.
8. Run:

   ```bash
   npm run page:validate:pages -- --page <page>
   ```

9. Report the files changed and the open decisions. Do not run generation unless asked.

## Stop conditions

- The PM asks for a capability that no feature spec or product entry contains.
- An upstream feature has `intakeStatus: draft`; ask the PM to confirm the feature Intake first.
- A competitor is named as the only source for a product capability.
