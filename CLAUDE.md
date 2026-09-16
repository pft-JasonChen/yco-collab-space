# CLAUDE.md — Claude Code harness for YCO Collab Space

@AGENTS.md

The rules above are provider-neutral. This file adds what Claude Code enforces by
itself, so the same rule does not have to be remembered by the model.

## Commands and the active workflow

| Command | Workflow doc | Writes |
|---|---|---|
| `/prototype-research <feature> "<one-line need>"` | `agent-adapters/workflows/prototype-research.md` | `product/research/brief.md` |
| `/prototype-intake <feature>` | `agent-adapters/workflows/prototype-intake.md` | `product/**`, `design/design-gaps.yaml` |
| `/prototype-wireframe <feature>` | `agent-adapters/workflows/prototype-wireframe.md` | `product/wireframe/**` |
| `/prototype-update <feature>` | `agent-adapters/workflows/prototype-update.md` | `generated/**`, `evidence/**` |
| `/prototype-revise <feature>` | `agent-adapters/workflows/prototype-revise.md` | `product/**` delta and the affected `generated/**` layers |
| `/prototype-promote <feature> <stage>` | `agent-adapters/workflows/stage-transition.md` | nothing by hand; `stage:transition` only |

Typing a command records the active workflow in `.prototype-state/active-workflow.json`
(hook `prompt-workflow`). If a command was started another way, run
`npm run workflow:begin -- <workflow> <feature>` first. `npm run workflow:end` clears it.

## What the hooks in `.claude/settings.json` do

- **Write guard** (PreToolUse on Edit／Write): denies any write outside the active
  workflow's `writablePaths` in `collab-space.map.yaml`. Read the reason and switch
  workflow; do not retry the same write.
- **Generated lint** (PostToolUse): a raw colour, unknown token or client network API in
  `generated/**` is reported in the same turn. Fix it before moving on.
- **Provenance stop** (Stop): an update or revise cannot end while the source-guard
  snapshot is open or `generation.json` has no adapter／model or predates the run.
  Finish with `npm run prototype:finish -- <feature> --adapter claude --model <model-id>`.

All hooks need `node` on PATH. If node is missing, no gate ran: say so and never report
a PASS you did not see.

## Context packs — read only what the workflow needs

| Workflow | Read | Do not read |
|---|---|---|
| research | `platform/surfaces/site-map.yaml`, `platform/surfaces/catalog.yaml`, `npm run library:components`, existing `docs/research/**` | any `generated/**`, other features' product folders |
| intake | `product/research/brief.md` if present, `features/_template/**`, the target feature's `product/**`, `npm run library:components` | `generated/**`, `platform/**` source |
| wireframe | `product/intake.md`, `product/surface-intent.yaml`, `npm run feature:digest` | `generated/**` |
| update | `npm run feature:digest -- <feature>` output, `product/prd.md`, `product/validation.yaml`, `product/mocks/**`, `component.yaml` of imported components | `decisions.md` review log, the research brief, `intake.md` |
| revise | the PM feedback, `.collab-cache/features/<feature>/digest.md`, only the source files and generated layers the feedback touches | everything else |

## Sub-agents and models

Definitions live in `.claude/agents/`; provider choices in `agent-adapters/model-policy.json`.

- `prototype-researcher` operates the browser and returns only the brief.
- `prototype-validator` runs `npm run prototype:check:fast` and returns the compressed
  failure list from `npm run rendered:summary`. It never edits files.
- `prototype-reviewer` scores the intake rubric or the visual rubric and returns JSON.
  It must be a different model from the one that generated the artifact.

Never paste a raw build or rendered log into the main context; use the validator.

## Fix loop

1. `npm run prototype:check:fast -- <feature>`; read `npm run rendered:summary -- <feature>`.
2. Patch only the failing layer; re-run `npm run test:rendered -- --feature <feature> --check <ids>`.
3. At most 3 rounds. The same check failing twice in a row means stop and report; do not guess.
4. `npm run build` once, after the fast gate is green, before any stage transition.

## Decisions file convention

`product/decisions.md` has a canonical `## Decisions` section, rewritten in place when a
decision changes, and an append-only `## Review log`. The digest reads only the canonical
sections. Never append a "replaces the above" entry to Decisions.
