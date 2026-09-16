import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './GalleryGrid.module.scss';
import { getAspectRatio } from './aspectRatio.js';
import useMediaRatios from './useMediaRatios.js';

// Desktop justified rows (designer spec: row height ∈ [200, 240]). Each item's
// width = ROW_HEIGHT * ratio and flex-grow = that width, so a row stretches UP
// from the 200 base to fill the container — Fotor's exact mechanism (item width
// = flex-grow = round(ratio * 200)). To make 240 a HARD ceiling, each item's
// width is also capped at MAX_ROW_HEIGHT * ratio: flex-grow stops there, so a
// row can never exceed 240 tall (it leaves a little trailing space instead, only
// on rows that would otherwise balloon). The 200 base floors it; the last
// (incomplete) row stays at base via .afterSeat.
const ROW_HEIGHT = 200;
const MAX_ROW_HEIGHT = 240;

// RD's $width-md. At or below this the grid switches to the 2-column masonry.
const MASONRY_MAX_WIDTH = 768;

/**
 * Justified flexbox grid shared by the gallery media families (Photos / Videos /
 * AI Image Generator, and Cloud Storage's Projects / Images / Videos / Uploads).
 * Purely presentational — the caller supplies the items, how to key them, and
 * how to render each cell.
 *
 * Aspect ratio comes from the media's true dimensions: when `getMedia` is given
 * it returns `{ src, type }` and the grid measures the real ratio off-DOM (an
 * image's naturalWidth, a video's videoWidth — a video's poster ratio can
 * differ, so the clip itself is measured). Until measured it falls back to
 * `getRatio` (metadata), then to 1 (square). The resolved numeric ratio is
 * passed to `renderCell` so the cell can set a matching `aspect-ratio`.
 *
 * Layout is responsive against the grid's OWN width, not the window's: desktop
 * uses justified rows at a fixed base row height; at or below 768px there is no
 * row-height constraint and cells are laid out in a 2-column masonry (each cell
 * fills its column, height follows its ratio). Pass `layout` to force either
 * mode — a story or a fixed-width preview needs that, since the component is
 * measuring a wrapper rather than the viewport.
 *
 * @param {object} props
 * @param {object[]} props.items
 * @param {(item: object, index: number) => React.Key} props.getKey
 * @param {(item: object) => number} [props.getRatio] width/height fallback; defaults to item.width/item.height
 * @param {(item: object) => ({src: string, type: 'image'|'video'}|null)} [props.getMedia] media to measure the true ratio from
 * @param {(item: object, index: number, ratio: number, loading: boolean) => React.ReactNode} props.renderCell
 *   `loading` is true while the item's `getMedia` source is still being measured
 *   (true ratio not yet resolved) — the cell shows a shimmer at the placeholder
 *   box until then, so an image is never flashed squished into the fallback
 *   square before snapping to its real ratio. Surfaced only when `getMedia` is
 *   given; callers that measure themselves pass their own loading.
 * @param {number} [props.rowHeight=200]
 * @param {(ratio: number, item: object) => number} [props.normalizeRatio] maps
 *   the resolved ratio before layout. Video surfaces bucket every clip into
 *   4:3 / 1:1 / 3:4 (shared `bucketRatio`, cropped center); image surfaces omit
 *   it and show the true ratio uncropped. A mixed feed buckets only its videos
 *   via `item`. Applied to both the row flex sizing and the cell's aspect-ratio.
 * @param {'auto'|'justified'|'masonry'} [props.layout='auto']
 * @param {(src: string) => void} [props.onErroredSrc]
 * @param {string} [props.className]
 */
