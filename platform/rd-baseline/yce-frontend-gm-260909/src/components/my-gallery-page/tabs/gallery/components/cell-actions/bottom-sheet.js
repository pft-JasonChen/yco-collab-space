import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './bottom-sheet.module.scss';
import SheetIcon from './sheet-icons';
import Portal from '@/components/portal';

/**
 * Mobile action sheet: a titled list of actions sliding up from the bottom,
 * following the iOS-style guideline — a "More" header with a close button and
 * one rounded pill button (icon + label) per action. Used on touch layouts
 * where the desktop hover dropdown doesn't apply. Rendered only while open
 * (one cell's sheet at a time).
 *
 * While open it locks background scroll WITHOUT shifting the page: it pins the
 * body with `position:fixed` at the current scroll offset, then restores both
 * the styles and the scroll position on close — so nothing jumps.
 *
 * @param {object} props
 * @param {boolean} props.opened
 * @param {() => void} props.onClose
 * @param {string} props.title  sheet header label
 * @param {{label: string, icon?: string, onClick: () => void, danger?: boolean}[]} props.items
 */
export default function BottomSheet({ opened, onClose, title, items }) {
  // Stay mounted through the leave animation: `opened` drives the enter/leave
  // classes, `mounted` keeps the DOM until the slide-down finishes.
  const [mounted, setMounted] = useState(opened);

  useEffect(() => {
    if (opened) setMounted(true);
  }, [opened]);

  useEffect(() => {
    if (!opened) return undefined;
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [opened]);

  if (!mounted) return null;

  return (
    <Portal elementId="portal-root">
      <div
        className={`${styles.backdrop} ${opened ? styles.enter : styles.leave}`}
        onClick={onClose}
      >
        <div
          className={`${styles.sheet} ${opened ? styles.enter : styles.leave}`}
          onClick={(e) => e.stopPropagation()}
          onAnimationEnd={() => {
            if (!opened) setMounted(false);
          }}
        >
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="close"
              onClick={onClose}
            >
              <img src="/assets/images/icon_close.svg" alt="" />
            </button>
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              onClick={() => {
                onClose();
                item.onClick?.();
              }}
            >
              <SheetIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Portal>
  );
}

BottomSheet.propTypes = {
  opened: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      danger: PropTypes.bool,
    })
  ).isRequired,
};
