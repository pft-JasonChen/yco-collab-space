import { useEffect, useState } from 'react';
import styles from './GalleryCell.module.scss';
import checkIconSrc from '../../../design-library/assets/icon/yco-home-gallery/images__icon_check_thumbnail_w.svg';

/**
 * Shared thumbnail cell for the gallery families. Presentational only — it fills
 * its parent (GalleryGrid sizes the wrapper), and shows a cover image, an
 * optional play icon plus bottom-left duration pill (video), a select checkbox
 * (edit mode), a bottom-right `actions` slot revealed on hover, and a free
 * `badge` slot.
 *
 * For video cells, hovering plays the clip (muted, looped) over the cover image
 * — the `<video>` only mounts while hovered, so idle cells stay cheap.
 *
 * @param {object} props
 * @param {number|string} props.aspectRatio  CSS aspect-ratio (e.g. 1.78 or "16 / 9")
 * @param {string} [props.thumbnail]
 * @param {string} [props.alt]           accessible name for the cover image
 * @param {boolean} [props.isVideo]
 * @param {string} [props.videoSrc]      playable url, enables hover autoplay (video only)
 * @param {string} [props.duration]      formatted "00:05" (video only)
 * @param {string} [props.playIconSrc]   static play-overlay asset (video only)
 * @param {boolean} [props.isEditing]    selection mode: shows the checkbox, hides actions
 * @param {boolean} [props.isSelected]
 * @param {'top-right'|'top-left'} [props.checkboxPosition]  RD ships top-right; top-left is the
 *        placement the competitive set uses and Cloud Storage asked for
 * @param {boolean} [props.checkboxOnHover]  also reveal the checkbox on hover/focus outside
 *        selection mode, so selecting is the first click rather than the second
 * @param {(event: React.MouseEvent) => void} [props.onToggleSelect]  fires from the checkbox only;
 *        without it the checkbox is decorative and the cell's own onClick still owns the toggle
 * @param {string} [props.selectLabel]   accessible name for the checkbox control
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.clickable]    pointer cursor on the cell (default true)
 * @param {React.ReactNode} [props.actions]  bottom-right hover actions
 * @param {React.ReactNode} [props.badge]    corner badge; brings its own position
 * @param {boolean} [props.loading]      shimmer placeholder instead of media + overlays
 * @param {boolean} [props.compact]      tighter corner radius for narrow layouts
 * @param {string} [props.domId]         stable DOM id, for scroll restoration
 * @param {string} [props.className]
 */
export default function GalleryCell({
  aspectRatio,
  thumbnail,
  alt = '',
  isVideo = false,
  videoSrc,
  duration,
  playIconSrc,
  isEditing = false,
  isSelected = false,
  checkboxPosition = 'top-right',
  checkboxOnHover = false,
  onToggleSelect,
  selectLabel = 'Select',
  onClick,
  clickable = true,
  actions,
  badge,
  loading = false,
  compact = false,
  domId,
  className,
}) {
  const [hovered, setHovered] = useState(false);

  // Hover-play is a desktop affordance. On touch devices a tap inside the cell
  // (e.g. the always-visible More button) fires a synthetic mouseenter, which
  // would start playback in the grid — playback belongs on real hover (desktop)
  // or inside the detail view (mobile). Detected after mount so a server render
  // never emits an autoplay video.
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);
  const canHoverPlay = isVideo && !!videoSrc && !isEditing && canHover;

  // A dead thumbnail must not shimmer forever: once the image errors the
  // skeleton is dropped and the empty media box is shown instead.
  const [thumbnailErrored, setThumbnailErrored] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const cellClass = [
    styles.cell,
    clickable ? styles.cellClickable : null,
    compact ? styles.cellCompact : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Skeleton: keep the box (sized by aspectRatio) so the grid layout is stable,
  // shimmer inside the rounded media frame, no media or overlays until revealed.
  if (loading) {
    return (
      <div className={cellClass} style={{ aspectRatio }} data-component-role="gallery-cell" data-state="loading">
        <div className={styles.mediaBox}>
          <div className={`${styles.media} ${styles.shimmer}`} />
        </div>
      </div>
    );
  }

  const showSkeleton = Boolean(thumbnail) && !thumbnailLoaded && !thumbnailErrored;

  return (
    <div
      id={domId}
      className={cellClass}
      style={{ aspectRatio }}
      onClick={onClick}
      onMouseEnter={() => canHoverPlay && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-component-role="gallery-cell"
      data-state={isEditing ? 'editing' : 'default'}
      data-selected={isEditing || checkboxOnHover ? String(isSelected) : undefined}
      data-checkbox={checkboxPosition}
      data-checkbox-on-hover={checkboxOnHover ? 'true' : undefined}
    >
      {/* rounded/clipped media lives in its own box so cell-level overlays
          (e.g. an open More menu) can overflow the cell without being clipped */}
      <div className={styles.mediaBox}>
        {isVideo && !thumbnail && videoSrc ? (
          // Video result with no separate poster: the clip's own first frame is
          // the cover, so only metadata is preloaded.
          <video className={styles.media} src={videoSrc} muted preload="metadata" playsInline />
        ) : (
          thumbnail && (
            <img
              className={styles.media}
              src={thumbnail}
              alt={alt}
              loading="lazy"
              onLoad={() => setThumbnailLoaded(true)}
              onError={() => setThumbnailErrored(true)}
            />
          )
        )}
        {showSkeleton && <div className={`${styles.media} ${styles.shimmer} ${styles.mediaOverlay}`} />}
        {canHoverPlay && hovered && (
          <video className={styles.video} src={videoSrc} muted loop autoPlay playsInline />
        )}
      </div>
      {isVideo && !hovered && playIconSrc && (
        <img className={styles.playIcon} src={playIconSrc} alt="" />
      )}
      {isVideo && duration && <span className={styles.duration}>{duration}</span>}
      {/* RD renders the checkbox only in selection mode, as a decorative span the
          cell's own onClick toggles. Both stay the default. With
          `checkboxOnHover` the box is also revealed on hover or keyboard focus,
          and with `onToggleSelect` it becomes a real control — so the first
          click can select without a separate mode switch first. */}
      {(isEditing || checkboxOnHover) &&
        (onToggleSelect ? (
          <button
            type="button"
            className={`${styles.checkbox} ${isSelected ? styles.checkboxSelected : ''}`}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={selectLabel}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect(event);
            }}
          >
            {isSelected && <img className={styles.checkIcon} src={checkIconSrc} alt="" />}
          </button>
        ) : (
          <span className={`${styles.checkbox} ${isSelected ? styles.checkboxSelected : ''}`}>
            {isSelected && <img className={styles.checkIcon} src={checkIconSrc} alt="" />}
          </span>
        ))}
      {!isEditing && actions && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
      {/* optional corner badge — brings its own position */}
      {badge}
    </div>
  );
}
