# YCO Prototype Factory — Phase 0 implementation plan

> **Plan status:** approved; implementation in progress.
>
> **Target:** make the next PM prototype eligible to run through the new repository
> by 2026-09-01, provided the cutover gate passes.
>
> **Architecture:** [2026-08-30-prototype-factory-architecture.md](./2026-08-30-prototype-factory-architecture.md)

## Implementation checkpoint — 2026-08-30

Completed locally:

- P0.1 RD snapshot and token allowlist audit
- P0.2 standalone Git/Vite/React repository
- P0.3 byte-for-byte RD token baseline and hash gate
- P0.4 PM contract, validation, mock schemas and feature template
- P0.5 minimal React runtime and readiness vertical slice
- P0.6 agent-neutral update workflow with Claude and Codex adapters
- P0.7 static plus Playwright rendered validation

Still required:

- P0.8 private GitHub repository and public Vercel preview
- P0.9 the next real PM feature as the cutover pilot

Local evidence at this checkpoint: five unit tests pass; 252 token names match the
locked upstream files; input, raw-colour, unknown-token and client-network gates pass;
the production Vite build succeeds; and nine interaction checks pass across three
configured viewports.

---

## 1. Objective

Create the smallest complete vertical slice of `yco-prototype-factory` that lets PM:

1. provide a PRD, approved structured contract, validation and fake data;
2. ask an AI agent to generate a temporary React prototype;
3. build and inspect it over HTTP;
4. validate core interactions at configured viewports;
5. publish a public, immutable preview URL for manager review;
6. preserve the generated code and its input provenance in Git.

Phase 0 proves the new architectural seam. It does not complete the full PM → Designer
→ RD → QA lifecycle.

---

## 2. Definition of Done

Phase 0 is done only when all of the following are true:

- A standalone local repository exists at:

  `/Users/jasonchen/Documents/Claude/Projects/yco-prototype-factory`

- It is linked to a private GitHub repository.
- Vite builds a React and JavaScript prototype using SCSS Modules.
- The RD `variables.css` and `variables-custom.css` baseline is copied exactly,
  versioned and hash-locked.
- No legacy local token source is imported.
- A feature folder can be created with PM inputs, fake data and a design-gap file.
- `/prototype-update <feature>` can generate or patch committed feature code.
- The same update runs deterministic schema, token, build and Playwright checks.
- A working preview may be produced with a visible not-ready result when checks fail.
- A manager-review URL is produced only after all Phase 0 blocking checks pass.
- The preview contains synthetic data, makes no backend/API calls and contains no
  credential or secret.
- The generated code, input hashes and generator metadata are committed.
- One real pilot feature completes the whole path and is checked in a browser.
- The legacy repository remains unchanged and available as fallback until that pilot
  passes.

A generated file existing on disk is not evidence of completion. The prototype must be
served over HTTP, exercised interactively and checked for console errors.

---

## 3. Explicit Phase 0 non-goals

The following are deliberately deferred:

- automatic Figma ingestion;
- enforced Figma naming, Auto Layout or asset-export rules;
- Designer token extension workflow;
- YCO-spec adapter;
- automated `/prototype-promote` implementation;
- final RD handoff manifest;
- independent design-final subagent review;
- CODEOWNERS, protected-branch enforcement and bot-only write enforcement;
- Vercel Authentication or password protection;
- migration of any historical prototype or historical spec;
- production API, auth, Redux, CMS, analytics or backend behaviour;
- a full copy of the RD component library;
- conversion of RD CSS tokens into DTCG JSON;
- support for multiple feature variants unless the pilot explicitly requires them.

These are not forgotten tasks. They are outside the critical path for the first PM
temporary prototype.

---

## 4. Execution guardrails

The implementation agent must:

1. Read the new repository's `AGENTS.md` and configuration before changing code.
2. Use configuration for ports, URLs, routes, file IDs and viewports; never hard-code
   them in test or feature code.
3. Treat the legacy repository and all historical features as read-only.
4. Treat the RD snapshot as untrusted migration input, not as a dependency.
5. Copy files from the RD snapshot through an explicit allowlist.
6. Never copy `.env*`, certificates, keys, `node_modules`, build output or deployment
   scripts.
7. Never make a network request from the prototype to a production or test backend.
8. Commit generated code, but do not allow PM or Designer instructions to edit it
   manually.
9. Stop when a missing design token cannot be represented with the baseline; record a
   design gap instead of inventing a token.
10. Produce evidence for every claimed validation result.