export default function GalleryGrid({
  items,
  getKey,
  getRatio,
  getMedia,
  renderCell,
  rowHeight = ROW_HEIGHT,
  normalizeRatio,
  layout = 'auto',
  onErroredSrc,
  className,
}) {
  // Measure this component's own box rather than the viewport. A window-width
  // hook reads the real browser viewport and ignores a narrow wrapper entirely,
  // so a fixed-width story or an embedded preview could never show the masonry —
  // the same reason navigation-header and credit-controls use container queries
  // here instead of @media. The masonry needs greedy column packing in JS, so a
  // pure CSS container query cannot express it; a ResizeObserver is the CSS
  // container query's JS equivalent.
  const [narrow, setNarrow] = useState(false);
  const observerRef = useRef(null);

  const measureRef = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect?.width ?? 0;
      if (width > 0) setNarrow(width <= MASONRY_MAX_WIDTH);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const entries = useMemo(
    () => (getMedia ? (items || []).map(getMedia).filter((m) => m && m.src) : []),
    [items, getMedia],
  );
  const { ratios: measured, settled } = useMediaRatios(entries);

  // A src that settled WITHOUT a ratio failed to load (e.g. a url whose object
  // is gone returns an XML error the browser refuses to decode as an image →
  // ORB block). Report it so a caller can drop the cell instead of showing a
  // permanently-broken thumbnail.
  useEffect(() => {
    if (!onErroredSrc) return;
    Object.keys(settled).forEach((src) => {
      if (!measured[src]) onErroredSrc(src);
    });
  }, [settled, measured, onErroredSrc]);

  if (!items || items.length === 0) return null;

  const metadataRatioOf =
    getRatio || ((item) => getAspectRatio(item.width, item.height));

  const ratioOf = (item) => {
    const media = getMedia?.(item);
    const real = media?.src ? measured[media.src] : null;
    const ratio = real || metadataRatioOf(item) || 1;
    return normalizeRatio ? normalizeRatio(ratio, item) : ratio;
  };

  // True while the item's measurable media hasn't resolved its real ratio yet,
  // so the cell can hold a shimmer at the placeholder box instead of revealing
  // the media at the fallback square (the "fake uniform row" before measuring).
  const loadingOf = (item) => {
    const media = getMedia?.(item);
    return Boolean(media?.src) && !settled[media.src];
  };

  const useMasonry = layout === 'masonry' || (layout === 'auto' && narrow);

  // 2-column masonry — each cell fills its column, height follows its ratio (no
  // fixed row height). Built as two explicit flex columns rather than CSS
  // `column-count`: iOS Safari fails to resolve an aspect-ratio box's height
  // inside a multicol fragmentation context, so cells there collapse shorter (a
  // visibly stunted second column). A normal flex column flow has no such bug.
  // Items are packed greedily into the shorter column; height ∝ 1/ratio since
  // both columns are equal width.
  if (useMasonry) {
    const columns = [[], []];
    const heights = [0, 0];
    items.forEach((item, index) => {
      const ratio = ratioOf(item);
      const target = heights[0] <= heights[1] ? 0 : 1;
      columns[target].push({ item, index, ratio });
      heights[target] += 1 / (ratio || 1);
    });
    return (
      <div
        ref={measureRef}
        className={[styles.masonry, className].filter(Boolean).join(' ')}
        data-component-role="gallery-grid"
        data-layout="masonry"
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className={styles.masonryColumn}>
            {column.map(({ item, index, ratio }) => (
              <div key={getKey(item, index)}>
                {renderCell(item, index, ratio, loadingOf(item))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={measureRef}
      className={[styles.grid, className].filter(Boolean).join(' ')}
      data-component-role="gallery-grid"
      data-layout="justified"
    >
      {items.map((item, index) => {
        const ratio = ratioOf(item);
        const baseWidth = Math.round(rowHeight * ratio);
        const maxWidth = Math.round(MAX_ROW_HEIGHT * ratio);
        return (
          <div
            key={getKey(item, index)}
            style={{
              width: `${baseWidth}px`,
              maxWidth: `${maxWidth}px`,
              flexGrow: baseWidth,
            }}
          >
            {renderCell(item, index, ratio, loadingOf(item))}
          </div>
        );
      })}
      <div className={styles.afterSeat} />
    </div>
  );
}
