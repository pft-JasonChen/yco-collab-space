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
4. Ask short, adaptive question groups. Skip questions already answered. Resolve:
   - user problem and target user;
   - manager-review goal;
   - in-scope and out-of-scope behavior;
   - entry, success outcome, states, actions, loading, empty, error and recovery;
   - synthetic mock-data cases and prototype simplifications;
   - acceptance criteria;
   - surface strategy.
5. Recommend exactly one surface strategy with a decision basis:
   - `reuse` for one implemented primary pack;
   - `hybrid` for one primary pack plus declared borrowed roles;
   - `novel` when an existing pack would impose the wrong mental model.
6. A missing pack never blocks a `novel` PM draft. For a novel surface, define zones,
   component roles and responsive priority in feature language.
7. Before writing confirmed source, show the PM a concise confirmation summary:
   problem, goal, scope, states/actions, surface strategy, temporary composition,
   acceptance, open product decisions and decision basis.
8. Wait for explicit PM confirmation. Then update:
   - `product/intake.md`;
   - `product/prd.md`;
   - `product/prototype.contract.yaml`;
   - `product/validation.yaml`;
   - `product/surface-intent.yaml`;
   - `product/decisions.md`;
   - `product/mocks/**`;
   - explicit `design/design-gaps.yaml` entries when needed.
9. Set `feature.intakeStatus: confirmed` only after the confirmation in step 8.
10. Run:

    ```bash
    npm run validate:intake -- --feature <feature>
    ```

11. Report the source files changed, selected strategy, open non-blocking decisions and
    Intake gate result. Do not run `prototype-update` unless the PM separately asks.

## Stop conditions

- A product policy would have to be invented.
- Two surface strategies remain materially different and PM has not chosen.
- A mock would require real user data, credentials or backend access.
- A required pack is referenced as reuse／hybrid but remains `planned` or missing.