The main implementation model is selected by the user at execution time. The core must
not hard-code a model vendor. Subagent preferences belong in a repo-level model policy,
initially Claude-first with Codex compatibility.

---

## 5. Planned repository structure

The implementation should begin with this minimum shape:

```text
yco-prototype-factory/
├── AGENTS.md
├── README.md
├── package.json
├── prototype.config.json
├── app/
│   ├── index.html
│   └── src/
├── features/
│   └── _template/
│       ├── product/
│       │   ├── prd.md
│       │   ├── prototype.contract.yaml
│       │   ├── validation.yaml
│       │   └── mocks/
│       ├── design/
│       │   ├── design.ref.json
│       │   └── design-gaps.yaml
│       ├── generated/
│       ├── evidence/
│       └── releases.json
├── platform/
│   ├── runtime/
│   ├── ui/
│   └── tokens/
│       ├── rd/
│       └── tokens.lock.json
├── tools/
│   ├── prototype-cli/
│   └── validation/
└── agent-adapters/
    ├── claude/
    └── codex/
```

Do not create empty future architecture merely to match the final tree. Phase 0 should
create a directory only when the vertical slice needs it.

---

## 6. Work plan

### P0.1 — Preflight and migration inventory

**Goal:** identify exact inputs before scaffolding.

Actions:

- Verify the RD snapshot path is readable.
- Record the snapshot's package name and relevant framework versions.
- Locate only:
  - `src/styles/variables.css`;
  - `src/styles/variables-custom.css`;
  - a small number of presentational component references required by the pilot.
- Calculate source hashes for token files.
- Scan the planned copy set for secrets, environment files, certificates and keys.
- Record what will be copied, referenced and rejected.
- Inspect the installed Node runtime and choose one package manager for the new repo.
  Pin its version and lockfile; do not inherit Yarn 1 merely because RD uses it.

**Rationale:** the RD snapshot is a large production application. An allowlist prevents
accidental migration of production infrastructure or credentials.

**Exit evidence:**

- a checked-in migration manifest;
- token hashes;
- explicit rejected-path list;
- no files copied yet beyond reviewed inputs.

### P0.2 — Create the standalone repository

**Goal:** establish a clean, reproducible base.

Actions:

- Create the sibling directory and initialise Git.
- Add `AGENTS.md` with the confirmed source-of-truth, generated-code and no-backend
  rules.
- Add `README.md` with PM-focused quick start.
- Add `prototype.config.json` for routes, viewports, preview behaviour and evidence
  paths.
- Scaffold Vite, React, JavaScript and SCSS Modules.
- Pin dependency versions after checking official compatibility at implementation time.
- Add one deterministic install, dev and build path.
- Create the private GitHub repository only with the user's authorisation.

**Rationale:** a nested repository would inherit legacy hooks and create ambiguous Git
boundaries. A standalone repository makes the cutover reversible.

**Exit evidence:**

- clean install from lockfile;
- Vite starter returns HTTP 200;
- production build exits successfully;
- empty app has no browser-console errors.

### P0.3 — Install and lock the RD token baseline

**Goal:** make RD tokens the only visual-value source.

Actions:

- Copy the two approved CSS token files byte-for-byte into a versioned
  `platform/tokens/rd/<version>/` directory.
- Store source path, snapshot identifier, hashes and parsed token metadata in
  `tokens.lock.json`.
- Import the baseline once from the app shell.
- Implement a token check that:
  - detects a changed baseline hash;
  - permits intentional responsive redefinitions from the upstream file;
  - rejects unknown token references in feature SCSS;
  - rejects raw visual values in feature SCSS according to the agreed policy;
  - never rewrites the upstream CSS.
- Add a parity fixture that proves representative aliases and responsive overrides
  resolve in a rendered page.

**Rationale:** keeping the first baseline unchanged is lower risk than converting a
complex CSS token file during a time-critical migration.

**Exit evidence:**

- byte-for-byte hash match with the RD source;
- token validation passes on the fixture;
- a deliberately unknown token fails the check;
- no legacy token import is present.

### P0.4 — Define the PM feature contract

**Goal:** give AI and deterministic tools one stable machine-readable input.

Actions:

- Define a versioned schema for `prototype.contract.yaml`.
- Require at least:
  - feature identity and entry route;
  - screen and state definitions;
  - actions and state transitions;
  - visible copy or copy references;
  - mock-data references;
  - acceptance criteria identifiers;
  - design-reference status;
  - known design gaps.
