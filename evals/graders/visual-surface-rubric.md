# Visual and Surface rubric

This rubric is used by an independent multimodal judge or calibrated human reviewer.
It is not a substitute for deterministic or browser gates.

Score each dimension separately and return `Unknown` when evidence is insufficient:

1. **Surface fit** — the chosen reuse／hybrid／novel strategy supports the feature's
   mental model without forcing an unrelated page pattern.
2. **Information hierarchy** — the review goal, primary content and primary action are
   easy to identify.
3. **YCO recognition** — the artifact uses the authoritative tokens and approved shared
   patterns instead of a generic AI-generated visual language.
4. **Responsive composition** — information priority is preserved at every configured
   viewport without overflow or hidden critical actions.
5. **State clarity** — empty, loading, success, error and recovery states remain visually
   distinguishable where the contract requires them.

For model comparison, randomise output order and prefer blind pairwise review. Calibrate
the judge against PM／Designer labels before using its score as a release threshold.

## Decision basis

Functional correctness and visual quality are independent dimensions. A single score
must not allow attractive presentation to compensate for broken behavior or source
violations.

