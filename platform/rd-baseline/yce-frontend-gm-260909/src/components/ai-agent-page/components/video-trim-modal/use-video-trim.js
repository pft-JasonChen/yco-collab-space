import { useCallback, useEffect, useRef, useState } from 'react';
import browserUtils from '@/utils/browserUtils';
import { MAX_TRIM_SECONDS } from './constants';

// Owns the visible preview <video> element: metadata/duration, play/pause,
// mute, and the current trim selection. Playback loops inside the selection
// instead of running to the end of the source clip.
export default function useVideoTrim(videoUrl) {
  const videoRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    // unload()'s poster is set imperatively and the modal never unmounts —
    // without this the next video opens showing the previous one's frame.
    videoRef.current?.removeAttribute('poster');
    setDuration(0);
    setIsPlaying(false);
    setIsMuted(true);
    setCurrentTime(0);
    setTrimRange({ start: 0, end: 0 });
    setAspectRatio(16 / 9);
  }, [videoUrl]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const dur = video?.duration || 0;
    setDuration(dur);
    setTrimRange({ start: 0, end: Math.min(dur, MAX_TRIM_SECONDS) });
    if (video?.videoWidth && video?.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
    // iOS Safari can leave the <video> element's own render surface blank
    // until playback actually starts — a currentTime seek alone isn't
    // enough to establish it. Muted play()-then-immediate-pause() forces
    // that surface online without visibly playing. Scoped to iOS only:
    // desktop/Android already paint the first frame fine on load.
    if (video && browserUtils.isIOs()) {
      video
        .play()
        ?.then(() => video.pause())
        .catch(() => {});
    }
  }, []);

  // Polls the <video> element's own paused/ended state directly instead of
  // gating on the isPlaying React state, so the playhead keeps following
  // actual playback even if something else (e.g. a swallowed click) leaves
  // isPlaying out of sync with the video.
  useEffect(
    function drivePlayheadWithRaf() {
      const video = videoRef.current;
      if (!video) return undefined;

      let frameId;
      const tick = () => {
        // Checked unconditionally (not just while !paused/!ended) because on
        // some devices the video's own end-of-media pause/ended flags can
        // flip before this loop observes currentTime crossing trimRange.end.
        if (video.ended || video.currentTime >= trimRange.end) {
          video.pause();
          video.currentTime = trimRange.start;
          setCurrentTime(trimRange.start);
          setIsPlaying(false);
        } else if (!video.paused) {
          setCurrentTime(video.currentTime);
        }
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);

      return () => cancelAnimationFrame(frameId);
    },
    [trimRange.start, trimRange.end]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (
      video.currentTime < trimRange.start ||
      video.currentTime >= trimRange.end
    ) {
      video.currentTime = trimRange.start;
    }
    video.play();
    setIsPlaying(true);
  }, [isPlaying, trimRange]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const stop = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Unlike stop(), actually releases the <video>'s decode session (pausing
  // alone keeps it loaded/decoded) — used right before trimVideoFile starts
  // its own decode+encode pass over the same file, so the two don't compete
  // for hardware video decoder resources (see "Unexpected frame format"
  // trim failures). Snapshots the current frame to a `poster` first so the
  // preview freezes on it instead of going blank, and returns that same
  // snapshot so the caller can show it as the composer's placeholder
  // thumbnail while trimming/uploading run in the background — it's exactly
  // the frame the user was looking at when they confirmed the trim.
  const unload = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    video.pause();
    let posterDataUrl = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      posterDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      video.poster = posterDataUrl;
    } catch {
      // No snapshot (e.g. dimensions not yet available) — caller falls back
      // to its own default thumbnail handling, a cosmetic downside only.
    }
    video.removeAttribute('src');
    video.load();
    setIsPlaying(false);
    return posterDataUrl;
  }, []);

  const resume = useCallback(() => {
    videoRef.current?.play();
    setIsPlaying(true);
  }, []);

  // Whenever the selection is dragged, keep playback position inside it so a
  // paused scrub never shows a frame outside the new range.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (
      video.currentTime < trimRange.start ||
      video.currentTime > trimRange.end
    ) {
      video.currentTime = trimRange.start;
      setCurrentTime(trimRange.start);
    }
  }, [trimRange.start, trimRange.end]);

  return {
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
    unload,
    resume,
  };
}