- Define schemas for `validation.yaml`, mock data and `design-gaps.yaml`.
- Create `features/_template/` with short beginner-readable examples.
- Add input hashing and a stale-contract check.
- Make explicit that mocks describe UX data requirements, not a final API.

**Rationale:** a build cannot deterministically reinterpret several prose documents on
every run. PM approval of a structured contract keeps behaviour stable.

**Exit evidence:**

- valid example passes;
- malformed state transition fails with a useful message;
- missing mock reference fails;
- changing PM source marks the contract or generated artifact stale.

### P0.5 — Build the minimal React prototype runtime

**Goal:** render one complete feature without production infrastructure.

Actions:

- Implement a small Vite review shell and feature registry.
- Support a configured route for each feature.
- Provide only the presentational primitives required by the pilot.
- Use local React state and imported mock data.
- Add visible prototype and mock-data labelling.
- Prevent or detect application-initiated backend/API requests.
- Keep routing, mock services and review chrome outside feature components so RD can
  distinguish reusable UI from prototype-only infrastructure.

**Rationale:** feature UI should resemble RD's React/SCSS conventions, while mock
runtime concerns remain easy to remove.

**Exit evidence:**

- template feature renders at its configured URL;
- all data is local and synthetic;
- no unexpected network request occurs;
- shared runtime can be removed without rewriting presentational components.

### P0.6 — Implement agent-neutral update orchestration

**Goal:** provide one PM-facing workflow without embedding a model in the core.

Actions:

- Define the behaviour contract for:

  `/prototype-update <feature>`

- Create thin Claude-first and Codex-compatible adapter instructions.
- Keep deterministic operations in the CLI:
  - input validation;
  - hash comparison;
  - build;
  - test;
  - evidence output;
  - preview metadata.
- Let the agent perform the non-deterministic step: create or patch generated React and
  SCSS from approved inputs.
- Restrict the agent's normal feature output to `generated/` and `evidence/`.
- Record:
  - input hashes;
  - adapter and generator instruction version;
  - model identifier when the environment exposes it;
  - generated file list;
  - code diff summary.
- Reserve the `/prototype-promote` interface but do not implement automated promotion
  in Phase 0. It should fail safely with a Phase 1 explanation if invoked.

**Rationale:** novel UI generation needs an AI agent, but builds and validations must be
repeatable without one.

**Exit evidence:**

- both adapters describe the same state machine and gates;
- deterministic CLI can rerun checks without AI;
- repeated build of committed code has identical output;
- update never changes PM inputs silently.

### P0.7 — Add rendered validation

**Goal:** make a manager-review URL evidence-backed.

Actions:

- Build a Playwright harness that reads viewports and base URL from
  `prototype.config.json`.
- For each acceptance criterion, map:
  - criterion identifier;
  - browser action;
  - assertion;
  - screenshot or other evidence.
- Add:
  - server HTTP check;
  - console error guard;
  - broken local asset detection;
  - core click/input/state-transition checks;
  - configured multi-viewport screenshots;
  - unexpected network-request guard.
- Write machine-readable and human-readable reports under `evidence/`.
- Allow a failed working preview, but clearly mark it not review-ready.
- Refuse manager-review readiness while a blocking check fails.

**Rationale:** source inspection cannot prove that a generated prototype works in a
browser.

**Exit evidence:**

- a deliberate interaction defect fails;
- a deliberate console error fails;
- a deliberate unexpected API call fails;
- passing evidence points to real rendered screenshots;
- no PASS is reported without an HTTP-rendered check.

### P0.8 — Publish a public preview

**Goal:** give the manager a stable URL without local setup.

Actions:

- Connect the private GitHub repository to a new Vercel project with user approval.
- Deploy only built static prototype output.
- Do not add backend functions or runtime secrets.
- Produce a commit-specific preview URL.
- Record commit, input hashes and validation status next to the URL.
- Keep Vercel access control out of Phase 0.

**Rationale:** public preview is acceptable for this phase because content is synthetic,
contains no backend connection and carries no secret. Private GitHub protects source
history but is not treated as deployment access control.

**Exit evidence:**

- public URL returns HTTP 200;
- URL displays the same tested commit;
- browser console is clean on the deployed URL;
- no real API traffic or secret appears in the built client;
- manager-review metadata is reproducible from Git.

### P0.9 — Run the real pilot and decide cutover

**Goal:** prove the factory with the next actual PM feature.

Actions:

