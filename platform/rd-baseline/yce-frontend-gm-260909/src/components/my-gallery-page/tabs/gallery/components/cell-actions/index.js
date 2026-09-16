import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './index.module.scss';
import BottomSheet from './bottom-sheet';
import SheetIcon from './sheet-icons';
import useWindowDevice from '@/hooks/use-window-device';
import { getTranslationFunction } from '@/i18n';

/**
 * Action cluster for a gallery cell.
 *
 * Desktop: an optional Download button + a More button whose dropdown lists
 * per-tab actions (Retry/Delete for video, Edit Image/Delete for images),
 * revealed on cell hover. Mobile (touch, no hover): a single always-visible
 * More icon that opens a bottom action sheet with Download folded in.
 *
 * @param {object} props
 * @param {() => void} [props.onDownload]  omit to hide Download
 * @param {{label: string, onClick: () => void, danger?: boolean}[]} props.menuItems
 */
export default function CellActions({ onDownload, menuItems = [] }) {
  const { t } = getTranslationFunction();
  const { isDesktop } = useWindowDevice();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);
  const hasMenu = menuItems.length > 0;
  // A grouped pill with a single icon (e.g. AI Agent: Download only, no More)
  // centers it with symmetric padding instead of the Download→More left inset.
  const singleAction = (onDownload ? 1 : 0) + (hasMenu ? 1 : 0) <= 1;

  useEffect(() => {
    // outside-click dismissal is only for the desktop dropdown; the mobile
    // sheet closes via its own backdrop
    if (!menuOpen || !isDesktop) return;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen, isDesktop]);

  const runAndClose = (fn) => () => {
    setMenuOpen(false);
    fn?.();
  };

  const moreButton = (
    <button
      type="button"
      className={`${styles.iconBtn} ${menuOpen ? styles.iconBtnActive : ''}`}
      aria-label="more"
      onClick={() => setMenuOpen((o) => !o)}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="4" cy="9" r="1.5" fill="currentColor" />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );

  if (!isDesktop) {
    // No menu items (e.g. download-only cells): show a direct download icon
    // instead of the More sheet (mobile otherwise folds download into the sheet).
    if (!hasMenu) {
      return onDownload ? (
        <div className={styles.root}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t('header.items.download')}
            onClick={onDownload}
          >
            <img src="/assets/images/icon_download_w.svg" alt="" />
          </button>
        </div>
      ) : null;
    }
    const sheetItems = [
      ...(onDownload
        ? [
            {
              label: t('header.items.download'),
              icon: 'download',
              onClick: onDownload,
            },
          ]
        : []),
      ...menuItems,
    ];
    return (
      <div className={styles.root}>
        {moreButton}
        <BottomSheet
          opened={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={t('result.features.panel.button.more')}
          items={sheetItems}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} ${styles.grouped} ${
        singleAction ? styles.single : ''
      }`}
      ref={rootRef}
    >
      {onDownload && (
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={t('header.items.download')}
          onClick={onDownload}
        >
          <img src="/assets/images/icon_download_w.svg" alt="" />
        </button>
      )}

      {hasMenu && moreButton}

      {menuOpen && hasMenu && (
        <div className={styles.menu}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.menuItem} ${
                item.danger ? styles.danger : ''
              }`}
              onClick={runAndClose(item.onClick)}
            >
              <SheetIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

CellActions.propTypes = {
  onDownload: PropTypes.func,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      danger: PropTypes.bool,
    })
  ).isRequired,
};
