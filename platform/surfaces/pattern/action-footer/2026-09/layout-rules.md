# Action Footer layout rules

One full-width action pinned to the bottom of the settings inspector, carrying its
label and its credit cost.

Disabled is a first-class state, not a dimmed enabled state: it has its own fill and
keeps the label legible. The enabled treatment is the brand fill with a white label,
byte-identical to production — including its known contrast exception, recorded as
DESIGN-005.

## Decision basis

Two variants coexist in RD: `apply-button` for editing tools and
`apply-button-with-coin-credit` for generative ones, split along whether the action
costs credits. This pattern models the credit-bearing variant, which is the one a new
generative feature needs.
