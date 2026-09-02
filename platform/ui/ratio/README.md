# Shared Ratio

Approved platform extraction of the RD common Ratio component from
`/Users/jasonchen/Downloads/yce-frontend-gm-260909/src/components/common/ratio/`.

## Preserved from RD

- `ratioList`, `ratio`, `setRatio`, `extraFunction`, `variant`, and `titleVariant`
  prop concepts.
- RD `default`, `gery`, and `gery_v2` variants.
- Two-column versus three-column `gery_v2` layout.
- Ratio-shape swatch, active-state comparison, and `w:h` labels.

## Platform adaptations

- Replaced i18n with a portable `title` prop whose default is `Aspect ratio`.
- Removed GTM element IDs and all analytics behavior.
- Replaced Lodash size/get helpers with native JavaScript.
- Replaced clickable `div` elements with semantic buttons and `aria-pressed`.
- Replaced RD raw colors and global SCSS imports with existing RD CSS variables.
- Added disabled state, deterministic test-ID callbacks, and tablet overflow handling.

The component is presentational and performs no network, routing, analytics, or
production-state work.
