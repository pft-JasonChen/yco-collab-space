import { useEffect, useState } from 'react';
import styles from './trim-timeline.module.scss';
import ImageWrapper from '@/components/common/image-wrapper';
import useFrameThumbnails from './use-frame-thumbnails';
import useTrimDrag from './use-trim-drag';
import useWindowDevice from '@/hooks/use-window-device';
import { TrimHandleGrip } from './icons';
import {
  FRAME_COUNT,
  FRAME_INSET,
  MAX_TRIM_SECONDS,
  MIN_TRIM_SECONDS,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_HEIGHT_MOBILE,
  formatDuration,
  getPxPerSecond,
  getThumbnailWidth,
  isTrimRangeTooLong,
} from './constants';

export default function TrimTimeline({
  t,
  videoRef,
  videoFile,
  duration,
  currentTime,
  setCurrentTime,
  trimRange,
  setTrimRange,
  isPlaying,
  onTogglePlay,
  stop,
  resume,
  onThumbnailsReadyChange,
}) {
  const { isMd } = useWindowDevice();
  const thumbnailHeight = isMd ? THUMBNAIL_HEIGHT_MOBILE : THUMBNAIL_HEIGHT;
  const { framesAreaRef, startDrag, startTrackSeek } = useTrimDrag({
    duration,
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
    const el = framesAreaRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFramesAreaWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [framesAreaRef]);

  const thumbnailWidth = getThumbnailWidth(framesAreaWidth);
  const { canvasRefs, isReady: thumbnailsReady } = useFrameThumbnails(
    videoFile,
    duration,
    thumbnailWidth,
    thumbnailHeight
  );
  useEffect(() => {
    onThumbnailsReadyChange?.(thumbnailsReady);
  }, [thumbnailsReady, onThumbnailsReadyChange]);

  const timelineWidth = framesAreaRef.current?.clientWidth || 0;
  const pxPerSecond = getPxPerSecond(timelineWidth, duration);
  const leftDarkWidth = trimRange.start * pxPerSecond;
  const rangeWidth = (trimRange.end - trimRange.start) * pxPerSecond;
  const playheadLeft = FRAME_INSET + currentTime * pxPerSecond;
  const isTooLong = isTrimRangeTooLong(trimRange);

  return (
    <div className={styles.trimTimelineSection}>
      <div className={styles.trimMetaRow}>
        <span className={`${styles.lbl} ${isTooLong ? styles.lblError : ''}`}>
          {t('ai.agent.trim.max.length', {
            max: MAX_TRIM_SECONDS,
            min: MIN_TRIM_SECONDS,
          })}
        </span>
        <span className={styles.dur}>
          {formatDuration(trimRange.end - trimRange.start)}
        </span>
      </div>

      <div className={styles.trimRow}>
        <button className={styles.trimRowPlayBtn} onClick={onTogglePlay}>
          <ImageWrapper
            src={`/assets/images/videoObjectRemover/${
              isPlaying ? 'pause' : 'play2'
            }.svg`}
            alt={isPlaying ? 'Pause' : 'Play'}
          />
        </button>

        <div
          className={styles.trimFramesArea}
          ref={framesAreaRef}
          onPointerDown={startTrackSeek}
        >
          <div className={styles.trimCanvasRow}>
            {Array.from({ length: FRAME_COUNT }).map((_, i) => (
              <canvas
                key={i}
                width={thumbnailWidth}
                height={thumbnailHeight}
                ref={(el) => (canvasRefs.current[i] = el)}
              />
            ))}
          </div>

          <div className={styles.trimRangeOverlay}>
            <div
              className={styles.trimDark}
              style={{ width: `${leftDarkWidth}px` }}
            />
            <div
              className={styles.trimRangeBox}
              style={{ width: `${rangeWidth}px` }}
            >
              <div
                className={styles.trimHandleL}
                onPointerDown={startDrag('left')}
              >
                <TrimHandleGrip />
              </div>
              <div
                className={styles.trimHandleR}
                onPointerDown={startDrag('right')}
              >
                <TrimHandleGrip />
              </div>
            </div>
            <div className={styles.trimDark} style={{ flex: 1 }} />
          </div>

          <div
            className={styles.trimPlayhead}
            style={{ transform: `translateX(${playheadLeft}px)` }}
            onPointerDown={startDrag('playhead')}
          >
            <div className={styles.trimPlayheadBar} />
          </div>
        </div>
      </div>
    </div>
  );
}
