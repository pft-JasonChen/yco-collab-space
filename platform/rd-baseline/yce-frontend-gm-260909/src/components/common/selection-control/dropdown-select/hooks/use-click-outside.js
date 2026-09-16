import { useEffect, useRef } from 'react';

/**
 * Hook that handles click events outside of a referenced element.
 *
 * @param {React.RefObject} targetRef - A React ref object pointing to the element to detect clicks outside of
 * @param {function(MouseEvent): void} onClickOutside - Callback function to execute when a click outside the element is detected
 * @returns {void}
 *
 * @example
 * const ref = useRef(null);
 * useClickOutside(ref, () => setIsOpen(false));
 */
const useClickOutside = (targetRef, onClickOutside) => {
  const handlerRef = useRef(onClickOutside);

  useEffect(() => {
    handlerRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    const listener = (event) => {
      if (!targetRef.current || targetRef.current.contains(event.target)) {
        return;
      }
      handlerRef.current(event);
    };

    document.addEventListener('click', listener, true);
    return () => {
      document.removeEventListener('click', listener, true);
    };
  }, [targetRef]);
};

export default useClickOutside;
