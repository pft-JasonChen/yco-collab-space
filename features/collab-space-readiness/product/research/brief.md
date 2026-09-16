# Collab Space Readiness — Research brief

- Feature: collab-space-readiness
- Status: confirmed
- Date: 2026-09-16
- Researcher: agent with PM
- Need (PM's words): prove the PM-only path from inputs to a rendered prototype, and give the intake gate a brief to validate.

This fixture brief exists so `validate:intake` and the mutation suite exercise the
research rules on a feature that has no competitors. Its content is deliberately small.

## Evidence

| Source | Account tier | Observed first-hand | Not observed (inferred or looked up) |
|---|---|---|---|
| This repository | n/a | `collab-space.map.yaml`, `platform/surfaces/catalog.yaml`, `npm run library:components` | none |

Known uncertainties:

1. None; the fixture has no external source.

## Production audit

### Existing

- `button` — the shared Button covers the fixture's primary action, imported through `platform/ui/Button.jsx`.

### Missing

- A readiness status summary and list have no RD counterpart; they are internal fixture UI and stay feature-only.

## Competitors

None. The fixture is an internal readiness check, not a product surface.

## UX principles

- P1 The fixture proves the boundary, not a page pattern; its layout must not imply a production surface. (from the readiness decision basis)

## Recommendations

- Keep the surface strategy novel and feature-specific. source: `product/decisions.md` decision basis, PM statement on the fixture's purpose.
- Reuse the shared Button for the primary action rather than a fixture-owned control. source: `npm run library:components`, `button` contract.

## Confirm with PM

1. None.

## Sources

- `collab-space.map.yaml`, `platform/surfaces/catalog.yaml`, `design-library/components/button/component.yaml`
