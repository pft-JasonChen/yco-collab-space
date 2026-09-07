export const MAX_TRIM_SECONDS = 60;
export const MIN_TRIM_SECONDS = 5;
export const FRAME_COUNT = 10;
export const THUMBNAIL_WIDTH = 50;
export const THUMBNAIL_HEIGHT = 56;
export const THUMBNAIL_HEIGHT_MOBILE = 40;
// Horizontal padding baked into the frames-area layout (trim-canvas-row /
// trim-range-overlay both inset by this much) so handles have room to sit
// outside the selection box instead of eating into it.
export const FRAME_INSET = 16;
// Must match trim-timeline.module.scss's .trimCanvasRow gap.
export const FRAME_GAP = 4;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Single source of truth for the frames-area's time-to-pixel scale, so the
// render (trim-timeline.js) and drag (use-trim-drag.js) math can't drift out
// of sync with each other.
export const getPxPerSecond = (framesAreaWidth, duration) =>
  duration ? Math.max(framesAreaWidth - FRAME_INSET * 2, 0) / duration : 0;

// Each canvas is a flex: 1 slot in the row, so its actual rendered width
// depends on the frames-area's measured width, not a fixed constant —
// without this, the decoded thumbnail bitmap gets stretched to fit.
export const getThumbnailWidth = (framesAreaWidth) => {
  if (!framesAreaWidth) return THUMBNAIL_WIDTH;
  const available =
    framesAreaWidth - FRAME_INSET * 2 - FRAME_GAP * (FRAME_COUNT - 1);
  return Math.max(1, Math.floor(available / FRAME_COUNT));
};

export const isTrimRangeTooLong = (range) =>
  Math.floor(range.end - range.start) > MAX_TRIM_SECONDS;

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
