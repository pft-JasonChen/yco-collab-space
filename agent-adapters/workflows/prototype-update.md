# Prototype update workflow

Input: one feature slug.

1. Read `AGENTS.md` and `prototype.config.json`.
2. Read `collab-space.map.yaml`, then the feature's Intake, PRD, contract, decisions,
   validation, surface intent, media intent, mock data, design gaps and releases.
3. Run `npm run validate:intake -- --feature <feature>`. Any error blocks generation.
4. Run `npm run prototype:update:begin -- <feature>` to snapshot PM／Designer source.
5. Resolve the surface context:
   - `reuse`: read the pinned primary Surface Pack;
   - `hybrid`: read the primary pack plus only the declared borrowed roles;
   - `novel`: use the feature-specific layout intent without requiring a pack.
6. For every collection named in `product/media-intent.yaml`, run
   `npm run library:query -- --collection <assets/type/collection>`. Treat the returned files as
   candidates; use only the files needed by this feature. Never scan unrelated collections.
7. Create or patch only `features/<feature>/generated/**`.
8. Use React JavaScript, SCSS Modules, local mock data, selected Design Library files,
   PM temporary files under `product/mock-assets/**`, and existing RD token names.
9. Emit `data-surface-zone` for every required zone and `data-component-role` for every
   required component role in the resolved surface context.
10. Do not call a backend and do not edit PM or Designer source.
11. Run `npm run prototype:update:check -- <feature>`. A source change blocks the run.
12. Run:

   ```bash
   npm run prototype:record -- <feature> --adapter <adapter>
   npm run validate:inputs -- --feature <feature>
   npm run validate:tokens
   npm run validate:network
   npm run build
   npm run test:rendered -- --feature <feature>
   ```

13. Report the generated diff, resolved surface strategy／pack versions, requested
    collections, exact selected media, token version, design gaps,
    structural and functional validation status, visual-review status and preview URL.
14. Never infer or record a stage approval as part of update. The PM／Designer must
    explicitly confirm a separate stage transition.

If shared platform code is missing, stop and propose a Platform Owner change instead of
silently modifying `platform/**`.
