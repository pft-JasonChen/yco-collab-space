import { useEffect, useRef, useState } from 'react';
import styles from './CellActions.module.scss';
import SheetIcon from './SheetIcon.jsx';

// Coarse pointers have no hover, so the More control cannot be revealed by one.
const COARSE_QUERY = '(pointer: coarse)';

function MoreGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="4" cy="9" r="1.5" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

function DownloadGlyph() {
  return <SheetIcon name="download" />;
}

/**
 * Action cluster for a gallery cell, ported from RD's
 * my-gallery-page/tabs/gallery/components/cell-actions.
 *
 * This is the piece that makes an on-photo control readable: Download and More
 * share one rounded pill with a translucent dark ground and white glyphs, so
 * the icons stay legible over any thumbnail. A generic transparent menu trigger
 * does not — which is how this component came to be extracted.
 *
 * The menu is RD's own dark glass overlay rather than the catalogued
 * dropdown-select: it sits over a photo, not in a toolbar, and the two are
 * deliberately different visual languages in production. Grouping is the one
 * addition, so a consumer can separate intents without a second component.
 *
 * @param {object} props
 * @param {() => void} [props.onDownload]   omit to hide the download button
 * @param {{key: string, label: string, icon?: 'download'|'retry'|'edit'|'delete',
 *          onSelect: () => void, danger?: boolean, groupLabel?: string,
 *          dividerBefore?: boolean}[]} [props.menuItems]
 * @param {string} [props.downloadLabel]    accessible name for the download button
 * @param {string} [props.moreLabel]        accessible name for the more button
 * @param {string} [props.menuTestId]       consumer's own hook on the open menu
 * @param {string} [props.testId]           consumer's own hook on the more button
 * @param {string} [props.className]
 */
export default function CellActions({
  onDownload,
  menuItems = [],
  downloadLabel = 'Download',
  moreLabel = 'More actions',
  menuTestId,
  testId,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const rootRef = useRef(null);
  const hasMenu = menuItems.length > 0;
  // A lone icon sits with symmetric padding — the extra left inset only makes
  // sense for the Download-to-More grouping.
  const single = (onDownload ? 1 : 0) + (hasMenu ? 1 : 0) <= 1;

  // Read after mount so a server render never assumes a pointer type.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(COARSE_QUERY);
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // RD dismisses on mousedown; the capture phase is used here so a menu inside
  // another click handler (a selectable cell) closes before that handler runs.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('click', onDown, true);
    return () => document.removeEventListener('click', onDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function run(item) {
    setOpen(false);
    item.onSelect?.();
  }

  const blocks = [];
  menuItems.forEach((item) => {
    const starts = blocks.length === 0 || item.groupLabel || item.dividerBefore;
    if (starts) {
      blocks.push({
        key: `${item.key}-block`,
        label: item.groupLabel,
        dividerBefore: Boolean(item.dividerBefore),
        items: [],
      });
    }
    blocks[blocks.length - 1].items.push(item);
  });

  return (
    <div
      ref={rootRef}
      className={[styles.root, single ? styles.single : '', className]
        .filter(Boolean)
        .join(' ')}
      data-component-role="cell-actions"
      data-coarse={coarse ? 'true' : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      {onDownload && (
        <button
          type="button"
          className={styles.iconButton}
          aria-label={downloadLabel}
          onClick={onDownload}
          data-testid="cell-action-download"
        >
          <DownloadGlyph />
        </button>
      )}

      {hasMenu && (
        <button
          type="button"
          className={`${styles.iconButton} ${open ? styles.iconButtonActive : ''}`}
          aria-label={moreLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          data-testid={testId}
        >
          <MoreGlyph />
        </button>
      )}

      {hasMenu && (
        <div className={styles.menu} role="menu" data-testid={menuTestId} hidden={!open}>
          {blocks.map((block) => (
            <div
              key={block.key}
              className={styles.block}
              role={block.label ? 'group' : 'presentation'}
              aria-label={block.label || undefined}
              data-divider={block.dividerBefore ? 'true' : undefined}
            >
              {block.label && (
                <div
                  className={styles.groupLabel}
                  data-component-role="cell-actions-group"
                  aria-hidden="true"
                >
                  {block.label}
                </div>
              )}
              {block.items.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={styles.menuItem}
                  data-option-key={item.key}
                  data-destructive={item.danger ? 'true' : undefined}
                  data-menu-position={
                    index === block.items.length - 1 && block === blocks[blocks.length - 1]
                      ? 'last'
                      : undefined
                  }
                  onClick={() => run(item)}
                >
                  {item.icon && <SheetIcon name={item.icon} />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
