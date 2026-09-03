import styles from './index.module.scss';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _findIndex from 'lodash/findIndex';
import { getTranslationFunction } from '@/i18n';
import sideBarMenuUtils from '../../utils/sideBarMenuUtils';
import { crossPromoteCategories } from '../../utils/sideBarMenuUtils';
import { setLoginModalOpen } from '@/store/actions/uiAction';
import useGetUserSubscriptionType from '@/hooks/user/use-get-user-subscription-type';
import useShowContest from '@/hooks/header/use-show-contest';
import useEditProject from '@/components/result-page/hooks/project/use-edit-project';
import useHandleRecentFiles from '@/components/result-page/hooks/use-handle-recent-files';
import useUserStatus from '@/hooks/use-user-status';
import { Textfit } from 'react-textfit';
import sessionStorageUtils from '@/utils/sessionStorageUtils';
import { sessionStorageTypes } from '@/types/sessionStorageTypes';
import routerUtils from '@/utils/routerUtils';
import { useRouter } from 'next/router';

export default function SideBarMenu(props) {
  const {
    onMenuSelect,
    currentCategoryType = null,
    activeCategoryType = null,
    onAIAgentClick = null,
  } = props;

  const router = useRouter();
  const { showContest } = useShowContest();
  const { initProject } = useEditProject();
  const { deleteRecentFile } = useHandleRecentFiles();

  const dispatch = useDispatch();
  const userChecked = useSelector((state) => state.user.checked);
  const userId = useSelector((state) => state.user?.userInfo?.userId);

  const isUserUser = useMemo(() => {
    return userChecked && !userId;
  }, [userChecked, userId]);

  const { t, locale } = getTranslationFunction();
  const { isLoginUser } = useUserStatus();

  const getCategoryName = useCallback(
    (categoryName) => {
      const i18nKey = sideBarMenuUtils.getCategoryNameMappingKey(categoryName);
      return i18nKey ? t(i18nKey) : categoryName;
    },
    [t]
  );

  const handleOpenGallery = useCallback(() => {
    if (!userChecked) return false;

    if (isUserUser) {
      dispatch(setLoginModalOpen(true));
      return false;
    }

    window.open('/account/gallery', '_blank');
    return true;
  }, [userChecked, isUserUser, dispatch]);

  const items = useMemo(() => {
    const base = [
      {
        key: 'sbm-home',
        label: getCategoryName('Home'),
        icon: '/assets/images/header/icon_home.svg',
        iconName: 'ic-home',
        onSelect: async () => {
          await deleteRecentFile();
          initProject();
          window.open(isLoginUser ? '/home' : '/', '_blank');
        },
      },
      {
        key: 'sbm-ai-agent',
        label: getCategoryName('AI Agent'),
        icon: '/assets/images/aiAgent/icon_agent.svg',
        iconName: 'ic-ai-agent',
        onSelect: () => {
          sessionStorageUtils.setItem(
            sessionStorageTypes.copilot.source,
            'tool-page'
          );
          // Use onAIAgentClick if provided (for carrying images), otherwise open in new tab without image
          if (onAIAgentClick) {
            onAIAgentClick();
          } else {
            window.open('/agent', '_blank');
          }
        },
      },
      ...crossPromoteCategories.map((category) => ({
        key: `sbm-${category.categoryGroup}`,
        label: t(category.categoryName),
        icon: sideBarMenuUtils.getCategoryNameMappingIcon(
          category.categoryGroup
        ),
        iconName: sideBarMenuUtils.getCategoryNameMappingIconFont(
          category.categoryGroup
        ),
        onSelect: () => onMenuSelect?.(category.categoryGroup),
      })),
      {
        key: 'sbm-gallery',
        label: getCategoryName('My Gallery'),
        icon: '/assets/images/header/icon_gallery.svg',
        iconName: sideBarMenuUtils.getCategoryNameMappingIconFont('Gallery'),
        onSelect: handleOpenGallery,
      },
      {
        key: 'sbm-contest',
        label: getCategoryName('Contest'),
        icon: '/assets/images/header/youcam-ai-contest.png',
        iconName: null,
        onSelect: () => {
          window.open('/contest', '_blank');
        },
      },
    ];
    if (showContest) {
      return base;
    }
    return base.filter((v) => v.key !== 'sbm-contest');
  }, [
    handleOpenGallery,
    locale,
    showContest,
    onMenuSelect,
    onAIAgentClick,
    t,
    getCategoryName,
    router,
  ]);

  const [activeIdx, setActiveIdx] = useState(1);
  const [focusIdx, setFocusIdx] = useState(null);

  const refs = useRef([]);
  useEffect(() => {
    const el = refs.current[focusIdx];
    if (el) el.focus();
  }, [focusIdx]);

  useEffect(() => {
    const target = activeCategoryType || currentCategoryType;
    if (!target) return;

    const matchedIndex = items.findIndex(
      (item) => item.key === `sbm-${target}`
    );

    if (matchedIndex !== -1) setActiveIdx(matchedIndex);
  }, [activeCategoryType, currentCategoryType]);

  const tryActivate = useCallback(
    (idx) => {
      const shouldActivate = items[idx]?.onSelect?.();
      if (shouldActivate !== false) {
        setActiveIdx(idx);
        setFocusIdx(idx);
      }
    },
    [items]
  );

  const onKeyDownTab = (e) => {
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
      if (focusIdx == null) return;
      tryActivate(focusIdx);
    }
  };

  const onClickTab = (idx) => {
    tryActivate(idx);
  };

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      className={`${styles.leftCategoryContainer} homeCategory hidden-scrollbar`}
      onKeyDown={onKeyDownTab}
    >
      {items.map((it, idx) => (
        <div key={it.key} className={styles.item} data-key={it.key}>
          <button
            role="tab"
            data-selected={idx === activeIdx}
            tabIndex={idx === focusIdx ? 0 : -1}
            ref={(el) => (refs.current[idx] = el)}
            type="button"
            className={styles.leftCategoryLabel}
            onClick={() => onClickTab(idx)}
          >
            <div className={styles.leftCategoryIconContainer} data-key={it.key}>
              {it.iconName ? (
                <i
                  className={`icon-${it.iconName} ${styles.leftCategoryIconFont}`}
                  aria-hidden="true"
                />
              ) : (
                <img
                  className={styles.leftCategoryIcon}
                  src={it.icon}
                  width="20"
                  height="20"
                  loading="lazy"
                  alt=""
                />
              )}
            </div>
            {it.key !== 'sbm-home' && (
              <div className={styles.leftCategoryLabelText} data-key={it.key}>
                <Textfit
                  mode="multi"
                  max={12}
                  min={8}
                  className={styles.textFitLabelText}
                >
                  {it.label}
                </Textfit>
              </div>
            )}
          </button>
          {it.key === 'sbm-home' && (
            <div className={styles.dividerContainer}>
              <hr className={styles.divider} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
