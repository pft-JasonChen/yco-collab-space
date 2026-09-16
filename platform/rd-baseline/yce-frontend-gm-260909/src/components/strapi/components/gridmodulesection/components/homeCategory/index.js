import styles from './index.module.scss';
import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo,
  Fragment,
  useCallback,
} from 'react';
import categoryNameUtils from '../../utils/category-name-utils';
import routerUtils from '@/utils/routerUtils';
import sessionStorageUtils from '@/utils/sessionStorageUtils';
import { sessionStorageTypes } from '@/types/sessionStorageTypes';
import { useRouter } from 'next/router';
import useWindowWidth from '@/hooks/use-window-width';
import { useSelector, useDispatch } from 'react-redux';
import useHeaderGeneral from '@/components/common/headers/hooks/use-header-general';
import { setCurrentSectionId } from '@/store/actions/homeCategoryAction';
import {
  setHeaderMenuOpened,
  setLoginModalOpen,
} from '@/store/actions/uiAction';
import useShowContest from '@/hooks/header/use-show-contest';
import useUserStatus from '@/hooks/use-user-status';
import StartEditingButton from './start-editing-button';
import GalleryPickerModal from './gallery-picker-modal';
import ExternalLink from '@/components/common/headers/components/external-link';
import NewLabel from '@/components/common/headers/components/new-label';
import { getTranslationFunction } from '@/i18n';

// Fixed header height (see header index.module.scss .containerScroll) — the
// sidebar sticks here once scrolled past whatever sits above it (e.g. the CMS
// feature banner), instead of freezing at its initial pushed-down offset.
const HEADER_HEIGHT = 64;

