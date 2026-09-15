import { useCallback, useEffect, useRef } from 'react';
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
  /** Escape hatch (2026-09-15, reused for VideoTrimModal — "左邊的調好應該可以
   * 直接當右邊那組的元件，所以兩邊應該長一樣的"): VideoTrimModal draws real
   * decoded video frames onto a per-slot <canvas> via its own
   * useFrameThumbnails hook, which frameUrls/posterUrl (static <img> sources)
   * can't express. When given, called once per slot index
   * (0..THUMBNAIL_COUNT-1) and its return value replaces the default
   * frameUrls/posterUrl <img> for that slot; frameUrls/posterUrl are ignored
   * for slots it covers. */
  renderFrame,
  /** Paired with renderFrame: fires with the frames row's own rendered pixel
   * width whenever it changes, so a renderFrame consumer that needs to size
   * per-slot content (e.g. canvas width/height, to avoid a blurry stretched
   * bitmap) doesn't need a second ResizeObserver on a second ref duplicating
   * this component's own internal geometry. */
  onFrameAreaResize,
  /** Distinguishes this instance's data-testid values from another
   * VideoTimeline mounted at the same time (2026-09-15): the real feature
   * page keeps its own persistent canvas timeline mounted while
   * VideoTrimModal's timeline (the same shared component) is also open,
   * so a bare getByTestId('canvas-trim-handle-start') resolves to both and
   * fails strict mode. Defaults preserve the original single-consumer
   * names; VideoTrimModal overrides all four to its own dialog-scoped ids. */
  playbackTimelineTestId = 'canvas-playback-timeline',
  playbackToggleTestId = 'canvas-playback-toggle',
  trimHandleStartTestId = 'canvas-trim-handle-start',
  trimHandleEndTestId = 'canvas-trim-handle-end',
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
  const framesRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const element = framesRef.current;
    if (!element || !onFrameAreaResize) return undefined;
    const observer = new ResizeObserver(([entry]) => onFrameAreaResize(entry?.contentRect.width || 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, [onFrameAreaResize]);

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
      // Reference (2026-09-15, corrected live — "handler應該要讓user隨意拉動，
      // 而不是根據時間限制鎖死，如果影片是有限制時長的話，user調整範圍若超出
      // hint就會變成紅色的字"): a handle is bounded only by the OTHER handle's
      // position (via minimumSeconds, so the segment can't collapse to nothing)
      // and the track's own [0, trackDuration] extent — never by maximumSeconds.
      // This matches RD's own baseline drag math exactly (use-trim-drag.js:
      // left clamps to [0, end-MIN_TRIM_SECONDS], right clamps to
      // [start+MIN_TRIM_SECONDS, duration] — neither references a maximum at
      // all). A maximum length is communicated by the consumer's own hint text
      // turning to an error color once the selection exceeds it (VideoTrimModal's
      // own tooLong/errorLabel, matching RD's isTrimRangeTooLong), and by
      // disabling confirm — never by making the handle itself un-draggable.
      if (side === 'start') {
        const max = safeEnd - minimumSeconds;
        onTrimStartChange?.(clamp(seconds, 0, Math.max(0, max)));
      } else {
        const min = startTime + minimumSeconds;
        onTrimEndChange?.(clamp(seconds, Math.min(min, trackDuration), trackDuration));
      }
    };
    const onUp = (upEvent) => stopDrag(upEvent);

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    dragRef.current = { target, onMove, onUp };
  }, [minimumSeconds, onTrimEndChange, onTrimStartChange, safeEnd, startTime, stopDrag, trackDuration]);

  return (
    <div
      className={`${styles.timeline} ${className}`}
      data-testid={playbackTimelineTestId}
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
          data-testid={playbackToggleTestId}
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isPlaying ? !onPause : !onPlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {/* Reference (2026-09-15, tried live — "1和2的icon有點問題，3我不確定，
              但是都改成icon font看看", where "3" is this button): swapped from
              the play.svg/pause.svg asset pair to the shared YcoInterfaceIcons
              icon font (icon-ic-pause-bold = U+E97B, icon-ic-play-f = U+E97F),
              matching the ResultPageShell/ToolFamilyMenu glyph convention
              (embed the PUA character directly via a JS unicode escape,
              styled through a local @font-face + glyph class) rather than a
              design-library SVG asset. Tentative — flagged by the user as
              unconfirmed for this specific button. */}
          <span className={styles.playGlyph} aria-hidden="true">{isPlaying ? '' : ''}</span>
        </button>
        <div className={styles.track} ref={trackRef}>
        <div className={styles.frames} ref={framesRef} aria-hidden="true">
          {Array.from({ length: THUMBNAIL_COUNT }, (_, index) => {
            if (renderFrame) return renderFrame(index);
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
                data-testid={trimHandleStartTestId}
                onPointerDown={startHandleDrag('start')}
                disabled={!onTrimStartChange}
                aria-label={labels.trimStart}
              >
                <img src={dragHandleIcon} alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.handle} ${styles.handleRight}`}
                data-testid={trimHandleEndTestId}
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
