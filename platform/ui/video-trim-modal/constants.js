export const FRAME_COUNT = 10;
export const THUMBNAIL_WIDTH = 50;
// Reference (2026-09-15, merged into the shared VideoTimeline component —
// "左邊的調好應該可以直接當右邊那組的元件"): VideoTimeline's own .frames grid
// (var(--spacing-48) tall, no responsive variant) replaced this file's own
// .framesArea/.canvasRow layout, so there's no separate mobile thumbnail
// height to track anymore — one height for both breakpoints.
export const THUMBNAIL_HEIGHT = 48;
// Must match VideoTimeline.module.scss's .frames gap.
export const FRAME_GAP = 4;

// Each canvas is one of FRAME_COUNT slots in VideoTimeline's .frames grid, so
// its actual rendered width depends on that row's measured width (reported
// via VideoTimeline's onFrameAreaResize), not a fixed constant — without
// this, the decoded thumbnail bitmap gets stretched to fit. Unlike the old
// standalone layout this replaced, VideoTimeline's own frames row has no
// inset padding of its own (handles overlay on top via the trim-range box's
// calc() math instead of the frames row leaving room for them) — only the
// inter-frame gaps come off the available width now.
export const getThumbnailWidth = (framesAreaWidth) => {
  if (!framesAreaWidth) return THUMBNAIL_WIDTH;
  const available = framesAreaWidth - FRAME_GAP * (FRAME_COUNT - 1);
  return Math.max(1, Math.floor(available / FRAME_COUNT));
};

// Matches the native <video> controls convention (Blink's time display
// truncates via saturated_cast<int>, not round-to-nearest) so this modal's
// duration text never disagrees with what a browser would show for the
// same file.
export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// Trims {start, end} down to the floor'd whole-second value formatDuration
// shows the user — otherwise a 60.99s drag displays "01:00" but
// trimVideoFile produces a 60.99s file. Math.floor is always <= the raw
// width, so this only ever shrinks from the end; it can't run past the
// video's own duration the way padding up to a ceil'd target could.
export const snapTrimRangeToDisplayedDuration = (range) => {
  const target = Math.floor(range.end - range.start);
  return { start: range.start, end: range.start + target };
};
