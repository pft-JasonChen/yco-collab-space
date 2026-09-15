import { useCallback, useRef } from 'react';
import pauseIcon from '../../../design-library/assets/icon/yco-video-timeline/pause.svg';
import playIcon from '../../../design-library/assets/icon/yco-video-timeline/play.svg';
import dragHandleIcon from '../../../design-library/assets/icon/yco-video-timeline/drag-handle.svg';
import keyframeIcon from '../../../design-library/assets/icon/yco-video-timeline/keyframe.svg';
import styles from './VideoTimeline.module.scss';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatTimelineTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

/** Figma's own filmstrip is always exactly 10 thumbnails (node 14893:252737
 * and 7460:183805 both show 10) — not something that varies per consumer, so
 * this isn't a prop (2026-09-14, requested — "這固定式10不用設定"). */
const THUMBNAIL_COUNT = 10;

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  position: 'Video playback position',
  trimStart: 'Trim start',
  trimEnd: 'Trim end',
};

export default function VideoTimeline({
  labels: labelOverrides = {},
  posterUrl,
  frameUrls = [],
  duration = 0,
  currentTime = 0,
  startTime = 0,
  endTime,
  isPlaying = false,
  onSeek,
  onPlay,
  onPause,
  /** Fires with the next start-time value while the left handle is dragged.
   * Only meaningful when showTrimHandles is true. */
  onTrimStartChange,
  /** Fires with the next end-time value while the right handle is dragged.
   * Only meaningful when showTrimHandles is true. */
  onTrimEndChange,
  minimumSeconds = 0,
  maximumSeconds,
  frameStrategy,
  /** Figma's own "Show Keyframe" component property (node 7460:183805, file
   * jb5SgyshmuPse0L7IFm0QO) — corrected (2026-09-14, reported live): this is
   * NOT a filmstrip visibility toggle (an earlier pass misread it as one).
   * It's a single diamond marker centered over the filmstrip, used on the
   * video object-removal flow to flag that an edit exists at this point in
   * the clip. The filmstrip itself always renders; this only adds/removes
   * the marker. Default true, matching Figma. */
  showKeyframe = true,
  /** Figma's own "Show trim-range" component property (same node): toggles
   * the draggable left/right trim handles, the selected-range outline, and
   * the dimmed overlay on the excluded portions. Reference (2026-09-14):
   * this is the actual production trim UI, not a decorative track — dragging
   * a handle calls onTrimStartChange/onTrimEndChange. Default true, matching
   * Figma and this component's one real consumer (video-expansion's canvas
   * timeline already passes startTime/endTime as a live trim window). */
  showTrimHandles = true,
  /** Reference (2026-09-14, jb5SgyshmuPse0L7IFm0QO node 14893:252737),
   * requested — "我希望你可以把1和2跟在Video Timeline這個元件，只是分別做
   * 布林": the label row above the track is part of this component now
   * (was briefly externalized to consumers, then moved back in), as two
   * independently toggleable slots rather than one all-or-nothing row.
   * Left slot: hintText when set (e.g. "Select 5-30 seconds") in
   * --text-strong: Figma's own two reference frames show the left slot
   * changing color depending on whether it holds a hint or a time value —
   * "有時候他們是時間，有時候他們是hint 文字顏色也會因此不同". Falls back to
   * the elapsed-within-selection time in --text-weaker when no hintText is
   * given, matching Figma's plain "00:00" example. */
  showLeftLabel = false,
  hintText = null,
  /** Right slot: the selected range's total duration, --text-weaker
   * (Figma's right slot is always a time value, never a hint). */
  showRightLabel = false,
  className = '',
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const selectionEnd = Number.isFinite(endTime) ? endTime : duration;
  const safeEnd = Math.max(startTime, selectionEnd);
  const value = clamp(currentTime, startTime, safeEnd);
  const selectedDuration = Math.max(0, safeEnd - startTime);
  const hasCapturedFrames = frameUrls.length > 0;

  // Reference (2026-09-14, jb5SgyshmuPse0L7IFm0QO node 14893:252737): the
  // filmstrip spans the FULL clip, with the selected [startTime, safeEnd]
  // window drawn as an overlay on top of it — not a filmstrip of only the
  // selected window, which is what this component rendered before. Every
  // percentage below is against `duration`, not `selectedDuration`.
  const trackDuration = duration > 0 ? duration : safeEnd;
  const toPercent = (seconds) => (trackDuration > 0 ? clamp((seconds / trackDuration) * 100, 0, 100) : 0);
  const startPercent = toPercent(startTime);
  const endPercent = toPercent(safeEnd);
  const rawPlayheadPercent = toPercent(value);
  // Reference (2026-09-14, reported live — "Playhead 應該是介於兩者之間，不會
  // 重疊在handler上面" → "playhead頂多只能到這裡而已，就要被卡住" → "沒有卡住，
  // 超過去一半了"): the first fix used a PERCENT margin (relative to the
  // track's own width via `left:X%`), but the handle's own footprint is a
  // FIXED 16px regardless of how wide the track renders — on a wide track a
  // percent margin converts to more pixels than a narrow one, and here it
  // converted to fewer pixels than the handle's own width, so the "clamped"
  // position still landed inside the handle. Clamping now happens in CSS
  // itself via `clamp()`, mixing the boundary's percentage with a literal
  // 15px (just past the handle's own -1.5px-inset 16px box) — correct
  // regardless of the track's actual rendered width. See the `left` style
  // below; `playheadPercent` here is only the un-clamped, raw value used
  // when handles aren't shown at all. */
  const playheadPercent = rawPlayheadPercent;
  // Corrected (2026-09-14, along with the handle/trim-range geometry fix
  // above): now that .trimRange itself extends 16px past the true boundary
  // on each side and the handle sits flush at ITS edge, the handle's own
  // footprint [startPercent-16px, startPercent] no longer overlaps the
  // [startPercent, endPercent] range at all — playheadPercent (always inside
  // that range, since `value` is already clamped to [startTime, safeEnd])
  // can't land inside the handle's box anymore regardless of margin size.
  // Only a few px of clearance are kept, matching the playhead's own ~3px
  // half-width (it's centered on its `left` position via
  // translateX(-50%)) — enough to avoid the two visually touching at the
  // exact extremes, not a margin doing the actual separation work anymore.
  const playheadHandleClearance = '5px';

  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const stopDrag = useCallback((handlerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const { target, onMove, onUp } = drag;
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
    if (handlerEvent?.pointerId !== undefined && target.hasPointerCapture?.(handlerEvent.pointerId)) {
      target.releasePointerCapture(handlerEvent.pointerId);
    }
  }, []);

  const startHandleDrag = useCallback((side) => (event) => {
    if (!onTrimStartChange && !onTrimEndChange) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !trackDuration) return;
    const pxPerSecond = rect.width / trackDuration;

    const onMove = (moveEvent) => {
      const seconds = clamp((moveEvent.clientX - rect.left) / pxPerSecond, 0, trackDuration);
      const window = Number.isFinite(maximumSeconds) && maximumSeconds > 0 ? maximumSeconds : Infinity;
      if (side === 'start') {
        const min = Math.max(0, safeEnd - window);
        const max = safeEnd - minimumSeconds;
        onTrimStartChange?.(clamp(seconds, min, Math.max(min, max)));
      } else {
        const min = startTime + minimumSeconds;
        const max = Math.min(trackDuration, startTime + window);
        onTrimEndChange?.(clamp(seconds, Math.min(min, max), max));
      }
    };
    const onUp = (upEvent) => stopDrag(upEvent);

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    dragRef.current = { target, onMove, onUp };
  }, [maximumSeconds, minimumSeconds, onTrimEndChange, onTrimStartChange, safeEnd, startTime, stopDrag, trackDuration]);

  return (
    <div
      className={`${styles.timeline} ${className}`}
      data-testid="canvas-playback-timeline"
      data-placement="below-canvas"
      data-frame-source={hasCapturedFrames ? 'captured-video' : posterUrl ? 'poster' : 'pending'}
      data-frame-count={frameUrls.length}
      data-frame-strategy={frameStrategy}
      data-component-role="video-playback-timeline"
      data-surface-zone="canvas-playback-timeline"
    >
      {showLeftLabel || showRightLabel ? (
        <div className={styles.labelRow} aria-hidden="true">
          {showLeftLabel ? (
            <span className={hintText ? styles.hint : styles.timeValue}>
              {hintText || formatTimelineTime(value - startTime)}
            </span>
          ) : <span />}
          {showRightLabel ? <span className={styles.timeValue}>{formatTimelineTime(selectedDuration)}</span> : <span />}
        </div>
      ) : null}
      <div className={styles.mainRow}>
        <button
          className={styles.playButton}
          data-testid="canvas-playback-toggle"
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isPlaying ? !onPause : !onPlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <img src={isPlaying ? pauseIcon : playIcon} alt="" aria-hidden="true" />
        </button>
        <div className={styles.track} ref={trackRef}>
        <div className={styles.frames} aria-hidden="true">
          {Array.from({ length: THUMBNAIL_COUNT }, (_, index) => {
            const frameUrl = frameUrls[index] || (!hasCapturedFrames ? posterUrl : undefined);
            return frameUrl ? <img key={index} src={frameUrl} alt="" draggable={false} /> : <span key={index} />;
          })}
        </div>
        {showKeyframe ? (
          <div className={styles.keyframeMarker} aria-hidden="true">
            <img src={keyframeIcon} alt="" />
          </div>
        ) : null}
        {showTrimHandles ? (
          <div className={styles.trimOverlay} aria-hidden={!onTrimStartChange && !onTrimEndChange}>
            <div className={styles.overlayDim} style={{ left: 0, width: `${startPercent}%` }} />
            <div className={styles.overlayDim} style={{ left: `${endPercent}%`, right: 0, width: 'auto' }} />
            <div
              className={styles.trimRange}
              style={{
                // Reference (2026-09-14, jb5SgyshmuPse0L7IFm0QO nodes
                // 14908:253051/11469:164246 — "你參考figma位置"): the bordered
                // trim-range box isn't just [startPercent, endPercent] — per
                // both reference frames' own node geometry, it extends by
                // exactly one handle-width (16px) past the true time boundary
                // on each side, with each handle occupying that extra 16px
                // (flush at 0/right:0 below) while its INNER edge lines up
                // with the true boundary — not straddling it, and not sized
                // by anything other than the handle's own natural width.
                left: `calc(${startPercent}% - 16px)`,
                width: `calc(${Math.max(0, endPercent - startPercent)}% + 32px)`,
              }}
            >
              <button
                type="button"
                className={`${styles.handle} ${styles.handleLeft}`}
                onPointerDown={startHandleDrag('start')}
                disabled={!onTrimStartChange}
                aria-label={labels.trimStart}
              >
                <img src={dragHandleIcon} alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.handle} ${styles.handleRight}`}
                onPointerDown={startHandleDrag('end')}
                disabled={!onTrimEndChange}
                aria-label={labels.trimEnd}
              >
                <img src={dragHandleIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
        <span
          className={styles.playhead}
          style={{
            left: showTrimHandles
              ? `clamp(calc(${startPercent}% + ${playheadHandleClearance}), ${playheadPercent}%, calc(${endPercent}% - ${playheadHandleClearance}))`
              : `${playheadPercent}%`,
          }}
          aria-hidden="true"
        />
        <input
          aria-label={labels.position}
          type="range"
          min={startTime}
          max={safeEnd || 0}
          step="0.05"
          value={value}
          onChange={(event) => onSeek?.(Number(event.target.value))}
        />
        </div>
      </div>
    </div>
  );
}
