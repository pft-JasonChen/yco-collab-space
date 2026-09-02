import { useCallback, useEffect, useRef, useState } from 'react';

export default function useVideoTrim(videoUrl, maxTrimSeconds, durationOverride = null) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    setDuration(0);
    setIsPlaying(false);
    setIsMuted(true);
    setCurrentTime(0);
    setTrimRange({ start: 0, end: 0 });
    setAspectRatio(16 / 9);
  }, [videoUrl, maxTrimSeconds, durationOverride]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const nextDuration = Number.isFinite(durationOverride) && durationOverride > 0
      ? durationOverride
      : video?.duration || 0;
    setDuration(nextDuration);
    setTrimRange({ start: 0, end: Math.min(nextDuration, maxTrimSeconds) });
    if (video?.videoWidth && video?.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  }, [durationOverride, maxTrimSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return undefined;

    let frameId;
    const tick = () => {
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
  }, [duration, trimRange.start, trimRange.end]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime < trimRange.start || video.currentTime > trimRange.end) {
      video.currentTime = trimRange.start;
      setCurrentTime(trimRange.start);
    }
  }, [trimRange.start, trimRange.end]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (video.currentTime < trimRange.start || video.currentTime >= trimRange.end) {
      video.currentTime = trimRange.start;
    }
    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [trimRange.start, trimRange.end]);

  const toggleMute = useCallback(() => setIsMuted((current) => !current), []);
  const stop = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);
  const resume = useCallback(() => {
    videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  const snapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch {
      return null;
    }
  }, []);

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
    resume,
    snapshot,
  };
}
