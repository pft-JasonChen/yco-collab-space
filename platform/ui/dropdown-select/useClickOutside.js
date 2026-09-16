import { useEffect, useRef } from 'react';

/**
 * Close-on-outside-click, ported unchanged from RD's
 * common/selection-control/dropdown-select/hooks/use-click-outside.
 *
 * The listener is registered in the capture phase, which is what makes a
 * dropdown inside another click handler (a gallery cell, say) close before that
 * handler runs rather than after it.
 *
 * @param {React.RefObject<HTMLElement>} targetRef
 * @param {(event: MouseEvent) => void} onClickOutside
 */
export default function useClickOutside(targetRef, onClickOutside) {
  const handlerRef = useRef(onClickOutside);

  useEffect(() => {
    handlerRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    const listener = (event) => {
      if (!targetRef.current || targetRef.current.contains(event.target)) return;
      handlerRef.current(event);
    };

    document.addEventListener('click', listener, true);
    return () => document.removeEventListener('click', listener, true);
  }, [targetRef]);
}
