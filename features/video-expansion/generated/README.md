# Video Expansion generated prototype

This implementation is a local, mock-only presentation port of selected components
from the RD snapshot at `/Users/jasonchen/Downloads/yce-frontend-gm-260909`.

## RD presentation sources

- `src/components/common/headers/`
  - Imported through `platform/ui/result-page-shell/`: white Result Page header,
    exact allowlisted YCO logos, centered module title, right account affordance and
    synthetic RD-backed credit presentation.
  - Adapted: account and credit controls are inert; balance 436 does not come from a
    service and the purchase flow is intentionally absent.
- `src/components/result-page/common/features-panel/components/sideBarMenu/`
  - Imported through `platform/ui/result-page-shell/`: 112px desktop tool-family
    rail, RD icons/glyph font, Home divider, 80px menu items and active AI Video treatment.
  - Adapted: other tool families are context-only; the tablet rail scrolls
    horizontally and no item performs cross-route navigation.
- `src/components/result-page/common/feature-layout/`
  - Imported through `platform/ui/tool-page-layout/`: 400px/320px inspector sizing,
    left-settings/right-result composition and responsive stacking.
- `src/components/result-page/video-object-remover/components/results/`
  - Imported through `platform/ui/video-results-surface/`: result tab placement,
    intrinsic 368px `BLACK_VIDEO_RESULT` Edit/History control, History filter and
    canvas/list padding.
- `src/components/result-page/common/apply-button-with-coin-credit/`
  - Imported through `platform/ui/credit-controls/`: fixed panel action bar,
    production brand/disabled/loading states, credit pill and synthetic cost 10 using
    the RD credit and loading assets.
- `src/components/ai-agent-page/components/video-trim-modal/`
  - Imported through the approved shared platform extraction at
    `platform/ui/video-trim-modal/`.
  - The feature supplies a 30-second maximum and uses the shared dialog before the
    editor for longer sources.
- `src/components/common/upload-image-block/`
  - Imported through `platform/ui/upload-media-block/`: shared 368:136 empty/uploaded
    states, exact RD add/remove/replace assets and selected-duration badge.
  - Video Expansion injects only the extra Trim trigger through the shared action slot.
- `src/components/result-page/out-paint/components/settings/ratio/`
  - Applied as the `image_extender` presentation variant of the existing shared
    common Ratio API; no second feature-owned ratio component is introduced.
- `src/components/result-page/video-object-remover/components/timeline/`
  - Imported through `platform/ui/video-timeline/`: play/pause, seek, thumbnail strip,
    selected-range time and exact RD play/pause assets.
- `src/components/result-page/common/video-feature/history-videos/`
  - Imported through `platform/ui/video-history/`: vertically stacked white result
    cards, native video controls, single feature tag and RD result-action icons. Filter
    presentation is owned by the shared Video Results Surface.
- `src/components/result-page/common/video-feature/video-detail-modal/`
  - Imported through `platform/ui/video-info-dialog/`: shared dark backdrop,
    near-full-screen 17:8 preview/detail split and scrollable metadata column.
- `src/components/result-page/common/video-feature/next-action/`
  - Ported: two-column pill actions and bottom action row.
  - Adapted: Video Expansion is added as the seventh video action.

## Local adapters

The feature-specific RD components still depend on Next.js, Redux, i18n, production
APIs, task polling, authentication, live credits, analytics and the full RD asset bundle,
so their presentation is ported with local adapters. Video trimming is the exception:
it now imports the approved portable platform extraction of AI Agent's trim dialog.

Canvas positioning is feature-owned and uses direct pointer dragging with measured
frame geometry. A fixed-height responsive viewport measures its available bounds and
fits every ratio frame inside with a visible blue outline; changing ratio changes the
frame and video dimensions, not the viewport height. The source is rendered with
contain fit and movement is clamped to the remaining interior space, so clipping is
never used as a substitute for containment. The Video Object Remover-derived playback
timeline is rendered below the viewport and controls the same visible video element,
keeping play, pause, seek and progress synchronized.

No engine, backend, account or production API is used.

## Component ownership

- Shared platform imports used by this feature:
  - `platform/ui/button/` — RD variant API with local dependency and accessibility adapters.
  - `platform/ui/credit-controls/` — RD-backed credit balance, badge and Generate action bar.
  - `platform/ui/tool-page-layout/` — pure-props RD FeatureLayout composition.
  - `platform/ui/video-trim-modal/` — approved portable extraction of the RD
    AI Agent trim dialog.
  - `platform/ui/ratio/` — approved portable extraction of RD
    `src/components/common/ratio/`, without i18n, GTM, Lodash, or production state.
  - `platform/ui/result-page-shell/` — pure-props composition of the RD Header and
    tool-family menu with allowlisted Design Library assets.
  - `platform/ui/upload-media-block/` — pure-props RD common uploaded-media block.
  - `platform/ui/video-history/` — pure-props RD common video History pattern.
  - `platform/ui/video-info-dialog/` — pure-props RD common modal and video-detail pattern.
  - `platform/ui/video-results-surface/` — RD Edit/History/Filter surface composition.
  - `platform/ui/video-timeline/` — PO-promoted RD Video Object Remover timeline.
- Feature-generated components in `feature.jsx`:
  - Thin `UploadSection` and `RatioSelector` adapters, `EmptyResult`, and the
    Video Expansion-only target-frame dragging/containment composition.

The eleven shared families are `pilot-approved` for Collab Space prototype imports;
they are not presented as Designer/RD canonical production packages. The previous
Position Control was removed by PM decision; direct canvas dragging is feature behavior.