- Create the real feature from `features/_template/`.
- Have PM approve its contract.
- Run `/prototype-update <feature>` with the selected high-capability model.
- Review generated diff and design gaps.
- Exercise every Phase 0 acceptance criterion.
- Publish the immutable manager-review URL.
- Record pilot defects and turn each repeatable class into a validation rule.

**Cutover decision:**

- If every Phase 0 Definition of Done item passes, all later new features start in
  `yco-prototype-factory`.
- If any blocking item remains on 2026-09-01, the immediate feature uses the legacy
  workflow and is explicitly marked transition work.
- Do not freeze the legacy repository until a real new-repo pilot passes.

**Rationale:** the calendar creates urgency, but only a rendered vertical slice proves
that the new flow is usable.

---

## 7. Planned user experience

The intended PM interaction is:

```text
1. Create features/<feature>/product/prd.md
2. Ask the agent to draft prototype.contract.yaml and validation.yaml
3. Review and approve the contract
4. Run /prototype-update <feature>
5. Read the generated diff, design gaps and validation report
6. Open the preview URL
7. Send the immutable review URL to the manager
```

Designer participation is optional in Phase 0. The absence of final Figma or missing
design decisions must produce explicit gaps, not block a temporary PM prototype.

---

## 8. Phase 0 validation matrix

| Area | Blocking manager review? | Required evidence |
|---|---:|---|
| PM contract schema | Yes | Validator output |
| Mock-data schema | Yes | Validator output |
| Token baseline hash | Yes | Lock-file comparison |
| Unknown token or prohibited raw value | Yes | SCSS validation |
| Unresolved design gap | No for PM draft | Gap report |
| Vite production build | Yes | Successful command result |
| HTTP rendering | Yes | Status and browser navigation |
| Core interaction criteria | Yes | Playwright assertions |
| Configured viewports | Yes | Screenshot evidence |
| Console errors | Yes | Console guard report |
| Unexpected backend/API request | Yes | Network guard report |
| Final Figma parity | Not in Phase 0 | Deferred |
| YCO-spec | Not for PM draft | Required before design-final |
| Independent reviewer | Not for PM draft | Required before design-final |

---

## 9. Risks and responses

| Risk | Response |
|---|---|
| Two-day deadline encourages a broad rewrite | Enforce the Phase 0 non-goal list and build one vertical slice only. |
| AI produces different code from the same inputs | Commit generated output, record hashes and keep normal builds deterministic. |
| RD production code is copied accidentally | Use an allowlist and copy only reviewed token files plus selected references. |
| RD snapshot contains environment or credential material | Reject environment files, keys, certificates, build output and deployment scripts before copying. |
| Designer is unavailable | Use RD tokens, temporary UI and explicit design gaps. |
| Token missing during PM draft | Use the nearest existing baseline token only when acceptable and record the gap; never invent a token. |
| Prototype silently calls a backend | Use local mocks and a browser network guard. |
| Public URL leaks a secret | No secrets or real data may enter client code; scan built output before deploy. |
| Team changes generated code manually | Document ownership and warn in Phase 0; enforce repository policy only after team agreement. |
| YCO-spec migration grows the critical path | Keep it in Phase 1 but block design-final until it is restored. |
| New repo fails close to the pilot date | Keep the legacy workflow available until the rendered cutover gate passes. |

---

## 10. Phase 1 and later backlog

After the pilot succeeds:

1. Adapt the existing YCO-spec engine to the new contract.
2. Add `/prototype-promote` with immutable tags and release metadata.
3. Add final handoff metadata for RD and QA.
4. Add independent design-final agent review.
5. Review the proposed Figma handoff contract with Designer.
6. Decide Figma asset export and token-extension formats with Designer.
7. Evaluate Figma automation only after the handoff contract is agreed.
8. Discuss CODEOWNERS, protected branches and generated-path enforcement with the team.
9. Discuss Vercel deployment protection if feature confidentiality changes.
10. Evaluate DTCG JSON only with RD/Designer agreement and CSS parity tests.
11. Freeze the legacy repository after the successful pilot and preserve its deployed
    prototypes and QA specs.

---

## 11. Approval gate before implementation

No implementation should begin until PM reviews this plan and confirms:

- Phase 0 scope and non-goals;
- the new repository path and private GitHub destination;
- permission to copy the two RD token files;
- permission to create the GitHub and Vercel projects;
- the actual pilot feature when its brief is ready;
- the selected high-capability main model and available agent environment.

After approval, the implementation agent should convert sections P0.1–P0.9 into an
execution checklist and report progress against this plan rather than silently changing
scope.
