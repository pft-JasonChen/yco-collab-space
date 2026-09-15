import { useEffect, useRef, useState } from 'react';
import styles from './CategoryRail.module.scss';

/**
 * External-link glyph, ported from RD's common/headers/components/external-link.
 *
 * RD passes the colour as a JS prop default (`color = '#11181A'`, opacity .65),
 * which is a literal the SCSS token policy never sees. It is `currentColor`
 * here so the glyph follows the row's own colour — including the brand colour a
 * selected or focused row takes — instead of pinning a hex the validator cannot
 * check.
 */
function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillOpacity=".65"
        d="M1 9.5v-7A1.5 1.5 0 0 1 2.5 1h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 1 0v3A1.5 1.5 0 0 1 9.5 11h-7A1.5 1.5 0 0 1 1 9.5m10-5a.5.5 0 0 1-1 0V2.707L6.354 6.354a.5.5 0 1 1-.708-.708L9.293 2H7.5a.5.5 0 0 1 0-1h3a.5.5 0 0 1 .5.5z"
      />
    </svg>
  );
}

/**
 * The tool-category sidebar, ported from RD's strapi gridmodulesection
 * homeCategory.
 *
 * RD's component is a page container: it builds its own items from CMS sections
 * plus hard-coded routes, and reads next/router, two redux slices, sessionStorage
 * and four hooks to decide what is selected. None of that can travel into a
 * shared library, so the split is: the consumer resolves `items` and `activeKey`
 * and owns every navigation side effect, and this component owns the rail's
 * markup, styling, roving-tabindex keyboard model and selected/hover states.
 *
 * @param {object} props
 * @param {{key: string, label: string, icon?: string, iconName?: string,
 *          isNew?: boolean, external?: boolean, dividerBefore?: boolean,
 *          gradient?: boolean}[]} props.items
 * @param {string} [props.activeKey]
 * @param {(key: string) => void} [props.onSelect]
 * @param {string} [props.ariaLabel]
 * @param {React.ReactNode} [props.leading]  slot above the list (RD puts its Start Editing button here)
 * @param {boolean} [props.compact]  RD's <=992px icon-over-label treatment
 * @param {string} [props.newLabel]  text of the NEW badge
 * @param {string} [props.className]
 */
export default function CategoryRail({
  items,
  activeKey,
  onSelect,
  ariaLabel = 'Categories',
  leading,
  compact = false,
  newLabel = 'NEW',
  className,
}) {
  const activeIdx = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );
  const [focusIdx, setFocusIdx] = useState(activeIdx);
  const refs = useRef([]);

  // Keep the roving tabindex on the selected row when selection changes from
  // outside, so tabbing back into the rail lands on what is actually current.
  useEffect(() => setFocusIdx(activeIdx), [activeIdx]);

  // RD moves focus itself after an arrow key; without this the tabindex moves
  // but the caret does not.
  useEffect(() => {
    const node = refs.current[focusIdx];
    if (node && node.ownerDocument.activeElement !== node) {
      const withinRail = refs.current.includes(node.ownerDocument.activeElement);
      if (withinRail) node.focus();
    }
  }, [focusIdx]);

  const onKeyDownList = (event) => {
    if (!items.length) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      setFocusIdx((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      setFocusIdx((i) => (i + 1) % items.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setFocusIdx(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setFocusIdx(items.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(items[focusIdx]?.key);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={[styles.rail, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDownList}
      data-component-role="category-rail"
      data-compact={String(compact)}
    >
      <div className={styles.scroller}>
        {leading}
        {/* flatMap with explicit keys rather than a keyed Fragment: a divider
            and its row are two siblings in one list, and keying them
            individually keeps React's reconciliation unambiguous. */}
        {items.flatMap((item, index) => {
          const selected = item.key === activeKey;
          const nodes = [];
          if (item.dividerBefore) {
            nodes.push(
              <div className={styles.dividerContainer} key={`${item.key}-divider`}>
                <hr className={styles.divider} />
              </div>,
            );
          }
          nodes.push(
              <button
                key={item.key}
                type="button"
                ref={(element) => {
                  refs.current[index] = element;
                }}
                tabIndex={index === focusIdx ? 0 : -1}
                className={styles.item}
                onClick={() => onSelect?.(item.key)}
                data-selected={String(selected)}
                data-key={item.key}
                data-gradient={item.gradient ? 'true' : undefined}
                aria-current={selected ? 'page' : undefined}
              >
                {item.iconName ? (
                  <i
                    className={`${styles.iconFont} icon-${item.iconName}`}
                    aria-hidden="true"
                    data-selected={String(selected)}
                  />
                ) : (
                  <span className={styles.iconFont}>
                    <img
                      className={styles.icon}
                      data-selected={String(selected)}
                      src={item.icon}
                      width="20"
                      height="20"
                      loading="lazy"
                      alt=""
                    />
                  </span>
                )}
                <span className={styles.text} data-gradient={item.gradient ? 'true' : undefined}>
                  {item.label}
                </span>
                {item.isNew && <span className={styles.newLabel}>{newLabel}</span>}
                {item.external && (
                  <span className={styles.externalLinkIcon}>
                    <ExternalLinkIcon />
                  </span>
                )}
              </button>,
          );
          return nodes;
        })}
        <div className={styles.hiddenHeight} />
      </div>
    </nav>
  );
}

export { ExternalLinkIcon };
