import { forwardRef, useRef } from 'react';
import DragScrollWrapper from './DragScrollWrapper.jsx';
import styles from './GalleryTabs.module.scss';

/**
 * One gallery tab, ported from RD's my-gallery-page/components/tab.
 *
 * RD calls `getTranslationFunction()` inside and receives a key. A shared
 * component never translates internally, so `label` is the already-resolved
 * string and the consumer owns the key.
 */
export const GalleryTab = forwardRef(function GalleryTab(
  { tabKey, label, isActive = false, onClick, showRedDot = false },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[styles.tab, isActive ? styles.activeTab : null].filter(Boolean).join(' ')}
      onClick={() => onClick?.(tabKey)}
      aria-current={isActive ? 'page' : undefined}
      data-component-role="gallery-tab"
      data-tab-key={tabKey}
    >
      {label}
      {showRedDot && <span className={styles.redDot} data-testid="gallery-tab-red-dot" />}
    </button>
  );
});

/**
 * The gallery's level-one tab row: a horizontally draggable strip of tabs.
 *
 * A drag that scrolls the row must not also switch tab, so the row swallows the
 * click that ends a drag — RD's own gallery does this by checking the wrapper's
 * `moved` flag before calling its tab handler, and that check lives here rather
 * than in every consumer.
 *
 * @param {object} props
 * @param {{key: string, label: string, showRedDot?: boolean}[]} props.tabs
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onTabChange
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export default function GalleryTabs({ tabs, activeKey, onTabChange, ariaLabel, className }) {
  const scrollRef = useRef(null);

  return (
    <nav
      className={[styles.tabRow, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-component-role="gallery-tab-row"
      data-drag-scroll="true"
    >
      <DragScrollWrapper
        ref={scrollRef}
        wrapperClass={styles.track}
        enableDrag={{ x: true, y: false }}
      >
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <GalleryTab
              key={tab.key}
              tabKey={tab.key}
              label={tab.label}
              isActive={tab.key === activeKey}
              showRedDot={tab.showRedDot}
              onClick={(key) => {
                // Suppress the click that terminates a flick.
                if (scrollRef.current?.moved) return;
                onTabChange?.(key);
              }}
            />
          ))}
        </div>
      </DragScrollWrapper>
      <div className={styles.indicatorBottom} />
    </nav>
  );
}

export { DragScrollWrapper };
