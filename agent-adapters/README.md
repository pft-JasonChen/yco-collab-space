# Agent adapters

The core CLI does not call a model. An adapter tells an AI agent how to run the same
`prototype-update` state machine.

- `claude/` contains the Claude-first adapter.
- `codex/` contains the Codex-compatible skill.
- `model-policy.example.json` describes preferences, not a model allowlist.

Both adapters expose two separate workflows:

- `prototype-intake` may update PM inputs after an explicit confirmation gate and never
  edits generated code.
- `prototype-update` preserves PM inputs, generates only derived code, records
  provenance and runs the same deterministic gates.
