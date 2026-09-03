import styles from './index.module.scss';
import { useSelector } from 'react-redux';
import { useMemo, useState, useEffect, useRef } from 'react';
import ResultVideo from './result-video';
import PollingVideo from './polling-video';
import ResultImage from '@/components/result-page/common/template-shared/history/result-image';
import { getTranslationFunction } from '@/i18n';
import useFetchSuccessResultsDetail from './hooks/use-fetch-success-results-detail';
import useSetDownloadInfo from '@/components/result-page/hooks/download/use-set-download-info';
import { moduleTypes } from '@/utils/moduleTypes';
import _get from 'lodash/get';
import videoUtils, { isImageTemplateItem } from '@/utils/videoUtils';
import ImageWrapper from '@/components/common/image-wrapper';
import _map from 'lodash/map';
import _includes from 'lodash/includes';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isPlainObject from 'lodash/isPlainObject';
import localStorageUtils, {
  localStorageTypes,
} from '@/utils/localStorageTypes';
import {
  moduleTypeToStoreKey,
  createFilterByType,
} from '../hooks/use-video-history';
import { VIDEO_TASK_MODULES } from '@/store/slices/videoTaskModules';
import { RESULT_PAGE_CONTAINER_ID } from '@/components/utils/autoScrollUtils';
import useWindowDevice from '@/hooks/use-window-device';
import { MOBILE_PAGE_CONTAINER_MODULES } from '../hooks/use-common-scroll';

function EmptyResult({ imageSrc, title, description }) {
  return (
    <div className={`${styles.emptyResult} ${styles.center}`}>
      <ImageWrapper src={imageSrc} />
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptyDesc}>{description}</div>
    </div>
  );
}

