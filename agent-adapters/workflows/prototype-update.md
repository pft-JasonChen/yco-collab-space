# Prototype update workflow

Input: one feature slug.

1. Read `AGENTS.md` and `prototype.config.json`.
2. Read the feature's PM product inputs and design gaps.
3. Run `npm run validate:inputs -- --feature <feature>`. A missing or stale
   generation record is expected before generation; all other input errors block.
4. Create or patch only `features/<feature>/generated/**`.
5. Use React JavaScript, SCSS Modules, local mock data and existing RD token names.
6. Do not call a backend and do not edit PM or Designer source.
7. Run:

   ```bash
   npm run prototype:record -- <feature> --adapter <adapter>
   npm run validate:inputs -- --feature <feature>
   npm run validate:tokens
   npm run validate:network
   npm run build
   npm run test:rendered -- --feature <feature>
   ```

8. Report the generated diff, design gaps, validation status and preview URL.
9. Never promote a milestone as part of update.

If shared platform code is missing, stop and propose a Platform Owner change instead of
silently modifying `platform/**`.
