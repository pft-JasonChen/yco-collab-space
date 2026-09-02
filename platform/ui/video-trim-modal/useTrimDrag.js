import { useCallback, useEffect, useRef } from 'react';
import { FRAME_INSET, clamp, getPxPerSecond } from './constants.js';

export default function useTrimDrag({
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
}) {
  const framesAreaRef = useRef(null);
  const dragStateRef = useRef(null);
  const activeTargetRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const trimRangeRef = useRef(trimRange);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  trimRangeRef.current = trimRange;
  durationRef.current = duration;
  isPlayingRef.current = isPlaying;

  const seekTo = useCallback((clientX, rect, pixelsPerSecond) => {
    const time = clamp(
      (clientX - rect.left - FRAME_INSET) / pixelsPerSecond,
      trimRangeRef.current.start,
      trimRangeRef.current.end,
    );
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  }, [setCurrentTime, videoRef]);

  const releaseTarget = useCallback((event) => {
    const attached = activeTargetRef.current;
    if (!attached) return;
    const { target, onMove, onUp } = attached;
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
    target.removeEventListener('lostpointercapture', onUp);
    if (event?.pointerId !== undefined && target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    activeTargetRef.current = null;
  }, []);

  const handlePointerMove = useCallback((event) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const { type, startX, startRange, pixelsPerSecond, rect } = drag;

    if (type === 'playhead') {
      seekTo(event.clientX, rect, pixelsPerSecond);
      return;
    }

    // A handle stops at the maximum window instead of letting the selection grow
    // past it, so an over-long segment can never be produced in the first place.
    const window = Number.isFinite(maximumSeconds) && maximumSeconds > 0 ? maximumSeconds : Infinity;
    const deltaSeconds = (event.clientX - startX) / pixelsPerSecond;
    if (type === 'left') {
      const minimumStart = Math.max(0, startRange.end - window);
      const maximumStart = startRange.end - minimumSeconds;
      const start = clamp(startRange.start + deltaSeconds, minimumStart, Math.max(minimumStart, maximumStart));
      setTrimRange((current) => ({ ...current, start }));
    } else {
      const minimumEnd = startRange.start + minimumSeconds;
      const maximumEnd = Math.min(durationRef.current, startRange.start + window);
      const end = clamp(startRange.end + deltaSeconds, Math.min(minimumEnd, maximumEnd), maximumEnd);
      setTrimRange((current) => ({ ...current, end }));
    }
  }, [maximumSeconds, minimumSeconds, seekTo, setTrimRange]);

  const handlePointerUp = useCallback((event) => {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    releaseTarget(event);
    if (drag?.type === 'playhead' && wasPlayingRef.current) resume?.();
    wasPlayingRef.current = false;
  }, [releaseTarget, resume]);

  const startDrag = useCallback((type) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = framesAreaRef.current?.getBoundingClientRect();
    if (!rect || !durationRef.current) return;
    dragStateRef.current = {
      type,
      startX: event.clientX,
      startRange: trimRangeRef.current,
      pixelsPerSecond: getPxPerSecond(rect.width, durationRef.current),
      rect,
    };
    if (type === 'playhead') {
      wasPlayingRef.current = isPlayingRef.current;
      if (wasPlayingRef.current) stop?.();
    }
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    activeTargetRef.current = {
      target,
      onMove: handlePointerMove,
      onUp: handlePointerUp,
    };
    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
    target.addEventListener('pointercancel', handlePointerUp);
    target.addEventListener('lostpointercapture', handlePointerUp);
  }, [handlePointerMove, handlePointerUp, stop]);

  const startTrackSeek = useCallback((event) => {
    startDrag('playhead')(event);
    const drag = dragStateRef.current;
    if (drag) seekTo(event.clientX, drag.rect, drag.pixelsPerSecond);
  }, [seekTo, startDrag]);

  useEffect(() => () => releaseTarget(), [releaseTarget]);
  return { framesAreaRef, startDrag, startTrackSeek };
}
