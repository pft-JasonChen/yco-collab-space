# Agent adapters

The core CLI does not call a model. An adapter tells an AI agent how to run the same
workflows against the same deterministic gates.

- `workflows/` holds the provider-neutral procedure for each workflow. Both adapters
  point at these files; they are the source of truth for what a workflow does.
- `claude/` contains the Claude-first adapter. The runnable commands, sub-agent
  definitions and hooks live in `.claude/` and `CLAUDE.md` at the repository root.
- `codex/` contains the Codex-compatible skills and `subagents.md`, which explains how
  Codex runs the validator and reviewer roles as separate `codex exec` processes.
- `model-policy.json` lists, per role, the preferred Claude and OpenAI models and the
  pairing rules. It describes preferences, not an allowlist.

## Workflows

| Workflow | Purpose | Writes | Claude | Codex |
|---|---|---|---|---|
| `prototype-research` | production audit, competitive teardown, sourced UX proposal | `product/research/**` | `/prototype-research` | follow the workflow doc directly |
| `prototype-intake` | interview the PM and write confirmed source after a confirmation gate | `product/**` | `/prototype-intake` | `prototype-intake` skill |
| `prototype-wireframe` | PM layout review on a static wireframe before React | `product/wireframe/**` | `/prototype-wireframe` | follow the workflow doc directly |
| `prototype-update` | first generation; records provenance; runs every gate | `generated/**` | `/prototype-update` | `prototype-update` skill |
| `prototype-revise` | PM feedback → source delta → regenerate affected layers | `product/**` delta, `generated/**` layers | `/prototype-revise` | follow the workflow doc directly |
| stage transition | evidence-bound approval | `releases.json` via CLI only | `/prototype-promote` | follow the workflow doc directly |

## Roles that run on a separate model

| Role | What it returns | Why it is separate |
|---|---|---|
| researcher | the brief only | competitor pages must not enter the main context |
| validator | a compressed failure list from `prototype:check:fast` and `rendered:summary` | build and browser logs are the largest token cost in a fix loop |
| reviewer | rubric JSON validated by `intake-review.schema.json` or `visual-review.schema.json` | the model that built an artifact must not certify it |

Both providers fill all three roles; see `model-policy.json` for the preferred model per
role and `codex/subagents.md` for the Codex invocation.

## Harness scripts (provider-neutral)

```bash
npm run workflow:begin -- <workflow> <feature>   # record the active workflow (Claude's prompt hook does this automatically)
npm run workflow:end
npm run feature:digest -- <feature>              # .collab-cache/features/<feature>/digest.md
npm run prototype:check:fast -- <feature> [--check a,b] [--viewport name] [--no-build]
npm run rendered:summary -- <feature>
npm run prototype:finish -- <feature> --adapter <adapter> --model <model-id> [--usage '{...}'] [--skip-guard]
```
