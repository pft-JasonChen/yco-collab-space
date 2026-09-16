import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import useMomentumTracking from './useMomentumTracking.js';
import styles from './GalleryTabs.module.scss';

const defaultPos = { top: 0, left: 0, x: 0, y: 0 };

/**
 * Pointer-drag scrolling for an overflowing row, ported from RD's
 * common/drag-scroll-wrapper. Dragging is a pointer affordance only: a touch
 * device already scrolls natively, so the handlers stand down there and never
 * fight the native gesture.
 *
 * `moved` is exposed through the imperative handle because the caller needs it
 * to suppress the click that ends a drag — RD's gallery does exactly this so a
 * flick across the tab row does not also switch tab.
 */
const DragScrollWrapper = forwardRef(function DragScrollWrapper(
  {
    children,
    wrapperClass = '',
    enableDrag = { x: false, y: false },
    onScroll = () => {},
    onWheel = () => {},
    onTouchMove = () => {},
    onMouseMove = () => {},
    onMove = () => {},
    id,
  },
  ref,
) {
  const [dragging, setDragging] = useState(false);
  const [moved, setMoved] = useState(false);
  const [pos, setPos] = useState({ ...defaultPos });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Read after mount so a server render never assumes a pointer device.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    setIsTouchDevice(coarse || navigator.maxTouchPoints > 0);
  }, []);

  const dragRef = useRef(null);
  const {
    handlePointerDownForMomentum,
    handlePointerMoveForMomentum,
    handlePointerUpForMomentum,
  } = useMomentumTracking({ dragRef, enableDrag });

  const needDrag = !isTouchDevice && (enableDrag.x || enableDrag.y);

  const handlePointerDown = (event) => {
    if (!needDrag || dragging) return;
    setMoved(false);
    setDragging(true);
    setPos({
      left: dragRef.current.scrollLeft,
      top: dragRef.current.scrollTop,
      x: event.clientX,
      y: event.clientY,
    });
    onMove();
    handlePointerDownForMomentum(event);
    event.target?.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!needDrag || !dragging) {
      setMoved(false);
      return;
    }
    const xScrollable = dragRef.current.clientWidth < dragRef.current.scrollWidth;
    const yScrollable = dragRef.current.clientHeight < dragRef.current.scrollHeight;
    const dx = event.clientX - pos.x;
    const dy = event.clientY - pos.y;
    if (xScrollable && enableDrag.x) {
      dragRef.current.scrollLeft = pos.left - dx;
      if (!moved) setMoved(true);
    }
    if (yScrollable && enableDrag.y) {
      dragRef.current.scrollTop = pos.top - dy;
      if (!moved) setMoved(true);
    }
    handlePointerMoveForMomentum(event);
  };

  const handlePointerUp = (event) => {
    if (!needDrag || !dragging) return;
    setDragging(false);
    setPos({ ...defaultPos });
    handlePointerUpForMomentum(event);
    event.target?.releasePointerCapture?.(event.pointerId);
  };

  useImperativeHandle(ref, () => ({
    elementRef: dragRef,
    element: dragRef.current,
    moved,
  }));

  return (
    <div
      ref={dragRef}
      className={[styles.hiddenScrollbar, wrapperClass].filter(Boolean).join(' ')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onScroll={onScroll}
      onWheel={onWheel}
      onTouchMove={onTouchMove}
      onMouseMove={onMouseMove}
      id={id}
    >
      {children}
    </div>
  );
});

export default DragScrollWrapper;
