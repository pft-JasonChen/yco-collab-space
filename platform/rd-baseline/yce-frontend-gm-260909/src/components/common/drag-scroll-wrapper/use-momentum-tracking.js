import _defaults from 'lodash/defaults';

let momentum = { prevX: 0, prevY: 0, dx: 0, dy: 0, t: 0 };
let momentumID = null;

export default function useMomentumTracking(props) {
  const { dragRef, enableDrag } = props;

  const handlePointerDownForMomentum = (e) => {
    cancelMomentumTracking();
    momentum = _defaults({ prevX: e.clientX, prevY: e.clientY }, momentum);
    e.target?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMoveForMomentum = (e) => {
    const dx = e.clientX - momentum.prevX;
    const dy = e.clientY - momentum.prevY;
    const t = Date.now();
    momentum = {
      prevX: e.clientX,
      prevY: e.clientY,
      dx,
      dy,
      t,
    };
  };

  const handlePointerUpForMomentum = (e) => {
    startMomentumTracking();
    e.target?.releasePointerCapture?.(e.pointerId);
  };

  const startMomentumTracking = () => {
    cancelMomentumTracking();
    const releaseTime = Date.now() - momentum.t;
    if (releaseTime > 200) return;
    momentumID = requestAnimationFrame(() => momentumLoop(0.95));
  };

  const cancelMomentumTracking = () => {
    cancelAnimationFrame(momentumID);
    momentumID = null;
  };

  const momentumLoop = (vel = 0.95) => {
    const { dx, dy } = momentum;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const exp = Math.min((absDx + absDy) ** 0.5 / 3, 0.95);
    if (enableDrag.x && absDx * vel > 0.5) {
      dragRef.current.scrollLeft -= dx * vel;
    }
    if (enableDrag.y && absDy * vel > 0.5) {
      dragRef.current.scrollTop -= dy * vel;
    }
    if (Math.abs(vel) > 0.1) {
      momentumID = requestAnimationFrame(() => momentumLoop(vel * exp));
    }
  };

  return {
    handlePointerDownForMomentum,
    handlePointerMoveForMomentum,
    handlePointerUpForMomentum,
  };
}
