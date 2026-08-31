# Evaluation grader adapters

Deterministic and browser graders run locally. Visual review remains provider-neutral:

1. run rendered validation;
2. run `npm run eval:visual:packet -- --feature <feature>`;
3. give the packet, screenshots and `visual-surface-rubric.md` to an independent human
   or multimodal model;
4. store the result using `tools/prototype-cli/schemas/visual-review.schema.json`;
5. calibrate model labels against PM／Designer labels before setting a release threshold.

Do not let the model that generated the prototype certify its own visual output for
`design-final`.

## Decision basis

The local hard gates must remain vendor-neutral. Model graders are optional adapters
because provider availability, price and model quality change independently of the
prototype contract.

