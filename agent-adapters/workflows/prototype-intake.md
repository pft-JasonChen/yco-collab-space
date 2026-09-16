# Prototype Intake workflow

Input: one feature slug and the PM's current feature idea. Optional: a confirmed
research brief at `product/research/brief.md` from the `prototype-research` workflow.

## Boundary

Intake may create or update `features/<feature>/product/**` and initialise explicit
`design/design-gaps.yaml` entries. It must not create or edit `generated/**`. Intake and
Revise are the only workflows that may change PM source files.

Do not store a chat transcript or manager feedback verbatim. Persist the PM's confirmed
requirements, decisions and decision basis.

Read only the intake context pack: the brief if present, the feature's own `product/**`,
the template, and `npm run library:components`. Do not read `generated/**` of any
feature or `platform/**` source.

## Procedure

1. Read `AGENTS.md`, `prototype.config.json`, the Surface Pack catalog draft and, if it
   exists, `product/research/brief.md`.
2. If the feature folder does not exist, run:

   ```bash
   npm run prototype:create -- <feature> "<Feature title>"
   ```

3. Read existing source files and preserve every already-confirmed decision.
4. Run `npm run library:components` and keep the result at hand. Every component role
   this feature declares must be resolved against that list before any UI is generated.
5. Ask short, adaptive question groups. Skip questions already answered by the brief or
   by existing source. Resolve:
   - user problem and target user;
   - manager-review goal, phrased so a manager can answer it with one decision;
   - which brief recommendations the PM adopts, which are rejected and why;
   - consistency: which YCO surface family this feature belongs to in
     `platform/surfaces/site-map.yaml`, and what it deliberately departs from;
   - in-scope and out-of-scope behavior;
   - entry, success outcome, states, actions, loading, empty, error and recovery;
   - synthetic mock-data cases and prototype simplifications;
   - reusable media collections to index, plus any PM temporary assets needed before Designer input;
   - acceptance criteria, each as given／when／then that a selector can assert;
   - surface strategy;
   - user-facing copy, recorded as RD flat dot-notation i18n keys;
   - whether a real engine payload shape is already known for this feature.
6. For every component role, record reuse evidence in `surface-intent.yaml`
   `componentReuse[]`: `existing-component` with the catalogued id, `new-shared` with the
   id it should get, or `feature-only`. A role a shared component already covers may not
   be resolved as `feature-only`. A `new-shared` role is an open decision for the
   Platform Owner, not something intake may assume.
7. Declare the full composition in `layoutIntent.zones` and `componentRoles`, then mark
   in `layoutIntent.presence` every zone or role that is not visible on the entry route
   before any interaction: `on-interaction` for dialogs, menus and toolbars,
   `conditional` for breadcrumbs, empty states and viewport-dependent chrome,
   `deferred` with a reason for anything declared but not rendered in this revision.
   Name the criterion that reaches it with `via`. Only `at-rest` entries are asserted by
   the rendered check.
8. Recommend exactly one surface strategy with a decision basis:
   - `reuse` for one implemented primary pack;
   - `hybrid` for one primary pack plus declared borrowed roles;
   - `novel` when an existing pack would impose the wrong mental model.
9. A missing pack never blocks a `novel` PM draft. For a novel surface, define zones,
   component roles and responsive priority in feature language.
10. Before writing confirmed source, show the PM a concise confirmation summary:
    problem, goal, scope, states/actions, surface strategy, temporary composition,
    component reuse resolutions, presence, acceptance, open product decisions and
    decision basis.
11. Wait for explicit PM confirmation. Then update:
    - `product/intake.md` — when a confirmed brief exists, its Decision basis cites
      `product/research/brief.md`;
    - `product/prd.md`;
    - `product/prototype.contract.yaml`;
    - `product/validation.yaml`;
    - `product/surface-intent.yaml`;
    - `product/media-intent.yaml`;
    - `product/decisions.md` — canonical bullets under `## Decisions`, evidence under
      `## Decision basis`, and an empty `## Review log` for later passes;
    - `product/i18n.json` — RD flat dot-notation keys, each marked `origin: rd-existing`
      when RD already ships that exact key and value, otherwise `origin: new`, and
      `status: planned` because no generated code uses them yet;
    - `product/mocks/**`;
    - optional `product/payload-samples/**` when the PM already has the real engine
      request shape. De-identify it; `validate:inputs` rejects credentials, tokens,
      real addresses and non-example URLs;
    - optional temporary files in `product/mock-assets/**`;
    - explicit `design/design-gaps.yaml` entries when needed.
12. Set `feature.intakeStatus: confirmed` only after the confirmation in step 11.
13. Run:

    ```bash
    npm run validate:intake -- --feature <feature>
    ```

14. Ask the reviewer sub-agent (a different model from the one that wrote the source)
    to score `evals/graders/intake-rubric.md` and return JSON. Store it as
    `features/<feature>/evidence/intake-review.json`. A `fail` on any dimension goes
    back to the PM as a question, not silently to generation.
15. Report the source files changed, selected strategy, component reuse resolutions,
    presence, open non-blocking decisions, the Intake gate result and the rubric
    result. Do not run `prototype-update` unless the PM separately asks; suggest
    `prototype-wireframe` when the composition is new.

## Stop conditions

- A product policy would have to be invented.
- Two surface strategies remain materially different and PM has not chosen.
- A mock would require real user data, credentials or backend access.
- A required pack is referenced as reuse／hybrid but remains `planned` or missing.
- A component role would need a new shared component and the Platform Owner has not agreed.
- A payload sample cannot be de-identified without losing the shape RD needs.
- A confirmed brief's Confirm-with-PM items are still unanswered and the scope depends
  on them.
