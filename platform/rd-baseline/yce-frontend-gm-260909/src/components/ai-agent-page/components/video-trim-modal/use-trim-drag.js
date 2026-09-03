import { useCallback, useEffect, useRef } from 'react';
import {
  FRAME_INSET,
  MIN_TRIM_SECONDS,
  clamp,
  getPxPerSecond,
} from './constants';

export default function useTrimDrag({
  duration,
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
  const isDraggingRef = useRef(false);
  const activeTargetRef = useRef(null);
  const pendingSeekRafRef = useRef(null);
  const pendingSeekClientXRef = useRef(null);
  const wasPlayingRef = useRef(false);

  const trimRangeRef = useRef(trimRange);
  trimRangeRef.current = trimRange;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Releasing a drag outside the modal fires a trailing `click` whose target
  // is the nearest common ancestor of the pointerdown (the handle) and the
  // pointerup location — the modal's overlay div, which closes the modal.
  // Swallow that click while a drag is in flight. The flag is cleared a tick
  // after pointerup (not inside its own handler) because the click fires
  // synchronously right after pointerup, before the deferred clear runs.
  useEffect(() => {
    const suppressDragClick = (e) => {
      if (isDraggingRef.current) e.stopPropagation();
    };
    window.addEventListener('click', suppressDragClick, true);
    return () => window.removeEventListener('click', suppressDragClick, true);
  }, []);

  const seekToClientX = useCallback(
    (clientX, rect, pxPerSecond) => {
      const time = clamp(
        (clientX - rect.left - FRAME_INSET) / pxPerSecond,
        trimRangeRef.current.start,
        trimRangeRef.current.end
      );
      setCurrentTime(time);
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    [setCurrentTime, videoRef]
  );

  const scheduleSeek = useCallback(
    (clientX, rect, pxPerSecond) => {
      pendingSeekClientXRef.current = clientX;
      if (pendingSeekRafRef.current !== null) return;
      pendingSeekRafRef.current = requestAnimationFrame(() => {
        pendingSeekRafRef.current = null;
        seekToClientX(pendingSeekClientXRef.current, rect, pxPerSecond);
      });
    },
    [seekToClientX]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const { type, startX, startRange, pxPerSecond, rect } = drag;

      if (type === 'playhead') {
        scheduleSeek(e.clientX, rect, pxPerSecond);
        return;
      }

      const deltaSec = (e.clientX - startX) / pxPerSecond;
      const duration = durationRef.current;

      if (type === 'left') {
        const maxStart = startRange.end - MIN_TRIM_SECONDS;
        const start = clamp(startRange.start + deltaSec, 0, maxStart);
        setTrimRange((prev) => ({ ...prev, start }));
      } else if (type === 'right') {
        const minEnd = startRange.start + MIN_TRIM_SECONDS;
        const end = clamp(startRange.end + deltaSec, minEnd, duration);
        setTrimRange((prev) => ({ ...prev, end }));
      }
    },
    [setTrimRange, scheduleSeek]
  );

  const releaseTarget = useCallback((e) => {
    const attached = activeTargetRef.current;
    if (!attached) return;
    const { target, onMove, onUp } = attached;
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
    target.removeEventListener('lostpointercapture', onUp);
    if (e?.pointerId !== undefined && target.hasPointerCapture?.(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    activeTargetRef.current = null;
  }, []);

  const handlePointerUp = useCallback(
    (e) => {
      const drag = dragStateRef.current;
      dragStateRef.current = null;
      if (pendingSeekRafRef.current !== null) {
        cancelAnimationFrame(pendingSeekRafRef.current);
        pendingSeekRafRef.current = null;
      }
      releaseTarget(e);
      if (drag?.type === 'playhead' && wasPlayingRef.current) {
        resume?.();
      }
      wasPlayingRef.current = false;
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);
    },
    [releaseTarget, resume]
  );

  const startDrag = useCallback(
    (type) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = framesAreaRef.current?.getBoundingClientRect();
      const duration = durationRef.current;
      if (!rect || !duration) return;
      isDraggingRef.current = true;
      dragStateRef.current = {
        type,
        startX: e.clientX,
        startRange: trimRangeRef.current,
        pxPerSecond: getPxPerSecond(rect.width, duration),
        rect,
      };
      // Scrubbing the playhead pauses playback (if it was running) so the
      // frame under the pointer holds still; releasing resumes it.
      if (type === 'playhead') {
        wasPlayingRef.current = isPlayingRef.current;
        if (wasPlayingRef.current) stop?.();
      }
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      activeTargetRef.current = {
        target,
        onMove: handlePointerMove,
        onUp: handlePointerUp,
      };
      target.addEventListener('pointermove', handlePointerMove);
      target.addEventListener('pointerup', handlePointerUp);
      target.addEventListener('pointercancel', handlePointerUp);
      // Some older WebKit builds drop the terminal pointerup/pointercancel
      // when a native gesture (e.g. scroll) contends with setPointerCapture.
      // lostpointercapture still fires when capture ends, so use it as a
      // backstop to guarantee drag state (and the click-suppression flag) is
      // always cleared.
      target.addEventListener('lostpointercapture', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, stop]
  );

  useEffect(() => () => releaseTarget(), [releaseTarget]);

  const startTrackSeek = useCallback(
    (e) => {
      startDrag('playhead')(e);
      const drag = dragStateRef.current;
      if (drag) seekToClientX(e.clientX, drag.rect, drag.pxPerSecond);
    },
    [startDrag, seekToClientX]
  );

  return { framesAreaRef, startDrag, startTrackSeek };
}
