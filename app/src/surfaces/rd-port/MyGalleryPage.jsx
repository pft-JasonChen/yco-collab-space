import styles from './GalleryPage.module.scss';
import Headers from './Header.jsx';
import { Footer as Footer } from './adapters.jsx';
import { useEffect, useRef, useMemo } from 'react';
import { useRouter } from './adapters.jsx';
import { myAccountTabs } from './adapters.jsx';
import Gallery from './Gallery.jsx';
import HomeCategory from './HomeCategory.jsx';
import AiTools from './AiTools.jsx';
import AiAgent from './AiAgent.jsx';
import useSwitchTab from './use-switch-tab.js';
import Tab from './Tab.jsx';
import DragScrollWrapper from './DragScrollWrapper.jsx';
import useLogic from './use-gallery-page-logic.js';
import { useAccountRedDots as useAccountRedDots } from './adapters.jsx';
import { AccountRedDotsContext as AccountRedDotsContext } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { useWindowDevice as useWindowDevice } from './adapters.jsx';
import _isEqual from 'lodash/isEqual';
import _get from 'lodash/get';
import _size from 'lodash/size';
import { useHomeCategory as useHomeCategory } from './adapters.jsx';

const AccountTabMap = {
  [myAccountTabs.photoEditor]: {
    basePath: '/account',
    pathSuffix: '/gallery?type=photoEditor',
    queryKey: 'type',
    queryValue: 'photoEditor',
  },
  [myAccountTabs.videoEditor]: {
    basePath: '/account',
    pathSuffix: '/gallery?type=videoEditor',
    queryKey: 'type',
    queryValue: 'videoEditor',
  },
  [myAccountTabs.imageGeneration]: {
    basePath: '/account',
    pathSuffix: '/gallery?type=imageGeneration',
    queryKey: 'type',
    queryValue: 'imageGeneration',
  },
  [myAccountTabs.aiTools]: {
    basePath: '/account',
    pathSuffix: '/artwork',
    queryKey: '',
    queryValue: '',
  },
  [myAccountTabs.aiAgent]: {
    basePath: '/account',
    pathSuffix: '/gallery?type=aiAgent',
    queryKey: 'type',
    queryValue: 'aiAgent',
  },
};

