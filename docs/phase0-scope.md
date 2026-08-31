# Phase 0 scope

Phase 0 proves one PM-only path:

```text
PM inputs → AI-generated React → deterministic checks → rendered preview
```

Included:

- Vite, React JavaScript and SCSS Modules
- exact RD token snapshot
- structured PM contract and fake data
- generated code committed to Git
- static and rendered validation
- public mock-only preview

Deferred:

- Figma ingestion and Designer workflow rules
- YCO-spec adapter
- automatic promotion and release tags
- repository policy enforcement
- protected preview URLs
- full RD component migration

## Phase 0.5 extension

Phase 0.5 adds the pre-generation and evaluation controls needed before the first real
feature pilot:

- PM-confirmed `/prototype-intake` separated from code generation;
- `reuse`, `hybrid` and non-blocking `novel` Surface strategies;
- four provisional, versioned Surface Packs and sixteen planned catalog entries;
- source snapshot／mutation protection;
- Surface structural checks and horizontal-overflow checks at every viewport;
- isolated workflow trials, pass@1／pass^k reporting and a 12-case mutation suite;
- provider-neutral visual-review packets and output schema.

The first real feature remains the cutover gate. Phase 0.5 infrastructure passing on the
readiness fixture does not replace PM review of an actual product brief.

## Decision basis

- Intake must precede Surface selection because a new feature may not match any current
  page pattern.
- Surface Packs reduce generic UI drift but cannot become an allowlist that blocks novel
  product exploration.
- Deterministic, browser, structural, mutation and human-calibrated visual graders catch
  different failure classes; no single score can replace them.
