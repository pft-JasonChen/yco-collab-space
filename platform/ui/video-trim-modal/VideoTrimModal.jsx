import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './VideoTrimModal.module.scss';
import {
  FRAME_COUNT,
  FRAME_INSET,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_HEIGHT_MOBILE,
  formatDuration,
  getPxPerSecond,
  getThumbnailWidth,
  snapRange,
} from './constants.js';
import useFrameThumbnails from './useFrameThumbnails.js';
import useTrimDrag from './useTrimDrag.js';
import useVideoTrim from './useVideoTrim.js';

function PlayIcon({ paused = false }) {
  return paused ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
  );
}

function MuteIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      {muted ? <path d="m16 9 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="2" /> : <path d="M16 8c2 2 2 6 0 8" fill="none" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}

function TrimTimeline({
  videoRef,
  videoFile,
  fallbackThumbnailUrl,
  duration,
  currentTime,
  setCurrentTime,
  trimRange,
  setTrimRange,
  minimumSeconds,
  maximumSeconds,
  isPlaying,
  onTogglePlay,
  stop,
  resume,
  onReadyChange,
  maxLengthLabel,
}) {
  const isCompact = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const thumbnailHeight = isCompact ? THUMBNAIL_HEIGHT_MOBILE : THUMBNAIL_HEIGHT;
  const { framesAreaRef, startDrag, startTrackSeek } = useTrimDrag({
    duration,
    minimumSeconds,
    maximumSeconds,
    trimRange,
    setTrimRange,
    setCurrentTime,
    videoRef,
    isPlaying,
    stop,
    resume,
  });
  const [framesAreaWidth, setFramesAreaWidth] = useState(0);
  useEffect(() => {
    const element = framesAreaRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setFramesAreaWidth(entry?.contentRect.width || 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, [framesAreaRef]);

  const thumbnailWidth = getThumbnailWidth(framesAreaWidth);
  const { canvasRefs, isReady } = useFrameThumbnails(videoFile, duration, thumbnailWidth, thumbnailHeight);
  useEffect(() => onReadyChange(isReady), [isReady, onReadyChange]);
  const pixelsPerSecond = getPxPerSecond(framesAreaWidth, duration);
  const leftWidth = trimRange.start * pixelsPerSecond;
  const rangeWidth = (trimRange.end - trimRange.start) * pixelsPerSecond;
  const playheadLeft = FRAME_INSET + currentTime * pixelsPerSecond;
  const selectedSeconds = trimRange.end - trimRange.start;
  const tooLong = Math.floor(selectedSeconds) > maximumSeconds;

  return (
    <section className={styles.timelineSection} data-surface-zone="trim-timeline" data-component-role="trim-control">
      <div className={styles.timelineMeta}>
        <span className={tooLong ? styles.errorLabel : undefined}>{maxLengthLabel}</span>
        <strong data-testid="trim-selection-duration">{formatDuration(selectedSeconds)}</strong>
      </div>
      <div className={styles.timelineRow}>
        <button className={styles.timelinePlay} type="button" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause video' : 'Play video'}>
          <PlayIcon paused={isPlaying} />
        </button>
        <div className={styles.framesArea} ref={framesAreaRef} onPointerDown={startTrackSeek}>
          <div className={styles.canvasRow}>
            {Array.from({ length: FRAME_COUNT }, (_, index) => (
              videoFile ? (
                <canvas key={index} width={thumbnailWidth} height={thumbnailHeight} ref={(element) => { canvasRefs.current[index] = element; }} />
              ) : (
                <img key={index} src={fallbackThumbnailUrl} alt="" aria-hidden="true" />
              )
            ))}
          </div>
          <div className={styles.rangeOverlay}>
            <span className={styles.darkRange} style={{ width: `${leftWidth}px` }} />
            <span className={styles.rangeBox} style={{ width: `${rangeWidth}px` }}>
              <button className={styles.handleLeft} data-testid="trim-handle-start" type="button" onPointerDown={startDrag('left')} aria-label="Trim start"><span /></button>
              <button className={styles.handleRight} data-testid="trim-handle-end" type="button" onPointerDown={startDrag('right')} aria-label="Trim end"><span /></button>
            </span>
            <span className={styles.darkRange} style={{ flex: 1 }} />
          </div>
          <button className={styles.playhead} type="button" style={{ transform: `translateX(${playheadLeft}px)` }} onPointerDown={startDrag('playhead')} aria-label="Video playhead"><span /></button>
        </div>
      </div>
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

export default function VideoTrimModal({
  opened,
  videoFile = null,
  videoUrl = null,
  fallbackThumbnailUrl = null,
  onCancel,
  onConfirm,
  maximumSeconds = 60,
  minimumSeconds = 5,
  durationOverride = null,
  labels = {},
}) {
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
    resume,
    snapshot,
  } = useVideoTrim(activeUrl, maximumSeconds, durationOverride);
  const [thumbnailsReady, setThumbnailsReady] = useState(!videoFile);
  const tooLong = Math.floor(trimRange.end - trimRange.start) > maximumSeconds;
  const tooShort = trimRange.end - trimRange.start < minimumSeconds;

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
    onConfirm?.(snapRange(trimRange), snapshot());
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
        <button className={styles.closeButton} type="button" onClick={handleCancel} aria-label="Close trim dialog">×</button>
        <div className={styles.content}>
          <h2 id="platform-video-trim-title">{labels.title || 'Trim video'}</h2>
          <div className={styles.preview} style={{ aspectRatio }}>
            <video ref={videoRef} src={activeUrl} preload="auto" playsInline muted={isMuted} onLoadedMetadata={handleLoadedMetadata} />
            <button className={styles.previewPlay} type="button" onClick={togglePlay} aria-label={isPlaying ? 'Pause video' : 'Play video'}><span><PlayIcon paused={isPlaying} /></span></button>
            <button className={styles.muteButton} type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute video' : 'Mute video'}><MuteIcon muted={isMuted} /></button>
          </div>
          <TrimTimeline
            videoRef={videoRef}
            videoFile={videoFile}
            fallbackThumbnailUrl={fallbackThumbnailUrl}
            duration={duration}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            trimRange={trimRange}
            setTrimRange={setTrimRange}
            minimumSeconds={minimumSeconds}
            maximumSeconds={maximumSeconds}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            stop={stop}
            resume={resume}
            onReadyChange={setThumbnailsReady}
            maxLengthLabel={labels.maxLength || `Select ${minimumSeconds}–${maximumSeconds} seconds`}
          />
          <div className={styles.actions}>
            <button data-testid="trim-cancel" type="button" onClick={handleCancel}>{labels.cancel || 'Cancel'}</button>
            <button data-testid="trim-use-video" type="button" onClick={handleConfirm} disabled={tooLong || tooShort || !thumbnailsReady}>{labels.confirm || 'Use Video'}</button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
