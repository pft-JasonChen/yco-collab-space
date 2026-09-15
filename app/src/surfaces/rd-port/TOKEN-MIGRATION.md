# RD Surface token migration

PM approval: 2026-09-15. Where no exact existing token or Designer definition exists, keep RD structure and interaction and use approximate tokens with an itemized difference record. Designer review remains pending.

`token-colour-mapping.json` records every SCSS occurrence: file, line, RD colour, selected existing token, resolved value and exact/approximate classification. 263 occurrences: 151 exact (including 8-bit alpha rounding), 112 approximate. No upstream token or validator was modified.

Visible temporary differences include a more muted amber Subscribe gradient, a paler cyan gradient, a less saturated green AI Video basket, and changed neutral overlay/border opacities. These are not Designer-approved final colours. The mapping also covers dormant RD style branches; counts are source occurrences, not distinct visible elements.

Non-token local variables were converted without changing their computed values: Card's transition remains 350ms with 120ms overlap; CategoryBasket retains the original measured `cols`, now passed directly as `gridTemplateColumns`, and its 4/5-column pre-measurement media rules remain. The unused LoginBanner row has no effective-track-width provider in this port and retains its original 100% fallback. No markup or event handlers changed for these conversions.

Scope: SCSS colour migration. Inline styles in RD JavaScript are not covered by this record and require a separate audit before promoting these modules to shared UI. Full Surface acceptance and source provenance refresh remain separate from the token gate.
