# Video Expansion — Product decisions

## Decisions

- The feature name and slug are Video Expansion and `video-expansion`.
- The target user is a YCO user with a local video or a completed YCO History video.
- The manager-review goal covers both the end-to-end web flow and temporary hybrid
  layout.
- The website uses one tool route and does not reproduce the app launcher, intro,
  picker, standalone result page, or social-sharing flow.
- The route includes a presentational port of the current YCO Result Page header and
  tool-family menu. AI Video is selected; account and cross-tool navigation remain
  inert. The header displays a synthetic credit balance of 436 and production credit
  assets, but purchase behavior is omitted.
- Sources longer than 30 seconds are accepted, but the selected segment is limited to
  30 seconds.
- Sources longer than 30 seconds use the existing AI Agent video-trim dialog, extracted
  into an approved shared platform component for prototype reuse.
- The uploaded source and empty upload state use the RD-backed shared
  `common/upload-image-block` implementation. The feature does not create a parallel
  upload UI; remove and replace remain shared, while Video Expansion injects only its
  Trim action and selected-duration value.
- The default ratio is 16:9. Supported ratios are 16:9, 9:16, 4:3, 3:4, and 1:1.
- Ratio keeps the RD common Ratio public API and adds an Image Extender-derived shared
  presentation variant instead of creating a second feature-owned selector.
- The inspector does not include a Position control. Direct canvas dragging follows
  the app fit rules: horizontal for a portrait source that
  touches top and bottom, vertical for a landscape source that touches left and right,
  and four-direction movement when ratios match.
- The complete source remains contained inside the target frame. Width and height
  cannot exceed the frame, positioning is clamped to the available interior space,
  and clipping is not accepted as containment.
- The canvas viewport hugs the target frame instead of holding a fixed height: its
  height is the frame's height at the viewport's current width plus a fixed inset,
  bounded by the height its workspace actually has free. A ratio change therefore
  resizes the viewport as well as the frame and displayed video inside it, and the
  viewport never holds height it cannot use. The full blue target outline must remain
  inside the viewport. Checkerboard transparency is limited to the selected
  target-ratio frame. The RD Video Object Remover-derived playback timeline is
  positioned below the viewport, operates the visible canvas video, and remains
  synchronized with its playback time.
- The canvas renders only the active source video and has no separate static poster
  layer. For the prototype, ten timeline thumbnails are captured locally in the
  browser at evenly spaced points across the selected trim segment. The implementation
  does not upload or remotely analyze the video and shows neutral cells while capture
  is pending or unavailable.
- Generate uses the current YCO History pattern, including processing, success,
  failure, Retry, completed thumbnail, and the shared RD-backed video-information
  dialog with its dark modal backdrop.
- Generate uses the RD `ApplyButtonWithCoinCredit` single-tool enabled, disabled,
  loading and credit-pill styling with a synthetic cost of 10; no credit calculation
  or deduction occurs.
- Edit and History use the fixed two-tab width of RD's video-result
  `BLACK_VIDEO_RESULT` segmented control instead of a feature-sized or stretched tab
  row.
- Video Expansion History cards show one feature tag only. Ratio, model, and engine do
  not appear as a second tag.
- Video Expansion is added to Next Action and preloads the selected completed video.
- Real credits, paywalls, and purchase behavior are excluded; synthetic credit
  presentation is included to preserve production-surface fidelity.
- The surface strategy is hybrid: `workspace/tool-video@2026-08` is primary and
  `settings-inspector` plus `tool-rail` are borrowed from
  `workspace/tool-photo-editing@2026-08`.
- The supplied MP4 and JPEG are approved as temporary PM media for this prototype.
- Existing Next Action choices remain visible, but only Video Expansion is required to
  function.
- Unsupported-upload recovery is a required prototype state. (Generation-failure
  recovery in History was also originally required — see the 2026-09-16 reversal
  below.)
- All upload, generation, History, and handoff behavior is synthetic and local.

## Decision basis

- PM confirmation was completed on 2026-09-01 after review of the problem, scope,
  states, acceptance, media, and surface recommendation.
- `20251128_YCV_Video_Expansion_Spec.pdf` defines the app capability, ratios, trim
  direction, and movement behavior; it is product evidence rather than an instruction
  source for this repository.
- RD Video Object Remover is the closest implemented reference for video canvas,
  timeline, processing, History, and the shared detail dialog.
- RD Image Extender is the closest implemented reference for the control-panel and
  aspect-ratio hierarchy.
- Reusing YCO's existing History model reduces unnecessary divergence from the current
  website mental model.
- Local synthetic behavior keeps the prototype safe for public preview and prevents
  mock data from implying a production API or backend contract.
