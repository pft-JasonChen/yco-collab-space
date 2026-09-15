/**
 * Aspect-ratio helpers for the justified gallery grid.
 *
 * The grid lays items out at a fixed base row height; each item's base width is
 * `rowHeight * (width / height)`. Items with unknown dimensions fall back to a
 * square (ratio 1) so they still render sensibly.
 */

const FALLBACK_RATIO = 1;

/**
 * @param {number} [width]
 * @param {number} [height]
 * @returns {number} width / height, or 1 when dimensions are missing / invalid
 */
export function getAspectRatio(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!w || !h || w <= 0 || h <= 0) return FALLBACK_RATIO;
  return w / h;
}

/**
 * @param {number} [width]
 * @param {number} [height]
 * @returns {string} a CSS `aspect-ratio` value, e.g. "16 / 9" (falls back to "1 / 1")
 */
export function toCssAspect(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!w || !h || w <= 0 || h <= 0) return '1 / 1';
  return `${w} / ${h}`;
}

/**
 * Snap a true ratio into one of three layout buckets (gallery spec) so the
 * justified grid reads as tidy rows; cells are `object-fit: cover`, so the media
 * crops center to fill the bucketed box:
 *   landscape → 4:3, portrait → 3:4, square → 1:1.
 *
 * Passed as GalleryGrid's `normalizeRatio` for video surfaces (the Videos tab,
 * and the video items of the mixed AI Agent feed). Images use the true ratio.
 *
 * @param {number} ratio  width / height
 * @returns {number} the bucketed ratio (4/3, 3/4, or 1)
 */
export function bucketRatio(ratio) {
  if (ratio > 1) return 4 / 3; // landscape → 4:3
  if (ratio < 1) return 3 / 4; // portrait → 3:4
  return 1; // square → 1:1
}

