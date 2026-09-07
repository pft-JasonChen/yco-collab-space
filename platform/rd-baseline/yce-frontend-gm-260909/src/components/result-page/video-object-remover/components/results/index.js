import SegmentedControl from '@/components/common/tab-control/segmented-control';
import styles from './index.module.scss';
import useWindowDevice from '@/hooks/use-window-device';
import { segmentedControlTypes } from '@/components/common/tab-control/utils/tabsTypes';
import { resultsTabs } from '@/components/result-page/common/video-feature/hooks/use-common-tabs';
import HistoryVideos from '@/components/result-page/common/video-feature/history-videos';
import FilterDropdown from '@/components/result-page/common/video-feature/filter-dropdown';
import { getVideoTabControlStyle } from '@/components/result-page/common/video-feature/utils/tab-control-style';
import useTabScrollPersistence from '@/components/result-page/common/video-feature/hooks/use-tab-scroll-persistence';
import YceToast from '@/components/common/yce-toast';

const Results = ({
  editContent,
  interactionToolsBarComponent,
  settings,
  setSettings,
  currentResultTab,
  setCurrentResultTab,
  isFromHistory,
  historyIdFromGallery,
  filterType,
  setFilterType,
  setSelectDetailData,
  mobileHeader = null,
  hasVideo = false,
}) => {
  const { isDesktop, isMd } = useWindowDevice();

  const isTabActive = (tabIndex) => {
    return currentResultTab === resultsTabs[tabIndex].key;
  };

  useTabScrollPersistence(currentResultTab);

  return (
    <div className={styles.container}>
      <div className={styles.tabControlWrapper}>
        <SegmentedControl
          tabs={resultsTabs}
          currentTab={currentResultTab}
          setCurrentTab={setCurrentResultTab}
          variant={segmentedControlTypes.BLACK_VIDEO_RESULT}
          customContainerStyle={getVideoTabControlStyle({ isDesktop, isMd })}
        />
        {isTabActive(1) && (
          <FilterDropdown
            value={filterType}
            onChange={setFilterType}
            isNeedRightPadding={isDesktop}
            isNeedBottomMargin={!isDesktop}
          />
        )}
      </div>
      {!isDesktop && (
        <div
          className={`${styles.tabControlSpacer} ${
            isTabActive(1) ? styles.withFilter : ''
          }`}
        />
      )}
      {isTabActive(0) && mobileHeader}
      <div className={styles.overflowHidden}>
        <div className={styles.slideBlock}>
          {/* Edit tab */}
          <div
            className={`${styles.resultContainer} ${
              hasVideo ? styles.hasVideo : ''
            }`}
            style={{
              display: isTabActive(0) ? 'flex' : 'none',
            }}
          >
            {editContent}
          </div>
          {isTabActive(0) && interactionToolsBarComponent}
          {/* History tab */}
          <div
            style={{
              display: isTabActive(1) ? 'block' : 'none',
              width: '100%',
              height: '100%',
            }}
          >
            <HistoryVideos
              settings={settings}
              setSettings={setSettings}
              hasTabs={resultsTabs.length > 1}
              isFromHistory={isFromHistory}
              historyIdFromGallery={historyIdFromGallery}
              filterType={filterType}
              setSelectDetailData={setSelectDetailData}
            />
          </div>
        </div>
      </div>
      <YceToast />
    </div>
  );
};

export default Results;