export default function MyGalleryPage(props) {
  const { cmsGridModule, cmsUseCaseMenu } = props;
  const gridSections = _get(cmsGridModule, 'attributes.sections');
  const { filteredSections, getCategoryName } = useHomeCategory({
    gridSections: gridSections,
  });

  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const tabsRef = useRef(null);
  const photoEditorRef = useRef(null);
  const videoEditorRef = useRef(null);
  const imageGenerationRef = useRef(null);
  const avatarRef = useRef(null);
  const aiAgentRef = useRef(null);
  const indicatorRef = useRef(null);

  const router = useRouter();
  const { isMd, isMobileDevice, orientation } = useWindowDevice();
  const { t } = getTranslationFunction();

  // Whole red-dot state goes to <Gallery> / <AiTools> via context; index.js
  // itself only needs the show* values for <Headers> + the tab dots below.
  const redDots = useAccountRedDots();
  const {
    showAvatarRedDot,
    showAiHeadshotRedDot,
    showVideoEnhanceRedDot,
    showAiVideoFiltersRedDot,
    showVideoFaceSwapRedDot,
    showImageToVideoRedDot,
    showAiStudioRedDot,
    showAvatarCreditRedDot,
    showAiHeadshotCreditRedDot,
    showEnhanceBatchRedDot,
    showVideoObjRemoverRedDot,
    showAiVideoEditorRedDot,
    showCharacterMotionSwapRedDot,
  } = redDots;

  const nameToRef = {
    photoEditor: photoEditorRef,
    videoEditor: videoEditorRef,
    imageGeneration: imageGenerationRef,
    artwork: avatarRef,
    aiAgent: aiAgentRef,
  };

  const { tabName } = useLogic({ nameToRef, tabsRef, topRef, indicatorRef });

  const { handleSetTab: handleTabClick } = useSwitchTab({
    tabMap: AccountTabMap,
    querySwitch: false,
  });

  useEffect(() => {
    if (!router.isReady) return;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [router.isReady, tabName]);

  const tabs = useMemo(
    () => [
      {
        key: myAccountTabs.photoEditor,
        label: 'my.account.tabs.photos',
        ref: photoEditorRef,
        showRedDot: _size(showEnhanceBatchRedDot) > 0,
      },
      {
        key: myAccountTabs.videoEditor,
        label: 'my.account.tabs.videos',
        ref: videoEditorRef,
        showRedDot:
          _size(showVideoEnhanceRedDot) > 0 ||
          _size(showAiVideoFiltersRedDot) > 0 ||
          _size(showVideoFaceSwapRedDot) > 0 ||
          _size(showVideoObjRemoverRedDot) > 0 ||
          _size(showAiVideoEditorRedDot) > 0 ||
          _size(showCharacterMotionSwapRedDot) > 0,
      },
      {
        key: myAccountTabs.imageGeneration,
        label: 'my.account.tabs.ai.image.generator',
        ref: imageGenerationRef,
        showRedDot: _size(showImageToVideoRedDot) > 0,
      },
      {
        key: myAccountTabs.aiTools,
        label: 'my.account.tabs.aitools.capital',
        ref: avatarRef,
        showRedDot:
          _size(showAvatarRedDot) > 0 ||
          _size(showAiHeadshotRedDot) > 0 ||
          _size(showAiStudioRedDot) > 0 ||
          _size(showAvatarCreditRedDot) > 0 ||
          _size(showAiHeadshotCreditRedDot) > 0,
      },
      {
        key: myAccountTabs.aiAgent,
        label: 'my.account.tabs.ai.agent',
        ref: aiAgentRef,
        showRedDot: false,
      },
    ],
    [
      showVideoEnhanceRedDot,
      showAiVideoFiltersRedDot,
      showVideoFaceSwapRedDot,
      showVideoObjRemoverRedDot,
      showAiVideoEditorRedDot,
      showCharacterMotionSwapRedDot,
      showImageToVideoRedDot,
      showAvatarRedDot,
      showAiHeadshotRedDot,
      showAiStudioRedDot,
      showAvatarCreditRedDot,
      showAiHeadshotCreditRedDot,
      showEnhanceBatchRedDot,
      isMd,
    ]
  );

  return (
    <AccountRedDotsContext.Provider value={redDots}>
      <div className={styles.myAccountPage}>
        <Headers cmsUseCaseMenu={cmsUseCaseMenu} />
        <div className={styles.galleryWrapper}>
          {!isMd && (
            <div className={styles.leftCategoryContainer}>
              <HomeCategory
                sections={filteredSections}
                getCategoryName={getCategoryName}
                isMobileLandscape={
                  isMobileDevice && orientation === 'landscape'
                }
              />
            </div>
          )}
          <div id="yce-account-page-container" className={styles.container}>
            <div className={styles.galleryTop}>
              {t('my.account.tabs.gallery')}
            </div>
            <div className={styles.tabsWrapper}>
              <DragScrollWrapper
                ref={topRef}
                wrapperClass={styles.top}
                enableDrag={{ x: true, y: false }}
              >
                <div className={styles.tabs} ref={tabsRef}>
                  {tabs.map(({ key, label, showRedDot, ref }) => (
                    <Tab
                      key={key}
                      tabKey={key}
                      label={label}
                      isActive={_isEqual(tabName, key)}
                      ref={ref}
                      onClick={(tabKey) => {
                        if (topRef?.current?.moved) return;
                        handleTabClick(tabKey);
                      }}
                      showRedDot={showRedDot}
                    />
                  ))}
                </div>
                <div className={styles.indicator} ref={indicatorRef}></div>
              </DragScrollWrapper>
              <div className={styles.indicatorBottom}></div>
            </div>
            <div className={styles.bottom} ref={bottomRef}>
              {[
                myAccountTabs.photoEditor,
                myAccountTabs.imageGeneration,
                myAccountTabs.videoEditor,
              ].includes(tabName) ? (
                <Gallery tabName={tabName} />
              ) : null}
              {_isEqual(tabName, myAccountTabs.aiTools) ? <AiTools /> : null}
              {_isEqual(tabName, myAccountTabs.aiAgent) ? <AiAgent /> : null}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </AccountRedDotsContext.Provider>
  );
}
