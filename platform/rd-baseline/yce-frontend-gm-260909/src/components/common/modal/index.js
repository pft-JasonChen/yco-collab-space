import { useEffect, useState, useRef } from 'react';
import styles from './index.module.scss';
import Portal from '@/components/portal';
import { v4 as uuidv4 } from 'uuid';

const TRANSITION_DURATION = 400;

export default function Modal(props) {
  const [delayClose, setDelayClose] = useState(false);
  const timerRef = useRef(null);
  const modalRef = useRef(null);
  const focusBeforeOpenRef = useRef(null);

  const {
    children,
    opened = false,
    handleClose = () => {},
    customStyles,
    containerStyles = {},
    containerClassName = '',
    modalClassName = '',
    showModalScaleTransition = false,
    hiddenHeader = false,
    ariaLabel,
    ariaLabelledBy,
    onKeyDown,
  } = props;

  // Lazy-mounted dialogs arrive with opened=true on their first render, so the
  // closed->opened class change never happens and the enter transition is skipped.
  // Hold the closed state until one closed frame has actually painted (double rAF).
  const mountedOpenRef = useRef(opened);
  const [enterReady, setEnterReady] = useState(!opened);
  useEffect(() => {
    if (!mountedOpenRef.current) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEnterReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);
  const openedEffective = opened && enterReady;
  const isDialog = Boolean(ariaLabel || ariaLabelledBy);

  useEffect(() => {
    if (!isDialog) return undefined;
    if (openedEffective) {
      focusBeforeOpenRef.current = document.activeElement;
      const frame = requestAnimationFrame(() => modalRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    if (focusBeforeOpenRef.current?.focus) {
      focusBeforeOpenRef.current.focus();
      focusBeforeOpenRef.current = null;
    }
    return undefined;
  }, [isDialog, openedEffective]);

  const handleModalKeyDown = (event) => {
    onKeyDown?.(event);
    if (!isDialog || event.defaultPrevented || event.key !== 'Tab') return;
    const focusable = modalRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === modalRef.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!openedEffective) {
      timerRef.current = setTimeout(
        () => setDelayClose(false),
        TRANSITION_DURATION
      );
    } else {
      clearTimeout(timerRef.current);
      setDelayClose(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [openedEffective]);

  const getStyles = () => {
    if (openedEffective) {
      return styles.opened;
    } else if (!delayClose) {
      return styles.closed;
    }
    return;
  };

  const getModalStyles = () =>
    showModalScaleTransition &&
    (openedEffective
      ? `${styles.modalOpen} ${styles.modalWithScaleTransition}`
      : styles.modalWithScaleTransition);

  return (
    <Portal elementId={'portal-root'}>
      <div
        className={`${styles.container} ${containerClassName} ${getStyles()} `}
        style={containerStyles}
        onClick={handleClose}
      >
        <div
          className={`${styles.modal} ${modalClassName} ${getModalStyles()}`}
          ref={modalRef}
          style={customStyles}
          role={isDialog ? 'dialog' : undefined}
          aria-modal={isDialog ? true : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          tabIndex={isDialog ? -1 : undefined}
          onKeyDown={handleModalKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
