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

/**
 * Inset between the canvas viewport and the target frame, in CSS px (total,
 * so half of it lands on each side).
 *
 * Halved from 32 to 16 (2026-09-17, requested live — "我想要1的padding再小一
 * 半，等於讓裡面的東西大一點", against a screenshot marking the grey band
 * around the target frame): the frame is what the user actually works with,
 * so the surrounding breathing room was taking space the frame itself could
 * use. Nothing else reads this constant, so the change is purely "frame gets
 * 16px more in each axis".
 */
export const CANVAS_VIEWPORT_INSET = 16;

/**
 * Floor/ceiling for the canvas viewport's own height, in CSS px. Kept as the
 * single source of truth for both the JS-computed hug-height below and
 * index.module.scss's matching `.canvasViewport` min-height/max-height (a
 * static fallback for the instant before the first measurement paints).
 */
export const CANVAS_VIEWPORT_MIN_HEIGHT = 200;
export const CANVAS_VIEWPORT_MAX_HEIGHT = 640;

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

/**
 * The canvas viewport's own height, sized to hug the target frame at the
 * viewport's current width rather than independently claiming leftover
 * vertical space.
 *
 * Reference (2026-09-17, requested live — "你會不會覺得在這個尺寸的螢幕，一個
 * 靠上一個置中很奇怪", against a 1024x1366 screenshot; measured live: the
 * panel sat at its 640px max-height cap while the actual 16:9 frame inside
 * it was only 252px tall, leaving 194px of dead grey space above and
 * below): the panel's height used to come from CSS alone (min/max-height
 * plus a 30vh starting basis, flex:1 free to grow) — driven by the
 * viewport itself, not by what the frame actually needed. This instead
 * derives the frame's height from the panel's WIDTH (which layout already
 * sets independently, so no circularity) and returns panel height = that
 * frame height + the same inset used around it, clamped to the existing
 * min/max so both the old short-mobile floor ("390 的手機沒辦法露出ratio")
 * and the old wide-desktop ceiling still hold.
 */
export function canvasViewportHeightFor(width, targetRatio) {
  const availableWidth = Math.max(0, width - CANVAS_VIEWPORT_INSET);
  const frameHeight = targetRatio ? availableWidth / targetRatio : 0;
  const desired = frameHeight + CANVAS_VIEWPORT_INSET;
  return Math.round(Math.min(CANVAS_VIEWPORT_MAX_HEIGHT, Math.max(CANVAS_VIEWPORT_MIN_HEIGHT, desired)));
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
