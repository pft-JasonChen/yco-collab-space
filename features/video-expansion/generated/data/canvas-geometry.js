/**
 * L2 — Video Expansion canvas geometry.
 *
 * Pure functions and data only: no React, no DOM, no imports. Everything the
 * canvas needs to decide "how big is the target frame, which way may the source
 * move, and how far" lives here so it can be unit-tested and carried into RD
 * without touching a component.
 */

/** Padding used by the ratio swatch so each option keeps its aspect ratio. */
export const RATIO_SWATCH_PADDING = {
  '1:1': '7px',
  '3:4': '7px 9.5px',
  '4:3': '9.5px 7px',
  '9:16': '7px 11.375px',
  '16:9': '11.375px 7px',
};

/** Inset between the canvas viewport and the target frame, in CSS px. */
export const CANVAS_VIEWPORT_INSET = 32;

/** Two ratios closer than this read as "the same shape" to a viewer. */
export const RATIO_MATCH_TOLERANCE = 0.015;

export function parseRatio(label) {
  const [w, h] = String(label).split(':').map(Number);
  return { w, h };
}

export function ratioValue(label) {
  const { w, h } = parseRatio(label);
  return h ? w / h : 0;
}

/** Ratio options for the shared Ratio component, derived from PM mock data. */
export function buildRatioOptions(ratios) {
  return ratios.map((option) => ({
    ...option,
    ...parseRatio(option.label),
    padding: RATIO_SWATCH_PADDING[option.label],
  }));
}

/**
 * Which axis the source may be dragged along. A source narrower than the target
 * can only move horizontally, a taller one only vertically, and a matching one
 * has nowhere to go, so it is reported as `free` and clamped to zero anyway.
 */
export function movementAxis(sourceRatio, targetRatio) {
  if (Math.abs(sourceRatio - targetRatio) < RATIO_MATCH_TOLERANCE) return 'free';
  return sourceRatio < targetRatio ? 'horizontal' : 'vertical';
}

/** Largest target frame that fits the viewport while keeping the target ratio. */
export function targetFrameSize(viewportSize, targetRatio) {
  const availableWidth = Math.max(0, viewportSize.width - CANVAS_VIEWPORT_INSET);
  const availableHeight = Math.max(0, viewportSize.height - CANVAS_VIEWPORT_INSET);
  if (!availableWidth || !availableHeight || !targetRatio) return { width: 0, height: 0 };
  if (availableWidth / availableHeight > targetRatio) {
    return { width: Math.floor(availableHeight * targetRatio), height: Math.floor(availableHeight) };
  }
  return { width: Math.floor(availableWidth), height: Math.floor(availableWidth / targetRatio) };
}

/** How far the source may travel from centre before it would leave the frame. */
export function positionBounds(frameWidth, frameHeight, sourceRatio, targetRatio) {
  if (sourceRatio < targetRatio) {
    return { x: Math.max(0, (frameWidth - frameHeight * sourceRatio) / 2), y: 0 };
  }
  if (sourceRatio > targetRatio) {
    return { x: 0, y: Math.max(0, (frameHeight - frameWidth / sourceRatio) / 2) };
  }
  return { x: 0, y: 0 };
}

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/** Clamp a candidate position to the bounds and to the permitted axis. */
export function clampPosition(position, bounds, movement) {
  return {
    x: movement === 'vertical' ? 0 : clamp(position.x, bounds.x),
    y: movement === 'horizontal' ? 0 : clamp(position.y, bounds.y),
  };
}

/** Inline sizing that letterboxes the source inside the target frame. */
export function mediaSizing(sourceRatio, targetRatio) {
  if (sourceRatio < targetRatio) return { height: '100%', width: 'auto', maxWidth: '100%' };
  if (sourceRatio > targetRatio) return { width: '100%', height: 'auto', maxHeight: '100%' };
  return { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' };
}

/** True when the rendered source sits entirely inside the target frame. */
export function isContained(frameRect, mediaRect, tolerance = 1) {
  return (
    mediaRect.left >= frameRect.left - tolerance &&
    mediaRect.top >= frameRect.top - tolerance &&
    mediaRect.right <= frameRect.right + tolerance &&
    mediaRect.bottom <= frameRect.bottom + tolerance
  );
}
