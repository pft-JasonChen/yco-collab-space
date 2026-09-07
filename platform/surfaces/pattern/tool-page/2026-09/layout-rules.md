# Tool Page layout rules

The two-column tool page: a fixed-width settings inspector on the left, a fluid
result column on the right, both inside the global shell.

The inspector scrolls independently of the result. Its primary action is pinned to
the bottom of the inspector, not the page, so it stays reachable while the inspector
scrolls. The result column owns its own scrolling and never inherits the inspector's.

Below the settings breakpoint the columns stack: inspector first, result second,
primary action pinned to the viewport instead of the column.

## Decision basis

31 of 34 RD result-page families import `common/feature-layout`, making this the one
near-universal page skeleton in production. The three that do not are recorded in
`docs/surfaces/rd-composition-deviations.md`; none of them is a standard tool page.
