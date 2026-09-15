import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { browserUtils as browserUtils } from './adapters.jsx';
import useMomentumTracking from './use-momentum-tracking.js';

const defaultPos = { top: 0, left: 0, x: 0, y: 0 };

export default forwardRef(function DragScrollWrapper(props, ref) {
  const {
    children,
    wrapperClass = '',
    enableDrag = { x: false, y: false },
    onScroll = () => {},
    onWheel = () => {},
    onTouchMove = () => {},
    onMouseMove = () => {},
    onMove = () => {},
    id,
  } = props;
  const [dragging, setDragging] = useState(false);
  const [moved, setMoved] = useState(false);
  const [pos, setPos] = useState({ ...defaultPos });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(browserUtils.isTouchDevice());
  }, []);
  const dragRef = useRef(null);
  const {
    handlePointerDownForMomentum,
    handlePointerMoveForMomentum,
    handlePointerUpForMomentum,
  } = useMomentumTracking({ dragRef, enableDrag });

  const needDrag = !isTouchDevice && (enableDrag.x || enableDrag.y);

  const handlePointerDown = (e) => {
    if (!needDrag || dragging) return;
    setMoved(false);
    setDragging(true);
    setPos({
      left: dragRef.current.scrollLeft,
      top: dragRef.current.scrollTop,
      x: e.clientX,
      y: e.clientY,
    });
    onMove();
    handlePointerDownForMomentum(e);
    e.target?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!needDrag || !dragging) {
      setMoved(false);
      return;
    }
    const xScrollable =
      dragRef.current.clientWidth < dragRef.current.scrollWidth;
    const yScrollable =
      dragRef.current.clientHeight < dragRef.current.scrollHeight;
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;
    if (xScrollable && enableDrag.x) {
      dragRef.current.scrollLeft = pos.left - dx;
      !moved && setMoved(true);
    }
    if (yScrollable && enableDrag.y) {
      dragRef.current.scrollTop = pos.top - dy;
      !moved && setMoved(true);
    }
    handlePointerMoveForMomentum(e);
  };

  const handlePointerUp = (e) => {
    if (!needDrag || !dragging) return;
    setDragging(false);
    setPos({ ...defaultPos });
    handlePointerUpForMomentum(e);
    e.target?.releasePointerCapture?.(e.pointerId);
  };

  useImperativeHandle(ref, () => ({
    elementRef: dragRef,
    element: dragRef.current,
    moved,
  }));

  return (
    <div
      ref={dragRef}
      className={`hidden-scrollbar ${wrapperClass}`}
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

