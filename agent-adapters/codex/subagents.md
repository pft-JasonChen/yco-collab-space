# Codex: running the validator and reviewer roles

Codex has no in-process sub-agent. The same separation is achieved by running each role
as its own `codex exec` process on the model `../model-policy.json` names for it, with
the main session reading only the process's final output.

## Validator

```bash
codex exec -m gpt-5-mini --sandbox workspace-write \
  "You validate; you never edit. Run: npm run prototype:check:fast -- <feature> [--check a,b]. \
   If the rendered step ran, run: npm run rendered:summary -- <feature>. \
   Return only: RESULT line, the error lines verbatim (max 40), the rendered summary verbatim, \
   and the single command that re-runs the failed checks."
```

The main session pastes nothing else from the run into its own context.

## Reviewer

```bash
codex exec -m gpt-5 --sandbox read-only \
  "Apply evals/graders/intake-rubric.md to features/<feature>/product (intake.md, prd.md, \
   prototype.contract.yaml, validation.yaml, decisions.md canonical sections, research/brief.md if present). \
   Return one JSON object that validates against tools/prototype-cli/schemas/intake-review.schema.json. \
   Set reviewer.type=model, reviewer.provider=openai, reviewer.model to your model id. JSON only."
```

Save the output as `features/<feature>/evidence/intake-review.json`. When Claude
generated the artifact, an OpenAI reviewer is the preferred pairing; when Codex
generated it, run the reviewer on Claude (`claude -p` with the same prompt) or on a
different OpenAI model id. The builder model never reviews its own output.

## Researcher

```bash
codex exec -m <main-tier model> --sandbox workspace-write \
  "Follow agent-adapters/workflows/prototype-research.md for <feature>. Write only \
   features/<feature>/product/research/brief.md and return its content."
```

## Provenance

Whatever model produced the generated code is what `prototype:finish` records:

```bash
npm run prototype:finish -- <feature> --adapter codex --model <model-id> --usage '{"inputTokens":0,"outputTokens":0,"rounds":0}'
```

Codex has no equivalent of the Claude write guard or Stop hook. `prototype:update:begin`
and `prototype:finish` remain the after-the-fact protection: a source change during
update fails the guard check, and a missing model id fails `prototype:finish`.
