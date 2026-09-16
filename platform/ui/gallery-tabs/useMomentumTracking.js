import { useCallback, useRef } from 'react';

/**
 * Flick-to-scroll momentum for DragScrollWrapper, ported from RD's
 * common/drag-scroll-wrapper/use-momentum-tracking.js.
 *
 * The decay curve is RD's, unchanged: a release more than 200ms after the last
 * move does not coast at all; otherwise velocity decays by an exponent derived
 * from the flick distance, capped at 0.95, and stops below 0.1.
 *
 * The one change from RD is scope. RD holds `momentum` and `momentumID` in
 * module-level `let` bindings, so every wrapper on a page shares one velocity
 * record and one animation frame — with a single wrapper per page that is
 * invisible, but a shared component can be mounted twice, and the second
 * instance would cancel the first's animation and inherit its velocity. Both
 * live in refs here so each wrapper coasts independently.
 */
export default function useMomentumTracking({ dragRef, enableDrag }) {
  const momentum = useRef({ prevX: 0, prevY: 0, dx: 0, dy: 0, t: 0 });
  const momentumID = useRef(null);

  const cancelMomentumTracking = useCallback(() => {
    if (momentumID.current !== null) cancelAnimationFrame(momentumID.current);
    momentumID.current = null;
  }, []);

  const momentumLoop = useCallback(
    (vel = 0.95) => {
      const { dx, dy } = momentum.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const exp = Math.min((absDx + absDy) ** 0.5 / 3, 0.95);
      if (enableDrag.x && absDx * vel > 0.5 && dragRef.current) {
        dragRef.current.scrollLeft -= dx * vel;
      }
      if (enableDrag.y && absDy * vel > 0.5 && dragRef.current) {
        dragRef.current.scrollTop -= dy * vel;
      }
      if (Math.abs(vel) > 0.1) {
        momentumID.current = requestAnimationFrame(() => momentumLoop(vel * exp));
      }
    },
    [dragRef, enableDrag],
  );

  const startMomentumTracking = useCallback(() => {
    cancelMomentumTracking();
    const releaseTime = Date.now() - momentum.current.t;
    if (releaseTime > 200) return;
    momentumID.current = requestAnimationFrame(() => momentumLoop(0.95));
  }, [cancelMomentumTracking, momentumLoop]);

  const handlePointerDownForMomentum = useCallback(
    (event) => {
      cancelMomentumTracking();
      momentum.current = {
        ...momentum.current,
        prevX: event.clientX,
        prevY: event.clientY,
      };
      event.target?.setPointerCapture?.(event.pointerId);
    },
    [cancelMomentumTracking],
  );

  const handlePointerMoveForMomentum = useCallback((event) => {
    momentum.current = {
      prevX: event.clientX,
      prevY: event.clientY,
      dx: event.clientX - momentum.current.prevX,
      dy: event.clientY - momentum.current.prevY,
      t: Date.now(),
    };
  }, []);

  const handlePointerUpForMomentum = useCallback(
    (event) => {
      startMomentumTracking();
      event.target?.releasePointerCapture?.(event.pointerId);
    },
    [startMomentumTracking],
  );

  return {
    handlePointerDownForMomentum,
    handlePointerMoveForMomentum,
    handlePointerUpForMomentum,
  };
}
