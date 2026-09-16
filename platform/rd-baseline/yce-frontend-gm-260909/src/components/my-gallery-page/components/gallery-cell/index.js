import { useEffect, useState } from 'react';
import styles from './index.module.scss';
import ImageLazyLoad from '@/components/common/image-lazy-load';
import browserUtils from '@/utils/browserUtils';
import { posterFrameSrc } from '@/utils/videoUtils';
import { v4 as uuidv4 } from 'uuid';
import _get from 'lodash/get';

/**
 * Shared thumbnail cell for the My Gallery tabs. Presentational only — fills its
 * parent (the justified grid sizes the wrapper), shows a cover image, an
 * optional play icon + bottom-left duration pill (video), a select checkbox
 * (edit mode), and a top-right `actions` slot (hover-revealed Download / More).
 *
 * For video cells, hovering plays the clip (muted, looped) over the cover image
 * — the `<video>` only mounts while hovered, so idle cells stay cheap.
 *
 * @param {object} props
 * @param {number|string} props.aspectRatio  CSS aspect-ratio (e.g. 1.78 or "16 / 9")
 * @param {string} props.thumbnail
 * @param {boolean} [props.isVideo]
 * @param {string} [props.videoSrc]      playable url, enables hover autoplay (video only)
 * @param {string} [props.duration]      formatted "00:05" (video only)
 * @param {string} [props.playIconSrc]   static play-overlay asset (video only)
 * @param {boolean} [props.isEditing]
 * @param {boolean} [props.isSelected]
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.clickable]  show pointer cursor on the cell (default true)
 * @param {React.ReactNode} [props.actions]  top-right hover actions
 * @param {React.ReactNode} [props.badge]    corner badge (e.g. ModuleTypeIcon), self-positioned
 * @param {boolean} [props.loading]  show a shimmer placeholder (e.g. while the
 *   true aspect-ratio is still being measured) instead of the media + overlays
 */
export default function GalleryCell({
  aspectRatio,
  thumbnail,
  isVideo = false,
  videoSrc,
  duration,
  playIconSrc,
  isEditing = false,
  isSelected = false,
  onClick,
  clickable = true,
  actions,
  badge,
  loading = false,
  item = null,
}) {
  const [hovered, setHovered] = useState(false);
  // Hover-play is a desktop affordance. On touch devices a tap inside the cell
  // (e.g. the always-visible More button) fires a synthetic mouseenter, which
  // would start playback in the grid — the spec wants playback only on real
  // hover (desktop) or inside the video info page (mobile). Detect after mount
  // so SSG renders no autoplay video. (ebug:YCO260615P0021)
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    setCanHover(browserUtils.canHover());
  }, []);
  const canHoverPlay = isVideo && !!videoSrc && !isEditing && canHover;

  // ImageLazyLoad only clears its skeleton on error when onError is passed;
  // without it a dead thumbnail shimmers forever (YCO260626P0008).
  const [thumbnailErrored, setThumbnailErrored] = useState(false);

  // Skeleton: keep the box (sized by aspectRatio) so the grid layout is stable,
  // shimmer inside the rounded media frame, no media/overlays until revealed.
  if (loading) {
    return (
      <div className={styles.cell} style={{ aspectRatio }}>
        <div className={styles.mediaBox}>
          <div className={`${styles.media} shimmer-skeleton`} />
        </div>
      </div>
    );
  }

  const id = _get(item, 'id', uuidv4());
  const timestamp = _get(item, 'timestamp', 0);

  return (
    <div
      id={`${timestamp ?? `_${id}`}`}
      className={`${styles.cell}${clickable ? ` ${styles.cellClickable}` : ''}`}
      style={{ aspectRatio }}
      onClick={onClick}
      onMouseEnter={() => canHoverPlay && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* rounded/clipped media lives in its own box so cell-level overlays
          (e.g. the More dropdown) can overflow the cell without being clipped */}
      <div className={styles.mediaBox}>
        {isVideo && !thumbnail && videoSrc ? (
          // Video result with no separate poster (e.g. AI Agent): use the clip's
          // own first frame as the cover.
          <video
            className={styles.media}
            src={posterFrameSrc(videoSrc)}
            muted
            preload="metadata"
            playsInline
          />
        ) : (
          <ImageLazyLoad
            src={thumbnail}
            imageClass={styles.media}
            skeletonClass={styles.media}
            onlyOneImage={true}
            showLoadingSkeleton={!thumbnailErrored}
            onError={() => setThumbnailErrored(true)}
          />
        )}
        {canHoverPlay && hovered && (
          <video
            className={styles.video}
            src={videoSrc}
            muted
            loop
            autoPlay
            playsInline
          />
        )}
      </div>
      {isVideo && !hovered && playIconSrc && (
        <img className={styles.playIcon} src={playIconSrc} alt="" />
      )}
      {isVideo && duration && (
        <span className={styles.duration}>{duration}</span>
      )}
      {isEditing && (
        <span
          className={`${styles.checkbox} ${
            isSelected ? styles.checkboxSelected : ''
          }`}
        >
          {isSelected && (
            <img
              className={styles.checkIcon}
              src="/assets/images/icon_check_thumbnail_w.svg"
              alt=""
            />
          )}
        </span>
      )}
      {!isEditing && actions && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
      {/* optional corner badge (e.g. ModuleTypeIcon) — brings its own position */}
      {badge}
    </div>
  );
}
