# Video Expansion

## Goal

Enable a YCO user to expand a video into a selected target aspect ratio while
preserving the original content, then follow the existing YCO History and video-detail
experience. The PM prototype is intended to confirm the web flow and layout, not the
production engine or service contract.

## Required behaviour

### Entry and upload

- The feature opens at `/features/video-expansion/`.
- The route includes the current YCO Result Page presentation shell: the YouCam Online
  Editor header, a centered Video Expansion title, an inert account affordance, and a
  tool-family menu with AI Video selected.
- Tool-family items remain visible for context but do not perform real navigation in
  this prototype. The header shows the production credit treatment with a synthetic
  balance of 436 and an add icon; it is inert and does not open purchase UI.
- An empty state offers local video upload and a deterministic supplied sample.
- A completed video can also enter through Video Expansion in the shared History
  dialog's Next Action area; the dialog closes and the chosen video is preloaded.
- Unsupported or corrupt media shows an inline error and a clear way to choose another
  file.

### Trim, ratio, and position

- A loaded source shows a dominant video canvas on the right and feature controls on
  the left at desktop widths.
- The inspector imports the RD-backed shared `common/upload-image-block` presentation
  for both empty and uploaded states. Video Expansion does not restyle or reconstruct
  the upload block; it injects only a feature-owned Trim action beside the shared
  remove and replace actions.
- The selected trim duration is shown at the bottom-right of the uploaded thumbnail;
  there is no separate applied-trim row below the block.
- A source may be longer than 30 seconds, but the selected segment is limited to 30
  seconds in the shared trim dialog.
- A source longer than 30 seconds opens the shared AI Agent video-trim dialog before
  entering the editor. Confirming the dialog applies the selected segment; canceling
  returns to the source-selection state.
- The default target ratio is 16:9.
- Available ratios are 16:9, 9:16, 4:3, 3:4, and 1:1.
- The selector keeps the shared RD common Ratio interface and uses the visual hierarchy
  of the Image Extender ratio options through a shared presentation variant.
- There is no Position control in the inspector. The user drags the source directly
  inside the target canvas.
- For a portrait source that touches the target's top and bottom edges, canvas dragging
  is horizontal only. For a landscape source that touches the target's left and right
  edges, dragging is vertical only. When ratios match, dragging is allowed in all four
  directions.
- The result canvas has a fixed viewport height for the current responsive breakpoint.
  Changing ratio does not resize that viewport; it updates the target-frame and
  displayed-video dimensions inside it without discarding the selected trim segment.
- Every supported ratio frame is fitted entirely inside the viewport. Its complete
  blue outline remains visible and no side may extend beyond or be clipped by the
  viewport.
- The complete source video must remain contained within the target canvas frame.
  Its rendered width must not exceed the frame width, its rendered height must not
  exceed the frame height, and repositioning must be clamped so no source-video edge
  crosses the frame. Hiding an out-of-frame portion with clipping is not sufficient.
- Checkerboard transparency appears only inside the selected target-ratio frame rather
  than across the full result workspace or as a black background.
- A shared Video Object Remover-derived timeline sits below the fixed canvas viewport,
  never overlays the transparent target area, and supports play/pause and seeking
  within the selected trim range. Timeline playback and seeking operate the same
  visible video element rendered inside the target frame, and timeline progress stays
  synchronized with that video.
- The target frame contains one visual media layer: the active source `<video>`. A
  separate static poster image must not remain in the canvas because it would overlap
  the uploaded video.
- For the prototype, the browser samples ten evenly spaced frames from the selected
  trim segment and displays those captures in the timeline. Captures are derived
  locally from the current source video, including a user-selected local file; no
  backend, network upload, media-analysis service, or fixed placeholder image is used.
  Neutral timeline cells are acceptable only while capture is pending or if the
  browser cannot decode the source.

### Generate and History

- Generate is the primary action and is available after a valid source, segment, and
  ratio are present.
- Generate uses the RD `ApplyButtonWithCoinCredit` single-tool action treatment,
  including production enabled, disabled, loading, credit-pill, colour and icon
  states. It displays a synthetic cost of 10 with the production credit icon.
  Selecting it does not deduct credits or call a credit service.
- Edit and History use the intrinsic two-tab width and sizing of RD's video-result
  `BLACK_VIDEO_RESULT` segmented control; the control does not stretch across the
  available result toolbar on desktop.
- Generate switches to the shared RD-backed History presentation and creates a
  synthetic processing card.
- A successful mock task becomes a completed video thumbnail.
- Every Video Expansion processing, success, and failed History card shows exactly one
  feature tag, Video Expansion. It does not show a second model, engine, or ratio tag.
- A failed mock task becomes a failed History card with Retry.
- Clicking a completed thumbnail opens the shared RD-backed video-information dialog
  over a dark modal backdrop, with video preview, source information, metadata,
  existing actions, and Next Action choices.
- Video Expansion appears as a Next Action. Choosing it preloads the selected result in
  the Video Expansion editor. A handed-off video longer than 30 seconds must be
  trimmed before generation.

### Responsive behaviour

- At desktop and compact-desktop widths, the inspector remains distinct from the
  canvas, the tool-family menu remains on the left, and the canvas is the dominant
  region.
- At tablet width, controls may stack around the canvas, but the uploaded-media Trim
  action, canvas playback timeline, and Generate action remain reachable without horizontal overflow. The
  shared trim dialog must also fit without horizontal overflow. The tool-family menu
  may become a compact horizontal rail while retaining AI Video as the active item.

### Prototype simplifications

- The supplied video and thumbnail are temporary PM media.
- Video duration, processing, history completion, errors, and handoffs are synthetic
  local state.
- Existing Next Action choices remain visible for contextual fidelity, but only Video
  Expansion must perform a handoff.
- No network request, upload service, generation engine, persistent history, or real
  download is used.
- Timeline frame extraction is a browser-only preview implementation and is not a
  production transcoding or thumbnail-service contract.

## Out of scope

- Real credit balances, deductions, paywalls, purchase flows, and functional account
  actions. Synthetic credit presentation remains in scope for surface fidelity.
- App launcher, intro, device picker, standalone app result page, social sharing, and
  real navigation to other tool families.
- Production authentication, analytics, storage, task polling, backend, or API
  behavior.
- A production engine contract, exact processing duration, final copy, final Figma,
  or Designer-approved media.
- Functional behavior for the existing Next Action choices other than Video
  Expansion.