// This page is statically prerendered (next export), so plain useLayoutEffect
// would warn on the server build. Fall back to useEffect there, same pattern
// as result-page/index.js.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function HomeCategory(props) {
  const {
    sections = [],
    getCategoryName,
    onSectionSelect,
    scrollToTop,
    isHeaderPortal = false,
    isMobileLandscape = false,
  } = props;

  const router = useRouter();
  const { width } = useWindowWidth();
  const { currentSectionId } = useSelector((state) => state.homeCategory);
  const { isHomePage, isAiAgentPage } = useHeaderGeneral();
  const { showContest } = useShowContest();
  const { isLoginUser } = useUserStatus();
  const dispatch = useDispatch();
  const { locale } = getTranslationFunction();

  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [isStartEditingDropdownOpen, setIsStartEditingDropdownOpen] =
    useState(false);

  const handleOpenGalleryPicker = useCallback(() => {
    setIsGalleryPickerOpen(true);
  }, []);

  const handleCloseGalleryPicker = useCallback(() => {
    setIsGalleryPickerOpen(false);
  }, []);

  const handleGalleryFileSelected = useCallback(() => {
    dispatch(setHeaderMenuOpened(false));
  }, [dispatch]);

  const safeGetName = useMemo(
    () => getCategoryName ?? ((s) => s),
    [getCategoryName]
  );

  const isIpadLayout = !isHeaderPortal && width > 768 && width <= 992;

  const timeoutsRef = useRef([]);
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  // The sidebar is position:fixed with no top set, so it freezes at whatever
  // static offset it happened to have on mount (header + feature banner, if
  // shown). That offset never shrinks as the page scrolls, leaving a blank
  // gap above the sidebar once the banner scrolls out of view. Track the live
  // top of the in-flow grid module container instead, so the sidebar sticks
  // to the header once its natural position would scroll above it.
  const navRef = useRef(null);
  useIsomorphicLayoutEffect(() => {
    if (isHeaderPortal || isMobileLandscape) return;

    const gridContainer = document.getElementById(
      'YCE-gridmodulesection-container'
    );
    if (!navRef.current || !gridContainer) return;

    const syncTop = () => {
      const { top } = gridContainer.getBoundingClientRect();
      navRef.current.style.top = `${Math.max(HEADER_HEIGHT, top)}px`;
    };

    syncTop();
    window.addEventListener('scroll', syncTop, { passive: true });
    window.addEventListener('resize', syncTop);

    // Layout above the grid container can also shift without a scroll/resize
    // event firing: the feature banner's show/hide decision resolves
    // asynchronously (waiting on the login check) after this effect's first
    // syncTop() call, and closing it animates via CSS max-height transition.
    // A ResizeObserver on document.body won't catch either case — body has
    // height:100% (see globals.css), so its own box never resizes even as
    // in-flow content above the grid container grows/shrinks and overflows
    // it. Watch for the underlying DOM mutation instead, then keep
    // re-measuring for the duration of the CSS transition.
    let rafId = null;
    const pollDuringTransition = () => {
      const start = performance.now();
      const tick = (now) => {
        syncTop();
        rafId = now - start < 500 ? requestAnimationFrame(tick) : null;
      };
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    };

    const mutationObserver = new MutationObserver(pollDuringTransition);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('scroll', syncTop);
      window.removeEventListener('resize', syncTop);
      mutationObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isHeaderPortal, isMobileLandscape]);

  const onScrollToTopAtHome = () => {
    const ele = document.getElementById('__next');
    if (ele) {
      ele.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onClickAPI = useCallback(
    (e) => {
      e.currentTarget.blur();
      const path =
        !locale || locale === 'en-us'
          ? '/ai-api'
          : /*: ['ru', 'th', 'tr', 'id', 'nl', 'pl', 'vi', 'zh-cn'].includes(locale)
          ? `/ai-api`*/
            `/${locale}/ai-api`;
      window.open(path, '_blank');
    },
    [locale]
  );

  const onClickHome = useCallback(() => {
    dispatch(setCurrentSectionId(null));
    const { sectionId, ...otherQuery } = router.query;
    if (sectionId) routerUtils.shallowPush(router, otherQuery);
    if (!isHomePage) {
      if (isAiAgentPage && !isLoginUser) {
        dispatch(setLoginModalOpen(true));
      } else {
        routerUtils.push(router, isLoginUser ? '/home' : '/');
      }
    } else {
      scrollToTop?.();
      onScrollToTopAtHome();
    }
  }, [dispatch, router, isHomePage, scrollToTop, isAiAgentPage, isLoginUser]);

  const items = useMemo(() => {
    const baseHome = [
      {
        key: 'home',
        label: isIpadLayout ? '' : safeGetName('Home'),
        icon: '/assets/images/header/icon_home.svg',
        iconName: 'ic-home',
        onSelect: onClickHome,
      },

      {
        key: 'ai-agent',
        label: safeGetName('AI Agent'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('AI Agent'),
        iconName: categoryNameUtils.getCategoryNameMappingIconFont('AI Agent'),
        isNew: true,
        onSelect: () => {
          sessionStorageUtils.setItem(
            sessionStorageTypes.copilot.source,
            'home'
          );
          routerUtils.push(router, '/agent');
        },
      },
      ...sections.map((section) => ({
        key: `section-${section.id}`,
        label: safeGetName(section.categoryName ?? ''),
        icon: categoryNameUtils.getCategoryNameMappingIcon(
          section.categoryName
        ),
        iconName: categoryNameUtils.getCategoryNameMappingIconFont(
          section.categoryName
        ),
        onSelect: () => onSectionSelect?.(section.id),
        categoryName: section?.categoryName,
        id: section?.id,
      })),
      {
        key: 'gallery',
        label: safeGetName('My Gallery'),
        icon: '/assets/images/header/icon_gallery.svg',
        iconName: categoryNameUtils.getCategoryNameMappingIconFont('Gallery'),
        onSelect: () => routerUtils.push(router, '/account/gallery'),
      },
      {
        key: 'video-template',
        label: safeGetName('Video Template'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('Video Template'),
        iconName:
          categoryNameUtils.getCategoryNameMappingIconFont('Video Template'),
        onSelect: () => {
          routerUtils.push(router, '/products/video-template/result-photo');
        },
      },
      {
        key: 'image-template',
        label: safeGetName('Image Template'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('Image Template'),
        iconName:
          categoryNameUtils.getCategoryNameMappingIconFont('Image Template'),
        onSelect: () => {
          routerUtils.push(router, '/products/ai-photo-combiner/result-photo');
        },
      },
      {
        key: 'contest',
        label: safeGetName('Contest'),
        icon: '/assets/images/header/youcam-ai-contest.png',
        iconName: null,
        onSelect: () => routerUtils.push(router, '/contest'),
      },
    ];
    const baseGallery = [
      {
        key: 'home',
        label: isIpadLayout ? '' : safeGetName('Home'),
        icon: '/assets/images/header/icon_home.svg',
        iconName: 'ic-home',
        onSelect: onClickHome,
      },
      {
        key: 'ai-agent',
        label: safeGetName('AI Agent'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('AI Agent'),
        iconName: categoryNameUtils.getCategoryNameMappingIconFont('AI Agent'),
        isNew: true,
        onSelect: () => {
          sessionStorageUtils.setItem(
            sessionStorageTypes.copilot.source,
            'home'
          );
          routerUtils.push(router, '/agent');
        },
      },
      ...sections.map((section) => ({
        key: `section-${section.id}`,
        label: safeGetName(section.categoryName ?? ''),
        icon: categoryNameUtils.getCategoryNameMappingIcon(
          section.categoryName
        ),
        iconName: categoryNameUtils.getCategoryNameMappingIconFont(
          section.categoryName
        ),
        onSelect: async () => {
          if (isAiAgentPage && !isLoginUser) {
            dispatch(setLoginModalOpen(true));
            return;
          }
          await routerUtils.push(router, isLoginUser ? '/home' : '/', {
            // CMS section IDs can change when a category is republished. Use
            // the stable category name across pages, then let Home resolve it
            // to the current CMS section ID before scrolling.
            sectionId: section.categoryName || section.id,
          });
          /*           const t1 = setTimeout(() => {
            const el = document.getElementById(
              `yce-gridmodule-section-${section.id}`
            );
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              const t2 = setTimeout(() => {
                const retry = document.getElementById(
                  `yce-gridmodule-section-${section.id}`
                );
                if (retry) retry.scrollIntoView({ behavior: 'smooth' });
              }, 3000);
              timeoutsRef.current.push(t2);
            }
          }, 100);
          timeoutsRef.current.push(t1); */
        },
        categoryName: section?.categoryName,
        id: section?.id,
      })),
      {
        key: 'gallery',
        label: safeGetName('My Gallery'),
        icon: '/assets/images/header/icon_gallery.svg',
        iconName: categoryNameUtils.getCategoryNameMappingIconFont('Gallery'),
        onSelect: () => {
          if (isAiAgentPage && !isLoginUser) {
            dispatch(setLoginModalOpen(true));
            return;
          }
          routerUtils.push(router, '/account/gallery');
        },
      },
      {
        key: 'video-template',
        label: safeGetName('Video Template'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('Video Template'),
        iconName:
          categoryNameUtils.getCategoryNameMappingIconFont('Video Template'),
        onSelect: () => {
          routerUtils.push(router, '/products/video-template/result-photo');
        },
      },
      {
        key: 'image-template',
        label: safeGetName('Image Template'),
        icon: categoryNameUtils.getCategoryNameMappingIcon('Image Template'),
        iconName:
          categoryNameUtils.getCategoryNameMappingIconFont('Image Template'),
        onSelect: () => {
          routerUtils.push(router, '/products/ai-photo-combiner/result-photo');
        },
      },
      {
        key: 'contest',
        label: safeGetName('Contest'),
        icon: '/assets/images/header/youcam-ai-contest.png',
        iconName: null,
        onSelect: () => routerUtils.push(router, '/contest'),
      },
    ];
    if (showContest) {
      return isHomePage ? baseHome : baseGallery;
    }
    return isHomePage
      ? baseHome.filter((v) => v.key !== 'contest')
      : baseGallery.filter((v) => v.key !== 'contest');
  }, [
    sections,
    safeGetName,
    onSectionSelect,
    isIpadLayout,
    isHomePage,
    isAiAgentPage,
    isLoginUser,
    router,
    onClickHome,
    showContest,
    dispatch,
  ]);

  const apiItems = useMemo(() => {
    const base = [
      {
        key: 'api',
        label: safeGetName('API'),
        icon: '/assets/images/header/icon_api.svg',
        iconName: 'ic-api-b',
        onSelect: onClickAPI,
      },
    ];
    return base;
  }, []);

  const [activeIdx, setActiveIdx] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);

  const refs = useRef([]);

  useEffect(() => {
    if (!items.length) {
      setActiveIdx(0);
      setFocusIdx(0);
      return;
    }
    setActiveIdx((i) => Math.min(i, items.length - 1));
    setFocusIdx((i) => Math.min(i, items.length - 1));
  }, [items.length]);

  useEffect(() => {
    const el = refs.current[focusIdx];
    if (el) el.focus();
  }, [focusIdx]);

  useEffect(() => {
    if (!items.length) return;

    if (!isHomePage) return;

    if (currentSectionId == null || currentSectionId === '') {
      if (activeIdx !== 0 || focusIdx !== 0) {
        setActiveIdx(0);
        setFocusIdx(0);
      }
      return;
    }

    const idx = items.findIndex(
      (it) => it.key === `section-${currentSectionId}`
    );
    if (idx >= 0 && (idx !== activeIdx || idx !== focusIdx)) {
      setActiveIdx(idx);
      setFocusIdx(idx);
    }
  }, [currentSectionId, items, activeIdx, focusIdx, isHomePage]);

  useEffect(() => {
    if (!router.isReady || !items.length) return;
    if (!isHomePage) {
      const isAiAgent = (router.pathname || '').includes('/agent');
      const targetKey = isAiAgent ? 'ai-agent' : 'gallery';
      const idx = items.findIndex((it) => it.key === targetKey);
      if (idx >= 0) {
        setActiveIdx(idx);
        setFocusIdx(idx);
      }
    }
  }, [
    router.isReady,
    router.pathname,
    router.asPath,
    items,
    onSectionSelect,
    router,
    isHomePage,
  ]);

  const onKeyDownList = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusIdx((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIdx((i) => (i + 1) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIdx(items.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      items[focusIdx]?.onSelect?.();
      setActiveIdx(focusIdx);
    }
  };

  const onClickTab = (idx, fn) => {
    fn?.();
    setActiveIdx(idx);
    setFocusIdx(idx);
    if (isHeaderPortal) {
      dispatch(setHeaderMenuOpened(false));
    }
  };

  return (
    <div
      ref={navRef}
      role="navigation"
      aria-label="Home Category"
      className={`${styles.leftCategoryContainer} homeCategory`}
      onKeyDown={onKeyDownList}
      data-mobile-landscape={isMobileLandscape ? 'true' : 'false'}
      data-is-header-portal={isHeaderPortal ? 'true' : 'false'}
      data-start-editing-open={isStartEditingDropdownOpen ? 'true' : 'false'}
    >
      <div className={`${!isIpadLayout ? styles.scroller : ''}`}>
        {(isHomePage || isAiAgentPage) && (
          <StartEditingButton
            handleOpenGalleryPicker={handleOpenGalleryPicker}
            isHeaderPortal={isHeaderPortal}
            onDropdownOpenChange={setIsStartEditingDropdownOpen}
          />
        )}
        {items.map((it, idx) => (
          <Fragment key={it.key}>
            {it.key === 'video-template' && (
              <div className={styles.dividerContainer}>
                <hr className={styles.divider} />
              </div>
            )}
            <button
              tabIndex={idx === focusIdx ? 0 : -1}
              ref={(el) => (refs.current[idx] = el)}
              type="button"
              className={styles.leftCategoryLabel}
              onClick={() => onClickTab(idx, it.onSelect)}
              data-is-header-portal={isHeaderPortal ? 'true' : 'false'}
              data-selected={idx === activeIdx ? 'true' : 'false'}
              data-key={it.key}
            >
              {it.iconName ? (
                <i
                  className={`icon-${it.iconName} ${styles.leftCategoryIconFont}`}
                  aria-hidden="true"
                  data-selected={idx === activeIdx ? 'true' : 'false'}
                />
              ) : (
                <div
                  className={`${styles.leftCategoryIconFont}`}
                  data-key={it.key}
                >
                  <img
                    className={styles.leftCategoryIcon}
                    data-selected={idx === activeIdx ? 'true' : 'false'}
                    src={it.icon}
                    width="20"
                    height="20"
                    loading="lazy"
                    alt="icon"
                  />
                </div>
              )}
              <div className={styles.leftCategoryText} data-key={it.key}>
                {it.label}
              </div>
              {it.isNew && (
                <span className={styles.newLabelWrapper}>
                  <NewLabel show />
                </span>
              )}
            </button>
            {idx === 0 && isIpadLayout && (
              <div className={styles.categoryDivider} />
            )}
          </Fragment>
        ))}
        <GalleryPickerModal
          isOpen={isGalleryPickerOpen}
          onClose={handleCloseGalleryPicker}
          onFileSelected={handleGalleryFileSelected}
        />
        {
          <>
            <div className={styles.dividerContainer}>
              <hr className={styles.divider} />
            </div>
            {apiItems.map((it, idx) => (
              <Fragment key={it.key}>
                <button
                  tabIndex={-1}
                  type="button"
                  className={styles.leftCategoryLabel}
                  onClick={onClickAPI}
                  data-is-header-portal={isHeaderPortal ? 'true' : 'false'}
                  data-selected={false}
                  data-key={it.key}
                >
                  {it.iconName ? (
                    <i
                      className={`icon-${it.iconName} ${styles.leftCategoryIconFont}`}
                      aria-hidden="true"
                      data-selected={false}
                    />
                  ) : (
                    <div
                      className={`${styles.leftCategoryIconFont}`}
                      data-key={it.key}
                    >
                      <img
                        className={styles.leftCategoryIcon}
                        data-selected={false}
                        src={it.icon}
                        width="20"
                        height="20"
                        loading="lazy"
                        alt=""
                      />
                    </div>
                  )}
                  <div
                    className={styles.leftCategoryText}
                    data-key={it.key}
                    data-ipad={isIpadLayout}
                  >
                    {it.label}
                    {isIpadLayout && (
                      <div className={styles.externalLinkIconIPad}>
                        <ExternalLink />
                      </div>
                    )}
                  </div>
                  {!isIpadLayout && (
                    <div className={styles.externalLinkIcon}>
                      <ExternalLink />
                    </div>
                  )}
                </button>
              </Fragment>
            ))}
          </>
        }
        <div className={styles.hiddenHeight} />
      </div>
    </div>
  );
}
