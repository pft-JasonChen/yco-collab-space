export const FRAME_COUNT = 10;
export const FRAME_INSET = 16;
export const FRAME_GAP = 4;
export const THUMBNAIL_HEIGHT = 56;
export const THUMBNAIL_HEIGHT_MOBILE = 40;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getPxPerSecond = (width, duration) =>
  duration ? Math.max(width - FRAME_INSET * 2, 0) / duration : 0;

export const getThumbnailWidth = (width) => {
  if (!width) return 50;
  const available = width - FRAME_INSET * 2 - FRAME_GAP * (FRAME_COUNT - 1);
  return Math.max(1, Math.floor(available / FRAME_COUNT));
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const remainingSeconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export const snapRange = (range) => {
  const duration = Math.floor(range.end - range.start);
  return { start: range.start, end: range.start + duration };
};
