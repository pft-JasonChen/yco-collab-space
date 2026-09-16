import { useLayoutEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useResizeObserver as useResizeObserver } from './adapters.jsx';
import styles from './CategoryBasket.module.scss';
import { getTranslationFunction } from './adapters.jsx';
import { msrUtils as msrUtils } from './adapters.jsx';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _flatMap from 'lodash/flatMap';
import _keyBy from 'lodash/keyBy';
import { sideBarMenuUtils as sideBarMenuUtils } from './adapters.jsx';
import { useCommonFunction as useCommonFunction } from './adapters.jsx';
import { getHotNewFlagsFromGridItem } from './hot-new-tag-utils.js';
import { isLinkValid } from './adapters.jsx';
import { LinkWithLocale as LinkWithLocale } from './adapters.jsx';
import { useWindowDevice as useWindowDevice } from './adapters.jsx';

// Layout constants — keep in sync with SCSS
const ITEM_MIN_WIDTH = 82; // .item min-width (desktop)
const ITEM_MIN_WIDTH_NARROW_DESKTOP = 81; // 1201-1204px: keep four items side by side
const ITEM_MIN_WIDTH_SM = 61; // .item min-width (≤1200px)
const ITEM_GAP = 12; // .grid gap
const ITEM_GAP_SM = 8; // .grid gap (≤1200px)
const PANEL_GAP = 16; // .wrapper gap
const MAX_COLS = 5;
const MIN_COLS = 4; // fewer than this → stack panels vertically
const PANEL_COUNT = 2; // always two panels (AI Photo / AI Video)

