import ImageWrapper from '@/components/common/image-wrapper';
import styles from './index.module.scss';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

const THUMBNAIL_GAP = 4;
const MAX_THUMBNAIL_COUNT = 10;
const SNAP_THRESHOLD_PX = 12; // magnetic snap range in pixels

/**
 * Timeline component for video scrubbing.
 *
 * Displays a strip of frame thumbnails extracted from the video,
 * with a draggable playhead to seek through the video.
 *
 * Props:
 * - videoEl: HTMLVideoElement (the source video, muted)
 * - duration: number (video duration in seconds)
 * - currentTime: number (current playback time)
 * - isPlaying: boolean
 * - onSeek: (time: number) => void
 * - onPlay: () => void
 * - onPause: () => void
 */
export default function Timeline({
  videoSrc,
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  markers = [],
  playheadRef,
  onSeek,
  onPlay,
  onPause,
}) {
  const trackRef = useRef(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false); // ref 版本：避免 closure stale state 導致 pointerMove 第一幀失效
  const wasPausedRef = useRef(false);
  const pendingSeekRafRef = useRef(null); // rAF throttle：拖拉時每個動畫幀最多一次 seek
  const pendingSeekTimeRef = useRef(null);

  // Progress percentage
  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  // Format seconds → mm:ss
  const formatTime = useCallback((seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Extract thumbnail frames from the video
  useEffect(() => {
    if (!videoSrc || !duration || !trackRef.current) return;

    let cancelled = false;
    const blobUrls = [];
    let seekVideo = null;

    const extractThumbnails = async () => {
      const trackHeight = trackRef.current?.offsetHeight || 40;
      const trackWidth = trackRef.current?.offsetWidth || 400;
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const displayThumbWidth =
        (trackWidth - (MAX_THUMBNAIL_COUNT - 1) * THUMBNAIL_GAP) /
        MAX_THUMBNAIL_COUNT;
      const thumbs = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = Math.round(displayThumbWidth * dpr);
      canvas.height = Math.round(trackHeight * dpr);

      seekVideo = document.createElement('video');
      seekVideo.muted = true;
      seekVideo.preload = 'auto';
      seekVideo.src = videoSrc;

      // loadedmetadata, not loadeddata — iOS Safari (Low Power Mode /
      // low-RAM devices) suppresses preload so loadeddata may never fire;
      // metadata is enough here since each frame below is seek-decoded.
      await new Promise((resolve) => {
        seekVideo.addEventListener('loadedmetadata', resolve, { once: true });
        seekVideo.load();
      });

      const videoAspect = seekVideo.videoWidth / seekVideo.videoHeight;
      const canvasAspect = canvas.width / canvas.height;

      for (let i = 0; i < MAX_THUMBNAIL_COUNT; i++) {
        if (cancelled) break;
        const time = (i / MAX_THUMBNAIL_COUNT) * duration;
        // First frame: seek to 0.001 instead of 0 — a same-position seek
        // (video starts at 0) may not fire 'seeked' on iOS Safari.
        seekVideo.currentTime = time || 0.001;
        await new Promise((resolve) => {
          seekVideo.addEventListener('seeked', resolve, { once: true });
        });

        // Cover-crop: match object-fit: cover behavior at canvas level
        let sx, sy, sw, sh;
        if (videoAspect > canvasAspect) {
          sh = seekVideo.videoHeight;
          sw = Math.round(sh * canvasAspect);
          sx = Math.round((seekVideo.videoWidth - sw) / 2);
          sy = 0;
        } else {
          sw = seekVideo.videoWidth;
          sh = Math.round(sw / canvasAspect);
          sx = 0;
          sy = Math.round((seekVideo.videoHeight - sh) / 2);
        }
        ctx.drawImage(
          seekVideo,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          canvas.width,
          canvas.height
        );
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        );
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        thumbs.push({ dataUrl: url, time });
      }

      seekVideo.removeAttribute('src');
      seekVideo.load();

      if (!cancelled) {
        setThumbnails(thumbs);
      }
    };

    setThumbnails([]);
    extractThumbnails();
    return () => {
      cancelled = true;
      if (seekVideo) {
        seekVideo.removeAttribute('src');
        seekVideo.load();
      }
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [videoSrc, duration]);

  // Snap time to nearest marker if within threshold
  const snapToMarker = useCallback(
    (time) => {
      if (!trackRef.current || !duration || !markers.length) return time;
      const rect = trackRef.current.getBoundingClientRect();
      const pxPerSec = rect.width / duration;

      let best = time;
      let bestDist = Infinity;
      for (const m of markers) {
        const dist = Math.abs(m - time) * pxPerSec;
        if (dist < SNAP_THRESHOLD_PX && dist < bestDist) {
          bestDist = dist;
          best = m;
        }
      }
      return best;
    },
    [duration, markers]
  );

  // Convert pointer position to time
  const positionToTime = useCallback(
    (clientX) => {
      if (!trackRef.current || !duration) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  // Pointer handlers for scrubbing
  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      wasPausedRef.current = !isPlaying;
      onPause?.();
      const rawTime = positionToTime(e.clientX);
      const time = snapToMarker(rawTime);
      // If snapped to a marker (key frame), stay paused after pointer up
      if (time !== rawTime) {
        wasPausedRef.current = true;
      }
      onSeek?.(time);
      e.target.setPointerCapture?.(e.pointerId);
    },
    [positionToTime, snapToMarker, onSeek, onPause, isPlaying]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return; // 用 ref 避免 async state 導致第一幀 move 被吃掉
      const rawTime = positionToTime(e.clientX);
      const time = snapToMarker(rawTime);
      // Throttle seek to one per animation frame to avoid overloading the browser decoder
      pendingSeekTimeRef.current = time;
      if (pendingSeekRafRef.current === null) {
        pendingSeekRafRef.current = requestAnimationFrame(() => {
          pendingSeekRafRef.current = null;
          onSeek?.(pendingSeekTimeRef.current);
        });
      }
    },
    [positionToTime, snapToMarker, onSeek]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (pendingSeekRafRef.current !== null) {
      cancelAnimationFrame(pendingSeekRafRef.current);
      pendingSeekRafRef.current = null;
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    if (!wasPausedRef.current) {
      onPlay?.();
    }
  }, [onPlay]);

  // Play/pause toggle
  const handlePlayPauseClick = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  return (
    <div className={styles.container}>
      {/* Play/Pause button */}
      <button
        className={styles.playPauseBtn}
        onClick={handlePlayPauseClick}
        type="button"
      >
        {/* {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        )} */}
        {isPlaying ? (
          <ImageWrapper
            src={'/assets/images/videoObjectRemover/pause.svg'}
            width={16}
            height={16}
            alt="Pause"
          />
        ) : (
          <ImageWrapper
            src={'/assets/images/videoObjectRemover/play2.svg'}
            width={16}
            height={16}
            alt="Play"
          />
        )}
      </button>

      {/* Time display */}
      {/* <span className={styles.timeDisplay}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span> */}

      {/* Timeline track */}
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Thumbnail strip */}
        <div className={styles.thumbnailStrip}>
          {thumbnails.map((thumb, i) => (
            <ImageWrapper
              key={i}
              src={thumb.dataUrl}
              alt=""
              imageClass={styles.thumbnail}
              draggable={false}
            />
          ))}
        </div>

        {/* Progress fill */}
        {/* <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        /> */}

        {/* Playhead */}
        <div
          ref={playheadRef}
          className={styles.playhead}
          style={{ left: `${progress}%` }}
        >
          <div className={styles.playheadLine} />
        </div>

        {/* Mask markers */}
        {markers.map((time, i) => {
          const pct = duration ? (time / duration) * 100 : 0;
          return (
            <div
              key={i}
              className={styles.marker}
              style={{ left: `${pct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
