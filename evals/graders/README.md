# Evaluation grader adapters

Deterministic and browser graders run locally. Judgement graders are provider-neutral
rubrics applied by an independent reviewer.

## Intake rubric

1. run `npm run validate:intake -- --feature <feature>`;
2. give `intake-rubric.md` and the feature's product folder to the reviewer role
   (`.claude/agents/prototype-reviewer.md` on Claude, `agent-adapters/codex/subagents.md`
   on Codex) on a model other than the one that wrote the source;
3. store the JSON as `features/<feature>/evidence/intake-review.json`, validated by
   `tools/prototype-cli/schemas/intake-review.schema.json`;
4. a `fail` goes back to the PM with the quoted line before generation.

## Visual rubric

1. run rendered validation;
2. run `npm run eval:visual:packet -- --feature <feature>`;
3. give the packet, screenshots and `visual-surface-rubric.md` to an independent human
   or multimodal model;
4. store the result using `tools/prototype-cli/schemas/visual-review.schema.json`;
5. calibrate model labels against PM／Designer labels before setting a release threshold.

Do not let the model that generated the prototype certify its own visual output for
`design-final`, and do not let the model that wrote the intake source score it.

## Decision basis

The local hard gates must remain vendor-neutral. Model graders are optional adapters
because provider availability, price and model quality change independently of the
prototype contract. `agent-adapters/model-policy.json` names the preferred Claude and
OpenAI model per role.
