# Prototype update workflow

Input: one feature slug.

Update is the first generation, or a regeneration after a platform change. The PM
feedback loop is `prototype-revise`, which changes source and regenerates only the
affected layers; do not run a full update for a review pass.

1. Read `AGENTS.md` and `prototype.config.json`.
2. Run `npm run feature:digest -- <feature>` and read
   `.collab-cache/features/<feature>/digest.md`. It carries the contract, the resolved
   surface with presence, every role's reuse resolution, the public API of each shared
   component to import, the canonical decisions, open gaps and the i18n keys. Then read
   `product/prd.md`, `product/validation.yaml` and `product/mocks/**`. Do not read
   `intake.md`, the review log, the research brief or the wireframe.
3. Run `npm run validate:intake -- --feature <feature>`. Any error blocks generation.
4. Run `npm run prototype:update:begin -- <feature>` to snapshot PM／Designer source.
5. Resolve the surface context:
   - `reuse`: read the pinned primary Surface Pack;
   - `hybrid`: read the primary pack plus only the declared borrowed roles;
   - `novel`: use the feature-specific layout intent without requiring a pack.
6. For every collection named in `product/media-intent.yaml`, run
   `npm run library:query -- --collection <assets/type/collection>`. Treat the returned files as
   candidates; use only the files needed by this feature. Never scan unrelated collections.
7. Every role resolved as `existing-component` must be satisfied by importing that
   component through the import path the digest lists. Rebuilding UI a catalogued
   component already owns is a failure, not a style choice.
8. Create or patch only `features/<feature>/generated/**`, in the RD anatomy:
   `settings/` for composition, `data/` for product data and pure functions,
   `index.jsx` for orchestration, `contract/` for the handoff contract, and
   `feature.jsx` as the entry. Generate one layer at a time; a revise later replaces a
   layer, not the folder.
9. Use React JavaScript, SCSS Modules, local mock data, selected Design Library files,
   PM temporary files under `product/mock-assets/**`, and existing RD token names.
10. Every user-facing string comes from `product/i18n.json` through
    `platform/runtime/i18n.js`. Never write a literal string into generated JSX, and
    never add a key that is not declared in `i18n.json`. Shared components take their
    copy through props, so pass resolved strings down rather than translating inside
    `platform/ui/**`.
11. Emit `data-surface-zone` for every zone and `data-component-role` for every
    component role in the resolved surface context, including the ones that are not at
    rest; the rendered check asserts only the at-rest set on the entry route, and the
    validation checks reach the rest through their steps.
12. Do not call a backend and do not edit PM or Designer source.
13. Fix loop, through the validator sub-agent where the adapter has one:
    - `npm run prototype:check:fast -- <feature>`, then read
      `npm run rendered:summary -- <feature>`; never read the raw log;
    - patch only the failing layer; re-run
      `npm run test:rendered -- --feature <feature> --check <failed ids>`;
    - at most three rounds; the same check failing twice in a row means stop and
      report the failure with the selector and the expected／actual values;
    - a partial run writes `rendered-validation.partial.*`; the full check must pass
      before the run is reported complete.
14. Finish:

    ```bash
    npm run prototype:finish -- <feature> --adapter <adapter> --model <model-id> --usage '{"inputTokens":0,"outputTokens":0,"rounds":0}'
    npm run validate:rd-parity
    npm run validate:tokens
    npm run validate:network
    npm run build
    npm run test:rendered -- --feature <feature>
    ```

    `prototype:finish` runs the source-guard check, records provenance with the model
    that generated the code and re-validates inputs. A run without it is unfinished.

15. Report the generated diff per layer, resolved surface strategy／pack versions,
    requested collections, exact selected media, component reuse resolutions actually
    honoured, new i18n keys, token version, design gaps, structural and functional
    validation status, fix-loop rounds, visual-review status and preview URL.
16. Never infer or record a stage approval as part of update. The PM／Designer must
    explicitly confirm a separate stage transition.

If shared platform code is missing, stop and propose a Platform Owner change instead of
silently modifying `platform/**`.
