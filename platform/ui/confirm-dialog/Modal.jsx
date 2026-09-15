import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.scss';

const TRANSITION_DURATION = 400;

/**
 * Portal-rendered overlay, ported from RD's common/modal plus components/portal.
 *
 * RD mounts into a pre-existing `#portal-root` element and renders nothing when
 * it is absent. A shared component cannot assume the host page provides one, so
 * the container is created on demand and reused.
 *
 * Everything else is RD's: the double-rAF that lets a lazily-mounted dialog play
 * its enter transition, the delayed unmount that lets the exit transition
 * finish, the scale transition, and the focus management and Tab trap that
 * switch on when the caller supplies an accessible name.
 */
function usePortalRoot(elementId) {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let node = document.getElementById(elementId);
    let created = false;
    if (!node) {
      node = document.createElement('div');
      node.id = elementId;
      document.body.appendChild(node);
      created = true;
    }
    setRoot(node);
    return () => {
      if (created && node.childElementCount === 0) node.remove();
    };
  }, [elementId]);

  return root;
}

export default function Modal({
  children,
  opened = false,
  handleClose = () => {},
  customStyles,
  containerStyles = {},
  containerClassName = '',
  modalClassName = '',
  showModalScaleTransition = false,
  ariaLabel,
  ariaLabelledBy,
  onKeyDown,
  portalId = 'portal-root',
}) {
  const [delayClose, setDelayClose] = useState(false);
  const timerRef = useRef(null);
  const modalRef = useRef(null);
  const focusBeforeOpenRef = useRef(null);
  const portalRoot = usePortalRoot(portalId);

  // Lazy-mounted dialogs arrive with opened=true on their first render, so the
  // closed->opened class change never happens and the enter transition is
  // skipped. Hold the closed state until one closed frame has actually painted.
  const mountedOpenRef = useRef(opened);
  const [enterReady, setEnterReady] = useState(!opened);
  useEffect(() => {
    if (!mountedOpenRef.current) return undefined;
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
    if (!isDialog || event.defaultPrevented) return;
    // Escape closes. RD leaves this to each caller's own onKeyDown, which means
    // most of its dialogs cannot be dismissed from the keyboard at all.
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = modalRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === modalRef.current)
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
      timerRef.current = setTimeout(() => setDelayClose(false), TRANSITION_DURATION);
    } else {
      clearTimeout(timerRef.current);
      setDelayClose(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [openedEffective]);

  const containerState = openedEffective ? styles.opened : !delayClose ? styles.closed : '';
  const modalState = showModalScaleTransition
    ? [styles.modalWithScaleTransition, openedEffective ? styles.modalOpen : null]
        .filter(Boolean)
        .join(' ')
    : '';

  if (!portalRoot) return null;

  return createPortal(
    <div
      className={[styles.container, containerClassName, containerState].filter(Boolean).join(' ')}
      style={containerStyles}
      onClick={handleClose}
      data-component-role="modal-backdrop"
    >
      <div
        className={[styles.modal, modalClassName, modalState].filter(Boolean).join(' ')}
        ref={modalRef}
        style={customStyles}
        role={isDialog ? 'dialog' : undefined}
        aria-modal={isDialog ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={isDialog ? -1 : undefined}
        onKeyDown={handleModalKeyDown}
        onClick={(event) => event.stopPropagation()}
        data-component-role="modal"
      >
        {children}
      </div>
    </div>,
    portalRoot,
  );
}
