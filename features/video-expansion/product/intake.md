# Video Expansion — Intake

## Problem

YCO users who already have a video need to adapt it to a different aspect ratio
without cropping away the original content. Video Expansion extends the surrounding
frame with the same product capability defined for YouCam Video, adapted to YCO's
existing web tool and history patterns.

## Review goal

The manager should be able to approve both the complete YCO interaction flow and the
temporary hybrid layout: upload or Next Action handoff, trim and direct canvas positioning, choose an
aspect ratio, generate, monitor the task in History, and reopen the result through the
shared video-information dialog.

## Target user

An existing or prospective YCO user who has a local source video, or who is viewing a
completed YCO video in History and wants to expand that video into another aspect
ratio.

## Scope

- Use one YCO tool route rather than reproducing the app launcher, intro, picker, or
  standalone result pages.
- Include the current YCO Result Page shell: a production-style YouCam Online Editor
  header and the desktop tool-family menu, with AI Video shown as the active family.
  In the prototype these shell controls are presentational only and do not navigate or
  authenticate. The header shows a synthetic credit balance of 436 with the production
  credit and add icons; the control is inert and does not open purchase UI.
- Accept a local video or a video handed off from the shared History dialog.
- Allow a source longer than 30 seconds, while limiting the selected segment to a
  maximum of 30 seconds.
- Reuse the shared AI Agent video-trim dialog when a source longer than 30 seconds
  needs a segment selection before editing or generation.
- Default to 16:9 and offer 16:9, 9:16, 4:3, 3:4, and 1:1.
- Keep the shared Ratio API established from RD common Ratio, with an Image
  Extender-derived presentation variant for this panel rather than introducing a
  second feature-owned ratio selector.
- Use the shared RD `common/upload-image-block` presentation for both empty and
  uploaded video states without recreating either state in feature code. Video
  Expansion may inject only its feature-owned Trim action into the shared action
  column and shows the selected duration on the shared thumbnail.
- Show the shared trim dialog before the editor for longer sources. Remove the separate
  applied-trim row and the Position control from the inspector.
- Show a right-side result canvas inside a fixed-height viewport. Changing ratio does
  not change the viewport height; it changes the target frame and displayed-video
  dimensions within that viewport. Checkerboard transparency is limited to the
  selected target-ratio frame, whose complete blue outline must remain visible inside
  the viewport. A shared Video Object Remover-derived timeline sits below the viewport
  without overlaying it and stays synchronized with the visible canvas video. The user
  positions the source by dragging it directly in the canvas, constrained by the
  source-to-target fit.
- Render only the active source `<video>` inside the target frame; do not layer a
  separate static poster image behind or above it. Build the ten-cell playback
  timeline from client-side frame captures sampled evenly across the selected trim
  segment. Frame capture remains in the browser and never uploads or sends the video
  for analysis; neutral cells are shown while captures are pending or unavailable.
- Keep the complete source video inside the target canvas frame at every ratio and
  position. Neither rendered dimension may exceed the frame, and clipping overflow
  does not satisfy this rule.
- Use RD-backed shared YCO History cards, filtering presentation, and video-information
  dialog patterns. Opening the dialog adds the shared dark modal backdrop.
- Add Video Expansion to the dialog's Next Action choices and preload the selected
  history video when that action is chosen.
- Show exactly one feature tag, Video Expansion, on Video Expansion History cards; do
  not add a second model, engine, or ratio tag.
- Place Generate in the exact RD-derived `ApplyButtonWithCoinCredit` single-tool action
  treatment, including its brand enabled state, grey disabled state, credit pill and
  loading state. Show a synthetic cost of 10 beside the production credit icon. No
  balance calculation or deduction occurs.
- Use the RD video-result `BLACK_VIDEO_RESULT` Edit/History segmented-control width
  and sizing rather than stretching the tabs across the result toolbar.
- Exercise unsupported-upload and generation-failure recovery with synthetic local
  states.
- Keep all processing, credit display, and history behavior local and synthetic. No
  engine, backend, account, credit service, purchase flow, or production-data
  integration is implied.

## Open product decisions

None. Final Figma, final media, and Designer approval of the temporary composition are
non-blocking design gaps.

## Decision basis

- The YouCam Video specification supplies the capability, supported ratios, trim
  limit, and movement rules.
- The PM explicitly chose YCO's current tool and History flow instead of copying the
  app navigation and result flow.
- Video Object Remover supplies the closest video-canvas, timeline, processing, and
  History behavior in the RD snapshot, as well as the Result Page header and desktop
  tool-family menu surrounding that tool.
- Image Extender supplies the closest control-panel and aspect-ratio composition in
  the RD snapshot.
- AI Agent supplies the existing video-trim dialog interaction and presentation in
  the RD snapshot; it is extracted as an approved shared platform component.
- RD common upload-image-block and common video-feature History/detail surfaces supply
  the shared presentation baseline; feature-specific Trim and canvas interactions stay
  in Video Expansion.
- Synthetic credit presentation is included for production-surface fidelity, while
  live credit state, purchase behavior, and live processing remain excluded.
