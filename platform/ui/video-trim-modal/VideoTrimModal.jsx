import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './VideoTrimModal.module.scss';
import VideoTimeline from '../video-timeline/index.js';
import Button, { buttonTones, buttonVariants } from '../button/index.js';
import { THUMBNAIL_HEIGHT, formatDuration, getThumbnailWidth, snapTrimRangeToDisplayedDuration } from './constants.js';
import useFrameThumbnails from './useFrameThumbnails.js';
import useVideoTrim from './useVideoTrim.js';

/** Reference (2026-09-15, requested live — "左邊的調好應該可以直接當右邊那組的
 * 元件，所以兩邊應該長一樣的"): this used to be its own from-scratch
 * filmstrip/handles/playhead implementation, kept as a verbatim port of RD's
 * own trim-timeline.js. It now renders the shared VideoTimeline component
 * directly instead of duplicating that geometry a second time — the two
 * consumers only differ in how they source frame images: VideoTimeline's
 * usual video-expansion caller passes static frameUrls/posterUrl, while this
 * one draws real decoded video frames onto per-slot <canvas> elements via
 * useFrameThumbnails (VideoTimeline's `renderFrame` escape hatch exists
 * specifically for this). Its own hint/duration meta row stays outside
 * VideoTimeline (labels.maxLength / trim-selection-duration below) since
 * VideoTimeline's own showLeftLabel/showRightLabel format minutes without a
 * leading zero ("0:30"), while a pre-existing check here asserts the
 * two-digit "00:30" — keeping this row local avoids relitigating that
 * format. What's genuinely shared now: the track, dimmed overlay, trim-range
 * box, draggable handles (with the same maximum-window clamp math), and the
 * playhead — one implementation instead of two. */
function TrimTimeline({
  videoFile,
  fallbackThumbnailUrl,
  duration,
  currentTime,
  onSeek,
  trimRange,
  setTrimRange,
  minimumSeconds,
  maximumSeconds,
  isPlaying,
  onTogglePlay,
  onReadyChange,
  maxLengthLabel,
  labels,
}) {
  const [framesAreaWidth, setFramesAreaWidth] = useState(0);
  const thumbnailWidth = getThumbnailWidth(framesAreaWidth);
  const { canvasRefs, isReady } = useFrameThumbnails(videoFile, duration, thumbnailWidth, THUMBNAIL_HEIGHT);
  useEffect(() => onReadyChange(isReady), [isReady, onReadyChange]);
  const selectedSeconds = trimRange.end - trimRange.start;
  // Reference (2026-09-15, asked live — "但有一種是沒有時間限制的trimer這時候
  // hint要變成00:00"): a consumer opts out of a maximum entirely by passing a
  // non-finite/non-positive maximumSeconds (e.g. Infinity) — same guard
  // VideoTimeline's own (now-removed) drag clamp used to gate on. Without a
  // real maximum there's nothing for the selection to exceed, so tooLong is
  // forced false rather than naively comparing against Infinity/0/NaN, and
  // the left slot falls back to a plain elapsed-time-in-selection reading
  // (starting at "00:00") instead of the maxLength hint — mirroring
  // VideoTimeline's own no-hintText fallback (formatTimelineTime), just in
  // this component's own two-digit format for consistency with
  // trim-selection-duration alongside it.
  const hasMaximum = Number.isFinite(maximumSeconds) && maximumSeconds > 0;
  const tooLong = hasMaximum && Math.floor(selectedSeconds) > maximumSeconds;
  const handleTrimStartChange = useCallback(
    (start) => setTrimRange((current) => ({ ...current, start })),
    [setTrimRange],
  );
  const handleTrimEndChange = useCallback(
    (end) => setTrimRange((current) => ({ ...current, end })),
    [setTrimRange],
  );

  return (
    <section className={styles.timelineSection} data-surface-zone="trim-timeline" data-component-role="trim-control">
      <div className={styles.timelineMeta}>
        <span className={tooLong ? styles.errorLabel : undefined}>
          {hasMaximum ? maxLengthLabel : formatDuration(Math.max(0, currentTime - trimRange.start))}
        </span>
        <strong data-testid="trim-selection-duration">{formatDuration(selectedSeconds)}</strong>
      </div>
      {/* Distinct testid props below from VideoTimeline's own "canvas-*"
          defaults (2026-09-15): video-expansion keeps its persistent canvas
          timeline mounted while this dialog is open, so reusing those ids
          here would give getByTestId two matches and fail strict mode. */}
      <VideoTimeline
        labels={{ trimStart: labels.trimStart, trimEnd: labels.trimEnd, position: labels.playhead }}
        duration={duration}
        currentTime={currentTime}
        startTime={trimRange.start}
        endTime={trimRange.end}
        isPlaying={isPlaying}
        onSeek={onSeek}
        onPlay={onTogglePlay}
        onPause={onTogglePlay}
        onTrimStartChange={handleTrimStartChange}
        onTrimEndChange={handleTrimEndChange}
        minimumSeconds={minimumSeconds}
        showKeyframe={false}
        onFrameAreaResize={setFramesAreaWidth}
        playbackTimelineTestId="trim-playback-timeline"
        playbackToggleTestId="trim-playback-toggle"
        trimHandleStartTestId="trim-handle-start"
        trimHandleEndTestId="trim-handle-end"
        renderFrame={(index) => (
          videoFile ? (
            <canvas key={index} width={thumbnailWidth} height={THUMBNAIL_HEIGHT} ref={(element) => { canvasRefs.current[index] = element; }} />
          ) : (
            <img key={index} src={fallbackThumbnailUrl} alt="" draggable={false} />
          )
        )}
      />
    </section>
  );
}