export default function CategoryBasket({
  filteredSections,
  homepageLayoutConfig = null,
  tabHot,
  tabNew,
} = {}) {
  const [cols, setCols] = useState(MAX_COLS);
  const [isStacked, setIsStacked] = useState(false);

  const wrapperRef = useRef(null);
  const probeRef = useRef(null);
  const stackedProbeRef = useRef(null);

  const { getProductImageSrc } = useCommonFunction();
  const { locale } = getTranslationFunction();
  const { windowWidth, isMeasured, is1200 } = useWindowDevice();
  const isNarrowDesktop = windowWidth >= 1201 && windowWidth <= 1204;

  const checkLayout = useCallback(() => {
    if (!probeRef.current || !stackedProbeRef.current) return;

    // Read responsive item min-width — matches SCSS rwd-custom($width-1200)
    const itemMinWidth = is1200
      ? ITEM_MIN_WIDTH_SM
      : isNarrowDesktop
      ? ITEM_MIN_WIDTH_NARROW_DESKTOP
      : ITEM_MIN_WIDTH;

    const itemGap = is1200 ? ITEM_GAP_SM : ITEM_GAP;

    const calcCols = (probeEl) => {
      const style = getComputedStyle(probeEl);
      const paddingX =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const gridWidth = probeEl.clientWidth - paddingX;

      return Math.min(
        MAX_COLS,
        Math.floor((gridWidth + itemGap) / (itemMinWidth + itemGap))
      );
    };

    // probeRef is always side-by-side → tells us if we need to stack
    const sideBySideCols = calcCols(probeRef.current);

    if (sideBySideCols >= MIN_COLS) {
      setIsStacked(false);
      setCols(sideBySideCols);
    } else {
      // Stacked: each panel takes full wrapper width → more cols may fit
      const stackedCols = calcCols(stackedProbeRef.current);
      setIsStacked(true);
      setCols(Math.max(stackedCols, MIN_COLS));
    }
  }, [is1200, isNarrowDesktop]);

  useResizeObserver({
    targetRef: wrapperRef,
    onResize: checkLayout,
  });

  // Run once before first paint so the initial render already has the correct
  // cols/isStacked — prevents layout shift on hydration.
  // useLayoutEffect is client-only (SSR falls back to the useState defaults).
  useLayoutEffect(() => {
    checkLayout();
  }, [checkLayout]);

  // Derive translated panels from CMS data.
  // Each panel has a name_key; msrUtils.translateWithKey resolves it to `name`
  // using the translations array and current locale.
  // Item titles come from filteredSections (strapi gridModule), matched by link.
  const displayGroups = useMemo(() => {
    const sections = _get(homepageLayoutConfig, 'sections', []);
    const translations = _get(homepageLayoutConfig, 'translations', []);
    const lang = msrUtils.convertMsrLanguageType(locale);
    const rawPanels = _get(sections, '[0].panels', []);

    // Build a flat link → gridModule item lookup from filteredSections
    const allGridItems = _flatMap(filteredSections, (section) =>
      _get(section, 'gridModule', [])
    );
    const gridItemByLink = _keyBy(allGridItems, 'link');

    return _map(rawPanels, (panel) => {
      const translated = msrUtils.translateWithKey(panel, translations, lang);
      return {
        id: panel.panel_id,
        label: translated.name,
        items: _map(
          panel.items.filter((item) => isLinkValid(item.link)),
          (item) => {
            const gridItem = _get(gridItemByLink, item.link, {});
            const productMapKey = sideBarMenuUtils.convertUrlToKey(item.link);
            const { isHot, isNew } = getHotNewFlagsFromGridItem(gridItem);
            return {
              ...item,
              id: item.tool_id,
              title: _get(gridItem, 'title', item.tool_id),
              icon: _get(gridItem, 'icon', null),
              isHot,
              isNew,
              productMapKey,
            };
          }
        ),
      };
    });
  }, [homepageLayoutConfig, locale, filteredSections]);

  // While config is loading, render placeholder panels so the space is already
  // reserved — no layout shift when real data arrives.
  const renderGroups =
    displayGroups.length > 0
      ? displayGroups
      : Array.from({ length: PANEL_COUNT }, (_, i) => ({
          id: `skeleton-${i}`,
          label: '',
          skeleton: true,
          items: Array.from({ length: cols }, (_, j) => ({
            id: `sk-${i}-${j}`,
          })),
        }));

  const renderItemTags = (item, positionClass) => {
    return (
      <>
        {item.isHot && tabHot && (
          <img
            className={`${styles.hot} ${positionClass}`}
            src={tabHot.data.attributes.url}
            alt="Hot"
            loading="lazy"
          />
        )}
        {item.isNew && tabNew && (
          <img
            className={`${styles.new} ${positionClass}`}
            src={tabNew.data.attributes.url}
            alt="New"
            loading="lazy"
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.root}>
      {/* ── Hidden probe (side-by-side) ───────────────────────────────────────
          Always flex-direction: row. probeRef measures natural panel width
          to decide whether to stack.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'row',
          gap: `${PANEL_GAP}px`,
          width: '100%',
          top: 0,
          left: 0,
        }}
      >
        <div ref={probeRef} className={styles.panel} />
        <div className={styles.panel} />
      </div>

      {/* ── Hidden probe (stacked) ────────────────────────────────────────────
          Single full-width panel. stackedProbeRef measures how many cols
          fit when panels are stacked vertically.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '100%',
          top: 0,
          left: 0,
        }}
      >
        <div ref={stackedProbeRef} className={styles.panel} />
      </div>

      <div
        ref={wrapperRef}
        className={`${styles.wrapper} ${isStacked ? styles.stacked : ''}`}
        data-layout-measured={isMeasured ? 'true' : 'false'}
      >
        {renderGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className={`${styles.panel} ${
              group.skeleton ? styles.panelSkeleton : ''
            } ${groupIndex === 0 ? styles.panelFirst : styles.panelSecond}`}
          >
            {/* Panel header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelLabel}>{group.label}</div>
            </div>

            {/* Item grid — only render up to `cols` items */}
            <div
              className={styles.grid}
              style={isMeasured ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}
            >
              {(group.skeleton ? group.items : group.items.slice(0, cols)).map(
                (item) => {
                  if (group.skeleton) {
                    return (
                      <div
                        key={item.id}
                        className={`${styles.item} ${styles.itemSkeleton}`}
                      >
                        <div className={styles.itemIcon} />
                        <div className={styles.itemTitle} />
                      </div>
                    );
                  }
                  const iconImage = _get(
                    item,
                    'icon.data.attributes.url',
                    null
                  );
                  if (!iconImage) return null;
                  return (
                    <LinkWithLocale
                      key={item.id}
                      href={item.link}
                      className={styles.item}
                    >
                      <div className={styles.itemIcon}>
                        <img
                          className={styles.itemIconImg}
                          src={
                            iconImage || getProductImageSrc(item.productMapKey)
                          }
                          draggable={false}
                          alt=""
                        />
                        {renderItemTags(item, styles.inIcon)}
                      </div>
                      <div className={styles.itemTitle}>
                        <span className={`text-truncate-2`}>{item.title}</span>
                      </div>
                      {renderItemTags(item, styles.outsideIcon)}
                    </LinkWithLocale>
                  );
                }
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
