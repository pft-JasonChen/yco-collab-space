import { useRouter } from './adapters.jsx';
import { useEffect, useMemo } from 'react';
import _includes from 'lodash/includes';
import { myAccountTabs } from './adapters.jsx';
import { useTwoCheckout as useTwoCheckout } from './adapters.jsx';
import { useUserStatus as useUserStatus } from './adapters.jsx';
import { useWindowWidth as useWindowWidth } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { moduleTypes } from './adapters.jsx';

/**
 *
 * @param {object} options - 設定
 * @param {Object} options.nameToRef
 * @param {React.RefObject} options.tabsRef
 * @param {React.RefObject} options.topRef
 * @param {React.RefObject} options.indicatorRef
 * @returns
 */
const useLogic = ({ nameToRef, tabsRef, topRef, indicatorRef }) => {
  const router = useRouter();
  const { asPath } = router;

  const { updateSourcePage, updateSourceButton4PricingIcon } = useTwoCheckout();

  const { isGuest } = useUserStatus();

  const width = useWindowWidth();

  const { locale } = getTranslationFunction();

  const tabName = useMemo(() => {
    if (_includes(asPath, myAccountTabs.photoEditor)) {
      return myAccountTabs.photoEditor;
    }
    if (
      _includes(asPath, myAccountTabs.imageGeneration) ||
      _includes(asPath, 'aiArt=true')
    ) {
      return myAccountTabs.imageGeneration;
    }
    if (
      _includes(asPath, myAccountTabs.videoEditor) ||
      _includes(asPath, moduleTypes.videoSr)
    ) {
      return myAccountTabs.videoEditor;
    }
    if (_includes(asPath, myAccountTabs.aiAgent)) {
      return myAccountTabs.aiAgent;
    }
    if (_includes(asPath, myAccountTabs.aiTools)) {
      return myAccountTabs.aiTools;
    }
    return myAccountTabs.photoEditor;
  }, [asPath]);

  useEffect(() => {
    updateSourcePage();
    updateSourceButton4PricingIcon();
  }, []);

  /**
   * Block guest user and force redirect to home page
   * with `hard navigation` to clear all redux states
   */
  useEffect(() => {
    if (!router.isReady) return;
    if (isGuest) {
      const { locale = 'en-us' } = router.query || {};
      const targetPath = `/${locale.replace('en-us', '')}`;
      // Hard navigation to home page to clear all redux states after use signed out
      if (window?.location) {
        setTimeout(() => (window.location.href = targetPath), 500);
      }
    }
  }, [router.isReady, isGuest]);

  useEffect(() => {
    const tabRef = nameToRef[tabName];
    if (
      !tabRef ||
      !tabRef.current ||
      !tabsRef ||
      !tabsRef.current ||
      !topRef ||
      !topRef.current ||
      !topRef.current.element
    )
      return;
    const tabMeta = tabRef.current.getBoundingClientRect();
    const left = tabMeta.x - tabsRef.current.getBoundingClientRect().left;
    indicatorRef.current.style.left = `${left}px`;
    indicatorRef.current.style.width = `${tabMeta.width}px`;
    topRef.current.element.scrollTo({
      left: left - 20,
      top: 0,
      behavior: 'smooth',
    });
  }, [tabName, width, locale]);

  return {
    tabName,
  };
};

export default useLogic;