function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  title: 'Trim video',
  cancel: 'Cancel',
  confirm: 'Use Video',
  maxLength: 'Select up to the maximum length',
  close: 'Close trim dialog',
  trimStart: 'Trim start',
  trimEnd: 'Trim end',
  playhead: 'Video playhead',
  play: 'Play video',
  pause: 'Pause video',
  mute: 'Mute video',
  unmute: 'Unmute video',
};

export default function VideoTrimModal({
  labels: labelOverrides = {},
  opened,
  videoFile = null,
  videoUrl = null,
  fallbackThumbnailUrl = null,
  onCancel,
  onConfirm,
  maximumSeconds = 60,
  minimumSeconds = 5,
  durationOverride = null,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const objectUrl = useObjectUrl(videoFile);
  const activeUrl = objectUrl || videoUrl;
  const {
    videoRef,
    duration,
    isPlaying,
    isMuted,
    currentTime,
    setCurrentTime,
    trimRange,
    setTrimRange,
    aspectRatio,
    handleLoadedMetadata,
    togglePlay,
    toggleMute,
    stop,
    snapshot,
  } = useVideoTrim(activeUrl, maximumSeconds, durationOverride);
  const [thumbnailsReady, setThumbnailsReady] = useState(!videoFile);
  const bodyRef = useRef(null);
  const [footerElevated, setFooterElevated] = useState(false);
  // Reference (2026-09-15, requested live — "在做modal的時候，如果下面有CTA我
  // 都會讓他 fix at the bottom...等他滑到最底就沒有modal footer的陰影",
  // matching the Auto-Edit modal convention at jb5SgyshmuPse0L7IFm0QO nodes
  // 14602:212396/14630:282653 (not scrolled — footer floats over content with
  // a shadow) vs 14774:349549/14777:355223 (scrolled to the end — no separate
  // floating footer/shadow, the CTA just sits at the true end of the
  // content). Cancel/Use Video now live in a fixed footer outside the
  // scrollable .body (see JSX below) rather than scrolling away with the
  // preview/timeline; the footer's shadow (.actionsElevated) is toggled based
  // on whether .body has more content below the fold, not shown
  // unconditionally.
  const updateFooterElevation = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setFooterElevated(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);
  useEffect(() => {
    updateFooterElevation();
  }, [updateFooterElevation, opened, duration, thumbnailsReady]);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(updateFooterElevation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateFooterElevation]);
  // Same "no real maximum" guard as TrimTimeline's own hasMaximum (see its
  // comment) — gates the confirm-button disable here too, not just the hint
  // color, so a maximumSeconds={Infinity} caller never gets silently blocked
  // by a naive `X > Infinity` comparison happening to still read as false
  // only by coincidence of the value chosen.
  const hasMaximum = Number.isFinite(maximumSeconds) && maximumSeconds > 0;
  const tooLong = hasMaximum && Math.floor(trimRange.end - trimRange.start) > maximumSeconds;
  const tooShort = trimRange.end - trimRange.start < minimumSeconds;

  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  }, [setCurrentTime, videoRef]);

  useEffect(() => {
    if (!opened) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        stop();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [opened, onCancel, stop]);

  if (!opened || !activeUrl) return null;
  const handleCancel = () => {
    stop();
    onCancel?.();
  };
  const handleConfirm = () => {
    if (tooLong || tooShort || !thumbnailsReady) return;
    stop();
    onConfirm?.(snapTrimRangeToDisplayedDuration(trimRange), snapshot());
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleCancel}>
      <section
        className={styles.modal}
        data-testid="video-trim-dialog"
        data-component-role="video-trim-dialog trim-control"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-video-trim-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={styles.closeButton} type="button" onClick={handleCancel} aria-label={labels.close}><span aria-hidden="true"></span></button>
        <div className={styles.content}>
          <h2 id="platform-video-trim-title" className={styles.title}>{labels.title}</h2>
          <div className={styles.body} ref={bodyRef} onScroll={updateFooterElevation}>
            <div className={styles.preview} style={{ aspectRatio }}>
              <video ref={videoRef} src={activeUrl} preload="auto" playsInline muted={isMuted} onLoadedMetadata={handleLoadedMetadata} />
              <button className={styles.previewPlay} type="button" onClick={togglePlay} aria-label={isPlaying ? labels.pause : labels.play}><span aria-hidden="true">{isPlaying ? '\ue97b' : '\ue97f'}</span></button>
              <button className={styles.muteButton} type="button" onClick={toggleMute} aria-label={isMuted ? labels.unmute : labels.mute}><span aria-hidden="true">{isMuted ? '\ue926' : '\ue924'}</span></button>
            </div>
            <TrimTimeline
              videoFile={videoFile}
              fallbackThumbnailUrl={fallbackThumbnailUrl}
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeek}
              trimRange={trimRange}
              setTrimRange={setTrimRange}
              minimumSeconds={minimumSeconds}
              maximumSeconds={maximumSeconds}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onReadyChange={setThumbnailsReady}
              labels={labels}
              maxLengthLabel={labels.maxLength}
            />
          </div>
          <div className={`${styles.actions} ${footerElevated ? styles.actionsElevated : ''}`}>
            {/* Reference (2026-09-15, corrected live — "disable的buttons你不
                應該自己亂做，你應該用我們做好的"): these were plain <button>
                elements with their own local .actions button/:disabled CSS —
                a second, hand-rolled disabled-state implementation alongside
                the shared platform/ui/button Button component's own (Figma
                Fill/Disabled, one flat grey shared by every tone/variant).
                Now render the shared Button directly instead of duplicating
                that state. Reference (2026-09-15, requested live — "在做modal
                的時候，如果下面有CTA我都會讓他 fix at the bottom...等他滑到
                最底就沒有modal footer的陰影"): this row is now a sibling of
                .body (the scrollable area above it), not one of its children
                — a fixed footer rather than something that scrolls away with
                the preview/timeline. Its shadow (.actionsElevated) only
                applies while .body has more content below the fold; see
                updateFooterElevation above. */}
            <Button data-testid="trim-cancel" variant={buttonVariants.SECONDARY} tone={buttonTones.NEUTRAL} onClick={handleCancel}>{labels.cancel}</Button>
            <Button data-testid="trim-use-video" variant={buttonVariants.PRIMARY} tone={buttonTones.BRAND} onClick={handleConfirm} disabled={tooLong || tooShort || !thumbnailsReady}>{labels.confirm}</Button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
