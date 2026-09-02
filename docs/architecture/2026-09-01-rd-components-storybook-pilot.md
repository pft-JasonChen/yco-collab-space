# RD Components＋Storybook v0.1 Pilot

Status: Product Owner approved for implementation on 2026-09-01. Designer and RD
canonical review remains pending.

## Purpose

This pilot activates the limited component-catalog work that the 2026-08-31 Collab
Space plan intentionally deferred. It does not replace or reorder M0–M9. It is the
first P1C evidence-gathering slice after the M9 feature pilot.

The delivery target is a Storybook catalog and React components that Collab Space
prototypes can import. It is not a published package and does not claim drop-in
compatibility with the RD production application.

## Source layering

```text
RD snapshot evidence + pending Figma mapping
                    ↓
design-library/components/<stable-id>/component.yaml
                    ↓
platform/ui/<component>/ + colocated Storybook stories
                    ↓
features/<feature>/generated imports + recorded hashes
```

- RD code and assets are copied through an explicit allowlist; the snapshot is never a
  runtime dependency.
- Component contracts preserve RD paths and hashes. Figma fields may remain `pending`
  during the RD-baseline phase.
- `pilot-approved` is PO approval for prototype use only. `canonical-approved` still
  requires Designer and RD review.
- Designer may edit component styles and stories during the pilot. The same PR must
  keep the contract, implementation and examples aligned.
- Figma changes are synchronized through reviewed PRs. Automatic Figma ingestion and
  code generation remain deferred.

## Pilot families

| Family | RD mapping | Pilot result |
|---|---|---|
| Button | `components/common/button-wrapper` | Portable foundation component |
| Ratio | `components/common/ratio` | Portable foundation component |
| Video Trim Modal | AI Agent video trim modal | Portable composite component |
| Result Page Shell | Header＋features SideBarMenu | Pure-props composite port |
| Upload Media Block | Common upload-image-block | Pure-props composite port with feature action slot |
| Video History | Common video-feature History/filter/result video | Pure-props History pattern |
| Video Info Dialog | Common Modal＋video-detail-modal＋Next Action | Pure-props dialog pattern |
| Position Control | No standalone RD component found | Removed by PM; direct canvas dragging stays feature-only |

Storybook runs locally on the configured port and builds to `storybook-static/`. The
static catalog is a local/shareable review artifact and is never included in the
public prototype build.

## Review and change policy

- PO maintains pilot scope and may grant `pilot-approved`.
- Designer owns visual and Figma mapping review.
- RD reviews source mapping, dependency removal and future production compatibility.
- Agent maintains deterministic schema, provenance, Storybook build and rendered
  validation.
- Production auth, routing, Redux, credits, CMS, analytics and network orchestration
  are excluded from platform UI.
