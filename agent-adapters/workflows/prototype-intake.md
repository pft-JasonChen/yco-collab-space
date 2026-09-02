# Prototype Intake workflow

Input: one feature slug and the PM's current feature idea.

## Boundary

Intake may create or update `features/<feature>/product/**` and initialise explicit
`design/design-gaps.yaml` entries. It must not create or edit `generated/**`. Intake is
the only Phase 0.5 workflow that may change PM source files.

Do not store a chat transcript or manager feedback verbatim. Persist the PM's confirmed
requirements, decisions and decision basis.

## Procedure

1. Read `AGENTS.md`, `prototype.config.json`, the Phase 0.5 plan and Surface Pack
   catalog draft.
2. If the feature folder does not exist, run:

   ```bash
   npm run prototype:create -- <feature> "<Feature title>"
   ```

3. Read existing source files and preserve every already-confirmed decision.
4. Run `npm run library:components` and keep the result at hand. Every component role
   this feature declares must be resolved against that list before any UI is generated.
5. Ask short, adaptive question groups. Skip questions already answered. Resolve:
   - user problem and target user;
   - manager-review goal;
   - in-scope and out-of-scope behavior;
   - entry, success outcome, states, actions, loading, empty, error and recovery;
   - synthetic mock-data cases and prototype simplifications;
   - reusable media collections to index, plus any PM temporary assets needed before Designer input;
   - acceptance criteria;
   - surface strategy;
   - user-facing copy, recorded as RD flat dot-notation i18n keys;
   - whether a real engine payload shape is already known for this feature.
6. For every component role, record reuse evidence in `surface-intent.yaml`
   `componentReuse[]`: `existing-component` with the catalogued id, `new-shared` with the
   id it should get, or `feature-only`. A role a shared component already covers may not
   be resolved as `feature-only`. A `new-shared` role is an open decision for the
   Platform Owner, not something intake may assume.
7. Recommend exactly one surface strategy with a decision basis:
   - `reuse` for one implemented primary pack;
   - `hybrid` for one primary pack plus declared borrowed roles;
   - `novel` when an existing pack would impose the wrong mental model.
8. A missing pack never blocks a `novel` PM draft. For a novel surface, define zones,
   component roles and responsive priority in feature language.
9. Before writing confirmed source, show the PM a concise confirmation summary:
   problem, goal, scope, states/actions, surface strategy, temporary composition,
   component reuse resolutions, acceptance, open product decisions and decision basis.
10. Wait for explicit PM confirmation. Then update:
   - `product/intake.md`;
   - `product/prd.md`;
   - `product/prototype.contract.yaml`;
   - `product/validation.yaml`;
   - `product/surface-intent.yaml`;
   - `product/media-intent.yaml`;
   - `product/decisions.md`;
   - `product/i18n.json` — RD flat dot-notation keys, each marked `origin: rd-existing`
     when RD already ships that exact key and value, otherwise `origin: new`;
   - `product/mocks/**`;
   - optional `product/payload-samples/**` when the PM already has the real engine
     request shape. De-identify it; `validate:inputs` rejects credentials, tokens,
     real addresses and non-example URLs;
   - optional temporary files in `product/mock-assets/**`;
   - explicit `design/design-gaps.yaml` entries when needed.
11. Set `feature.intakeStatus: confirmed` only after the confirmation in step 10.
12. Run:

    ```bash
    npm run validate:intake -- --feature <feature>
    ```

13. Report the source files changed, selected strategy, component reuse resolutions,
    open non-blocking decisions and Intake gate result. Do not run `prototype-update` unless the PM separately asks.

## Stop conditions

- A product policy would have to be invented.
- Two surface strategies remain materially different and PM has not chosen.
- A mock would require real user data, credentials or backend access.
- A required pack is referenced as reuse／hybrid but remains `planned` or missing.
- A component role would need a new shared component and the Platform Owner has not agreed.
- A payload sample cannot be de-identified without losing the shape RD needs.