export default function HistoryVideos(props) {
  const {
    settings,
    setSettings,
    setSelectDetailData = () => {},
    isFromHistory,
    historyIdFromGallery,
    filterType,
    setFilterType = () => {},
    style,
    // Set by ResultsLayout while this panel is the inactive tab. Needed because
    // its off-screen hidden style has no `visibility: hidden` to lean on —
    // see OFFSCREEN_PANEL there. [YCO260824P0014]
    'aria-hidden': ariaHidden,
    inert,
    // Additive: pre-typed items (same shape `mergedVideoItems` builds
    // internally — {type, effect, retainAsEffects, taskId, createdAt,
    // isImage, data, pollingData?}) from callers whose results don't live
    // in VIDEO_TASK_MODULES' Redux slices (e.g. image-template's mocked
    // Generate flow). Empty by default — every existing caller is
    // unaffected.
    extraItems = [],
    // Image Template's own catalog (guid -> template) — only used by the
    // persisted-history branch below to resolve a template name for
    // reloaded-from-backend rows. Empty by default; every other caller is
    // unaffected.
    templates = [],
    // Pull the list's horizontal padding onto --video-result-gutter so it lines
    // up with a tab control rendered at the same gutter. ResultsLayout opts in
    // for all of its consumers; callers that wire up their own tab control keep
    // the base 24px. Off by default — every existing caller is unaffected.
    gutterAligned = false,
  } = props;

  const { setDownloadInfo } = useSetDownloadInfo();

  const moduleType = useSelector((state) => state.info.moduleType);
  const isTherePollingTasks = useSelector(
    (state) => state.task.isTherePollingTasks
  );
  const videoHistoryDataArray = useSelector(
    (state) => state.task.videoHistoryDetailedData.data
  );
  const historyDataCreatedAt = useSelector(
    (state) => state.task.videoHistoryDetailedData.dataCreatedAt
  );

  const isHistoryFetched = historyDataCreatedAt > 0;

  const { t } = getTranslationFunction();
  const { isMd } = useWindowDevice();

  // Scroll to the gallery-entered target card once. Skip on mobile shared-
  // outer-scroll modules for Edit click — those swap to Edit tab and the
  // scroll would land on / displace the now-active tab.
  const isClickEditButton = useSelector(
    (state) =>
      state.result.productConfig?.[state.info.moduleType]?.isClickEditButton
  );
  const scrolledForTargetIdRef = useRef(null);

  useEffect(() => {
    if (!isFromHistory || !historyIdFromGallery) return;
    if (
      isMd &&
      MOBILE_PAGE_CONTAINER_MODULES.has(moduleType) &&
      isClickEditButton
    )
      return;
    if (scrolledForTargetIdRef.current === historyIdFromGallery) return;

    let rafId;
    const timer = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        const targetEl = document.getElementById(
          `history-card-${historyIdFromGallery}`
        );
        const scrollContainer = document.getElementById(
          isMd ? RESULT_PAGE_CONTAINER_ID : 'YCE-history-videos-container'
        );
        if (!targetEl || !scrollContainer) return;

        scrolledForTargetIdRef.current = historyIdFromGallery;
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        scrollContainer.scrollTo({
          top: scrollContainer.scrollTop + targetRect.top - containerRect.top,
          behavior: 'smooth',
        });
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    isFromHistory,
    historyIdFromGallery,
    isClickEditButton,
    isMd,
    moduleType,
  ]);

  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 500); // Minimum 500ms loading display

    return () => clearTimeout(timer);
  }, []);

  const pollingList = useSelector((state) =>
    VIDEO_TASK_MODULES.flatMap((m) => state[m.reduxKey]?.pollingList || [])
  );

  const pollingData = useSelector((state) =>
    VIDEO_TASK_MODULES.reduce(
      (acc, m) => ({ ...acc, ...(state[m.reduxKey]?.pollingData || {}) }),
      {}
    )
  );

  const successResults = useSelector((state) =>
    VIDEO_TASK_MODULES.flatMap((m) => state[m.reduxKey]?.successResults || [])
  );

  const { results: successResultsDataArray } =
    useFetchSuccessResultsDetail(successResults);

  // devLog('successResults', successResults);
  // devLog('successResultsDataArray', successResultsDataArray);

  // devLog('pollingList', pollingList);
  // devLog('pollingData', pollingData);

  const reversedPollingList = useMemo(() => {
    if (!pollingList) return [];
    return [...pollingList].reverse().map((item) => ({ ...item }));
  }, [pollingList]);

  const reversedSuccessResults = useMemo(() => {
    return successResultsDataArray
      ? [...successResultsDataArray].reverse()
      : [];
  }, [successResultsDataArray]);

  const filterByType = createFilterByType(filterType);

  const filteredPollingList = useMemo(() => {
    return reversedPollingList.filter(filterByType);
  }, [reversedPollingList, filterType]);

  const filteredSuccessResults = useMemo(() => {
    return reversedSuccessResults.filter(filterByType);
  }, [reversedSuccessResults, filterType]);

  const filteredHistoryData = useMemo(() => {
    return videoHistoryDataArray.filter(filterByType);
  }, [videoHistoryDataArray, filterType]);

  const filteredExtraItems = useMemo(() => {
    return extraItems.filter(filterByType);
  }, [extraItems, filterType]);

  // Merge all video items and sort by timestamp (newest first)
  const mergedVideoItems = useMemo(() => {
    // Combine polling and success items in execution order (newest first)
    const taskItems = [];

    // Create a map to track which tasks have moved from polling to success
    // Also create a map of taskId -> createdAt from pollingList for reference
    const successTaskIds = new Set(
      filteredSuccessResults.map((item) => item.taskId || item.id)
    );

    const taskCreatedAtMap = {};
    filteredPollingList.forEach((item) => {
      taskCreatedAtMap[item.taskId] = _get(item, 'createdAt', 0);
    });

    // Add polling/error items that are NOT in success list
    filteredPollingList.forEach((item) => {
      if (!successTaskIds.has(item.taskId)) {
        const pollingDataItem = pollingData?.[item?.taskId] || {};
        const error = _get(pollingDataItem, 'result.error', null);
        const createdAt = _get(item, 'createdAt', 0);

        taskItems.push({
          type: error ? 'error' : 'polling',
          data: item,
          pollingData: pollingDataItem,
          taskId: item?.taskId,
          createdAt,
        });
      }
    });

    // Add success items
    // For success items, try to get ts from result.ts in the success data,
    // but fallback to the original createdAt from pollingList if available
    filteredSuccessResults.forEach((item) => {
      if (!item) {
        console.warn('Skipping undefined success item');
        return;
      }

      const taskId = item?.id || item?.taskId;
      const ts = _get(item, 'result.ts', 0);
      const createdAt = ts || taskCreatedAtMap[taskId] || 0;

      // devLog('Adding success item:', {
      //   taskId,
      //   ts,
      //   createdAt,
      //   hasResultTs: !!_get(item, 'result.ts'),
      //   itemKeys: Object.keys(item || {}),
      // });

      taskItems.push({
        type: 'success',
        data: item,
        taskId,
        createdAt,
      });
    });

    // Already-typed extra items (e.g. mocked results) — no polling/success
    // split to do here, just fold straight into the same sort.
    taskItems.push(...filteredExtraItems);

    // Sort all task items by creation time (newest first)
    taskItems.sort((a, b) => {
      const diff = (b.createdAt || 0) - (a.createdAt || 0);
      return diff;
    });

    // devLog(
    //   'mergedVideoItems BEFORE sort:',
    //   taskItems.map((item) => ({
    //     type: item.type,
    //     taskId: String(item.taskId).substring(0, 20),
    //     createdAt: item.createdAt,
    //   }))
    // );

    // devLog(
    //   'mergedVideoItems AFTER sort:',
    //   taskItems.map((item) => ({
    //     type: item.type,
    //     taskId: String(item.taskId).substring(0, 20),
    //     createdAt: item.createdAt,
    //     date: item.createdAt
    //       ? new Date(item.createdAt).toLocaleString()
    //       : 'NO DATE',
    //   }))
    // );

    return taskItems;
  }, [
    filteredPollingList,
    filteredSuccessResults,
    pollingData,
    filteredExtraItems,
  ]);

  const emptyTitleText = useMemo(() => {
    return t('text.to.video.empty.title');
  }, [t]);

  const emptyDescText = useMemo(() => {
    return t('text.to.video.empty.desc');
  }, [t]);

  // Check if there is absolutely no history data across ALL types (unfiltered)
  const isAllHistoryEmpty = useMemo(() => {
    if (!isHistoryFetched || !minLoadingTimePassed) {
      return false;
    }
    const hasPolling = reversedPollingList?.length > 0;
    const hasSuccess = reversedSuccessResults?.length > 0;
    const hasHistory = videoHistoryDataArray?.length > 0;
    const hasExtra = extraItems?.length > 0;
    return !hasPolling && !hasSuccess && !hasHistory && !hasExtra;
  }, [
    isHistoryFetched,
    minLoadingTimePassed,
    reversedPollingList,
    reversedSuccessResults,
    videoHistoryDataArray,
    extraItems,
  ]);

  // For current video module, check if there's no data specifically for this module type
  const isCurrentModuleHistoryEmpty = useMemo(() => {
    if (!isHistoryFetched || !minLoadingTimePassed) {
      return false;
    }
    return mergedVideoItems.length === 0 && filteredHistoryData.length === 0;
  }, [
    isHistoryFetched,
    minLoadingTimePassed,
    mergedVideoItems,
    filteredHistoryData,
  ]);

  // Because we persist initial total seconds in localStorage for video tasks,
  // we need to clean up entries that are no longer active.
  useEffect(() => {
    const cacheKey = localStorageTypes.taskInitialSecs[moduleType];
    if (!cacheKey) return;

    const allCache = localStorageUtils.getParsedItem(cacheKey, {});
    if (_isEmpty(allCache) || !_isPlainObject(allCache)) return;

    const activeIds = _map(pollingList, 'taskId');

    let hasChanged = false;

    _forEach(allCache, (value, id) => {
      if (!_includes(activeIds, id)) {
        delete allCache[id];
        hasChanged = true;
      }
    });

    if (hasChanged) {
      localStorageUtils.updateInfo(cacheKey, allCache);
    }
  }, [pollingList, moduleType]);

  // Enable users to download the newest successful video result on Header button
  const prevSuccessResultsLengthRef = useRef(0);

  useEffect(() => {
    if (successResultsDataArray?.length === 0) {
      prevSuccessResultsLengthRef.current = 0;
      return;
    }

    const currentLength = successResultsDataArray.length;
    const prevLength = prevSuccessResultsLengthRef.current;

    // Only trigger when new items are added (not on initial load or removal)
    if (currentLength > prevLength) {
      const newestItem =
        successResultsDataArray[successResultsDataArray.length - 1];

      // devLog('newestItem', newestItem);
      if (newestItem && !isTherePollingTasks) {
        const { url, fileName } = videoUtils.extractData(newestItem);
        setDownloadInfo({
          downloadUrl: url,
          downloadFileId: fileName,
        });
      }
    }

    prevSuccessResultsLengthRef.current = currentLength;
  }, [successResultsDataArray]);

  // devLog('mergedVideoItems', mergedVideoItems);

  return (
    <div
      id={'YCE-history-videos-container'}
      className={`${styles.container} ${
        isCurrentModuleHistoryEmpty || isAllHistoryEmpty ? styles.centered : ''
      } ${gutterAligned ? styles.gutterAligned : ''}`}
      data-module={moduleType}
      style={{ paddingTop: '0px', ...style }}
      aria-hidden={ariaHidden}
      inert={inert}
    >
      {moduleType === moduleTypes.img2Vid && isCurrentModuleHistoryEmpty && (
        <EmptyResult
          imageSrc="/assets/images/account/gallery/emptyContent/1.27.1/video.svg"
          description={t('my.account.gallery.no.video.editing')}
        />
      )}
      {moduleType === moduleTypes.textToVideo &&
        isCurrentModuleHistoryEmpty &&
        (filterType === moduleTypes.textToVideo ? (
          <EmptyResult
            imageSrc="/assets/images/txt2Vid/img_empty.svg"
            title={emptyTitleText}
            description={emptyDescText}
          />
        ) : (
          <EmptyResult
            imageSrc="/assets/images/account/gallery/emptyContent/1.27.1/video.svg"
            description={t('my.account.gallery.no.video.editing')}
          />
        ))}
      {moduleType !== moduleTypes.img2Vid &&
        moduleType !== moduleTypes.textToVideo &&
        isCurrentModuleHistoryEmpty &&
        isHistoryFetched &&
        minLoadingTimePassed && (
          <EmptyResult
            imageSrc="/assets/images/account/gallery/emptyContent/1.27.1/video.svg"
            description={t('my.account.gallery.no.video.editing')}
          />
        )}
      {mergedVideoItems.map((item, index) => {
        if (item.type === 'polling' || item.type === 'error') {
          return (
            <PollingVideo
              key={item.taskId || `polling-${index}`}
              item={item.data}
              thumbnail={item.data?.thumbnail}
              pollingData={item.pollingData}
              moduleType={moduleType}
              isImage={item.isImage}
            />
          );
        } else if (item.type === 'success') {
          return item.isImage ? (
            <ResultImage
              key={item.taskId || `success-${index}`}
              taskId={item.taskId}
              template={item.data?.template}
              resultImageUrl={item.data?.resultImageUrl}
              createdAt={item.createdAt}
              beforeImg={item.data?.beforeImg}
              misc={item.data?.misc}
              setSelectDetailData={setSelectDetailData}
            />
          ) : (
            <ResultVideo
              key={item.taskId || `success-${index}`}
              dataItem={item.data}
              settings={settings}
              setSettings={setSettings}
              setSelectDetailData={setSelectDetailData}
            />
          );
        }
        return null;
      })}
      {filteredHistoryData.map((dataItem) => {
        // Persisted rows have no pre-set `isImage` flag (unlike
        // mergedVideoItems' extraItems/session bridge) — Image Template is
        // the only image-output module in this shared video-feature query,
        // so its own clientCfg-stamped classifier decides the branch here.
        if (isImageTemplateItem(dataItem)) {
          // imageTemplate's persisted detail response is shaped like every
          // other single-image act-id-0 module (ai-clothes/face-swap/etc),
          // NOT like the video-task `result.results[0].data[].url` shape
          // videoUtils.extractData assumes — confirmed live 2026-08-21: the
          // real payload is `result.afterImg[0].files[0].url`, with no
          // `result.results`/`result.ts` at all (same fallback path
          // use-real-template-history.js's session-only bridge already
          // anticipated for this exact reason). No ts field exists on this
          // shape, so the card's date renders blank (useFormattedDate's
          // `!ts` guard) until the backend adds one.
          const resultImageUrl =
            _get(dataItem, 'result.results.0.data.0.url', null) ||
            _get(dataItem, 'result.afterImg.0.files.0.url', null);
          const createdAt = _get(dataItem, 'result.ts', 0);
          const beforeImg = _get(dataItem, 'result.beforeImg', []);
          const misc = _get(dataItem, 'result.misc', {});
          // Same clientCfg shape use-real-template-history.js reads for
          // session items (result.misc.clientCfg, not nested under
          // `custom` — see template-feature.js).
          const templateGuid = _get(
            dataItem,
            'result.misc.clientCfg.templateGuid'
          );
          const template =
            templates.find((t) => t.guid === templateGuid) || null;
          return (
            <ResultImage
              key={dataItem.id}
              taskId={dataItem.id}
              template={template}
              resultImageUrl={resultImageUrl}
              createdAt={createdAt}
              beforeImg={beforeImg}
              misc={misc}
              setSelectDetailData={setSelectDetailData}
            />
          );
        }
        return (
          <ResultVideo
            key={dataItem.id}
            dataItem={dataItem}
            settings={settings}
            setSettings={setSettings}
            setSelectDetailData={setSelectDetailData}
          />
        );
      })}
    </div>
  );
}