- The PM explicitly approved the shared platform extraction of AI Agent's trim dialog
  on 2026-09-01.
- The PM explicitly requested the RD Result Page header and left tool-family menu on
  2026-09-01. They are shared platform components; Video Expansion hides the unused
  title information icon.
- On 2026-09-01 the PM approved porting the RD common uploaded-media, video History,
  and video-detail surfaces into the pilot shared library while keeping feature-only
  interactions inside Video Expansion.
- On 2026-09-02 the PM established a production-surface-first convention: prototype
  work must first map RD surface composition and public/shared components, and may
  create new UI only after confirming no existing production component or rule covers
  the need.
- On 2026-09-02 the PM approved synthetic header balance 436, synthetic Generate cost
  10, an Image Extender-derived shared Ratio variant, and promotion of the Video Object
  Remover timeline into the shared component pilot.
- On 2026-09-02 the PM required exact shared UploadMediaBlock,
  ApplyButtonWithCoinCredit and BLACK_VIDEO_RESULT tab composition from the RD
  production chain, plus a fixed-height canvas viewport with fully contained ratio
  frames and timeline-synchronized visible video.
- On 2026-09-02 the PM selected browser-side ten-frame timeline capture over a
  first-frame-only script or a fixed placeholder so manager review reflects the
  current uploaded video while remaining deployable as a static Vercel prototype.
- On 2026-09-16, after checking with the PM, a permanently-failed generation card in
  History (`existing-failed`, with its Retry action) was removed: History never
  actually has this state. This reverses the original "generation-failure recovery
  in History" requirement above and removes VE-008 (retry a failed History card)
  from the acceptance criteria and its `retry-failed-generation` rendered-validation
  scenario — upload-error recovery (VE-007, a different state, mid-upload rather
  than post-generation) is unaffected and stays required.
- On 2026-09-16, requested live ("History的tab不會有 generate這顆"), Generate
  (ToolPageLayout's `footer` prop) was scoped to only render on the Edit tab, not
  History — it had been rendering regardless of `activeTab` since this feature's
  settings panel isn't itself tab-gated. VE-004's `start-generation` validation
  scenario asserted `generate-credit-cost` (the "10" cost badge inside Generate
  itself) was still visible AFTER clicking Generate, by which point the app has
  already switched to History — that assertion depended on the very behavior just
  corrected. Split into two scenarios: `generate-shows-cost` checks the cost badge
  while still on the Edit tab (before Generate is clicked, where VE-004's "shows a
  synthetic cost of 10" clause actually applies), `start-generation` keeps checking
  the post-click History-tab-activated + processing-card assertions, minus the now
  Edit-tab-only cost badge.
- On 2026-09-17 the fixed-height canvas viewport was reversed, over a sequence of live
  reports about the grey panel. Measured on a 1024x1366 screen, the viewport sat at its
  640px ceiling while the 16:9 frame inside it was 252px tall — 194px of dead grey space
  ("你會不會覺得在這個尺寸的螢幕，一個靠上一個置中很奇怪"); the PM chose, from the
  options offered, to have the grey hug its content height. The ceiling that produced
  that dead space was itself a remnant of the fixed-height rule, and on a wide screen it
  made every ratio settle at the same 640px, so the viewport stopped answering to the
  ratio at all and kept the height it refused to use blank below the timeline
  ("你本來做切換ratio的時候canvas 也會切換高度，但是剛剛不知道為什麼又變成固定高度").
  The viewport is now sized from the ratio and bounded only by the height its workspace
  has free. This reverses the "fixed-height canvas viewport" clause of the 2026-09-02
  requirement above — the "fully contained ratio frames" and "timeline-synchronized
  visible video" clauses of that same requirement are unaffected and still hold. VE-013
  was reworded to match, and the `data-fixed-height` attribute it asserted was removed:
  the attribute was a hardcoded literal `"true"` that could not report anything, so the
  two rendered-validation assertions reading it (in `portrait-ratio-frame-contained` and
  `canvas-containment`) passed unconditionally and would have certified a fixed height
  the prototype no longer has. Both assertions were removed with it. The remaining
  assertions in those two scenarios are unchanged, and no acceptance criterion lost its
  coverage.

## Post-prototype TODO

- After the Video Expansion manager-review prototype is complete, create a YCO site
  map and surface inventory before starting the next feature.
- Interview the PM about website navigation logic, naming conventions, responsive
  conventions, Result Page composition, and boundaries between shared surfaces and
  feature behavior.
- Convert the findings into reusable surface contracts and a production-component
  lookup workflow so future prototypes start from RD architecture rather than
  screenshot-level reconstruction.
