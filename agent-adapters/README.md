# Agent adapters

The core CLI does not call a model. An adapter tells an AI agent how to run the same
`prototype-update` state machine.

- `claude/` contains the Claude-first adapter.
- `codex/` contains the Codex-compatible skill.
- `model-policy.example.json` describes preferences, not a model allowlist.

Both adapters must preserve PM inputs, generate only derived code, record provenance
and run the same deterministic gates.
