# Prototype update workflow

Input: one feature slug.

1. Read `AGENTS.md` and `prototype.config.json`.
2. Read the feature's Intake, PRD, contract, decisions, validation, surface intent,
   mock data and design gaps.
3. Run `npm run validate:intake -- --feature <feature>`. Any error blocks generation.
4. Run `npm run prototype:update:begin -- <feature>` to snapshot PM／Designer source.
5. Resolve the surface context:
   - `reuse`: read the pinned primary Surface Pack;
   - `hybrid`: read the primary pack plus only the declared borrowed roles;
   - `novel`: use the feature-specific layout intent without requiring a pack.
6. Create or patch only `features/<feature>/generated/**`.
7. Use React JavaScript, SCSS Modules, local mock data and existing RD token names.
8. Emit `data-surface-zone` for every required zone and `data-component-role` for every
   required component role in the resolved surface context.
9. Do not call a backend and do not edit PM or Designer source.
10. Run `npm run prototype:update:check -- <feature>`. A source change blocks the run.
11. Run:

   ```bash
   npm run prototype:record -- <feature> --adapter <adapter>
   npm run validate:inputs -- --feature <feature>
   npm run validate:tokens
   npm run validate:network
   npm run build
   npm run test:rendered -- --feature <feature>
   ```

12. Report the generated diff, resolved surface strategy／pack versions, design gaps,
    structural and functional validation status, visual-review status and preview URL.
13. Never promote a milestone as part of update.

If shared platform code is missing, stop and propose a Platform Owner change instead of
silently modifying `platform/**`.
