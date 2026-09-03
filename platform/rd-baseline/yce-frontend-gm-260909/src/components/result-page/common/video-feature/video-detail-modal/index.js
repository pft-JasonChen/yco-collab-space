import styles from './index.module.scss';
import Modal from '@/components/common/modal';
import NextAction from '../next-action';
import Prompt from '../../prompt';
import { promptTypes } from '../../prompt/utils/promptTypes';
import {
  headerProducts,
  moduleTypes,
  sodTypes,
  videoTypes4ModuleBanner,
} from '@/utils/moduleTypes';
import { getTranslationFunction } from '@/i18n';
import timeUtils from '@/utils/timeUtils';
import { generateDownloadFileName } from '@/utils/downloadFileNameUtils';
import useChain from '@/components/result-page/hooks/use-chain';
import { useSelector } from 'react-redux';
import useHeaderGeneral from '@/components/common/headers/hooks/use-header-general';
import useInit from '@/components/result-page/hooks/use-init';
import _get from 'lodash/get';
import MediaPreviewModal from '../media-preview-modal';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import useObserveElementResize from '@/components/result-page/hooks/ui/use-observer-element-resize';
import useCommonScroll from '../hooks/use-common-scroll';
import useScrollLock from '@/hooks/use-scroll-lock';
import {
  trackAIGenerateFeedback,
  trackAIGenerateDownload,
} from '@/utils/countly/countlyAIGenerateUtils';
import {
  extractVideoTrackingData,
  extractInputMediaTrackingData,
} from '@/utils/countly/videoTrackingHelper';

const isVideoByExtension = (url = '') =>
  /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

function buildMediaItems(selectDetailData) {
  if (!selectDetailData) return [];

  const effectName = selectDetailData.effectName;
  const beforeImages = _get(selectDetailData, 'dataItem.result.beforeImg', []);
  const isVideoSourceModuleType = videoTypes4ModuleBanner.includes(effectName);

  const entries = beforeImages.flatMap((group) => {
    const groupName = group?.name; // 'refIds' | 'srcIds' | 'mskIds'
    const files = group?.file || [];

    // videoObjRemover: skip mask group — mask images are not meaningful to display
    if (effectName === moduleTypes.videoObjRemover && groupName === 'mskIds') {
      return [];
    }

    return files.map((f) => ({
      url: f?.url || '',
      name: f?.name,
      refIds: f?.refIds,
      dstKey: f?.dstKey,
      id: f?.id,
      groupName,
    }));
  });

  // 影片來源的 url 一定帶副檔名，所以只要組裡認得出影片，其餘一律是圖片。
  // groupName 只在認不出任何影片時保底 —— characterMotionSwap 的 srcIds/refIds
  // 會隨 model 的 page_type 對調（見 model-inputs.js resolveFileSets）。
  const hasIdentifiableVideo = entries.some((entry) =>
    isVideoByExtension(entry.url)
  );

  const resolveType = (entry) => {
    if (!isVideoSourceModuleType) return 'image'; // 非影片來源模組：一律當圖片
    if (hasIdentifiableVideo) {
      return isVideoByExtension(entry.url) ? 'video' : 'image';
    }
    return entry.groupName === 'srcIds' ? 'video' : 'image';
  };

  // video effect => 圖片 + 影片都要；非 video effect => items 本來就都是 image
  return entries
    .filter((entry) => !!entry.url)
    .map((entry) => ({ ...entry, type: resolveType(entry) }));
}

// Keep in sync with the 4px gap on .imageWrapper / .sourceRow in index.module.scss
const SOURCE_ROW_GAP = 4;

// Split point closest to half the total width; ties favor a fuller first row.
// splitAt stays in [1, len - 1] so both rows are non-empty.
function findBalancedSplitIndex(widths) {
  const total = widths.reduce((sum, w) => sum + w, 0);
  let splitAt = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 0; i < widths.length - 1; i += 1) {
    acc += widths[i];
    const diff = Math.abs(total - acc * 2);
    if (diff <= bestDiff) {
      bestDiff = diff;
      splitAt = i + 1;
    }
  }
  return splitAt;
}

export default function VideoDetailModal(props) {
  const { selectDetailData, setSelectDetailData, onRetry } = props;

  const [mediaPreviewIndex, setMediaPreviewIndex] = useState(0);
  const [mediaPreviewOpened, setMediaPreviewOpened] = useState(false);
  const [videoResolution, setVideoResolution] = useState({
    width: 0,
    height: 0,
  });

  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const contentRef = useRef(null);
  const imageWrapperRef = useRef(null);

  // null = single source row; otherwise index where the second row starts
  const [sourceSplitAt, setSourceSplitAt] = useState(null);

  const { t } = getTranslationFunction();

  const {
    crossPromoteForVideoFeature,
    crossPromoteWithAfterImage,
    shallowRoute,
  } = useChain();
  const { initHistoryTask } = useInit();
  const { fetchAndGenerateAnchorAndDownloadVideo } = useHeaderGeneral();
  const { scrollToTop } = useCommonScroll();

  const moduleType = useSelector((state) => state.info.moduleType);

  const opened = !!selectDetailData;

  // Background scroll lock: the shared Modal relies on CSS overscroll-behavior,
  // which a text selection inside the read-only prompt <textarea> defeats
  // (selection-driven scrolling targets the document root scroller). Intercept
  // wheel/touchmove at the document level so the background never scrolls while
  // the dialog is open; scrolling inside the modal's own areas still works.
  useScrollLock(opened);

  const isTemplate = !!selectDetailData?.isTemplate;
  const isImage = !!selectDetailData?.isImage;
  // effectName, not the raw effect — the two v2v products share an umbrella
  // effect. Same value for every other module.
  const crossModuleType =
    selectDetailData?.effectName || selectDetailData?.dataItem?.effect;
  const url = _get(selectDetailData, 'url', '');

  // 從 selectDetailData 取已解析好的 width/height（extractData 已根據 vendorType resolve）
  const videoWidth = useMemo(() => {
    if (videoResolution.width > 0) return videoResolution.width;
    if (!selectDetailData) return 0;
    return selectDetailData.width || 0;
  }, [selectDetailData, videoResolution.width]);

  const videoHeight = useMemo(() => {
    if (videoResolution.height > 0) return videoResolution.height;
    if (!selectDetailData) return 0;
    return selectDetailData.height || 0;
  }, [selectDetailData, videoResolution.height]);

  const mediaItems = useMemo(
    () => buildMediaItems(selectDetailData),
    [selectDetailData]
  );

  // sourceSplitAt can lag one frame behind a mediaItems change — out-of-range
  // values clamp to a single row until the next measure corrects it.
  const mediaRows = useMemo(() => {
    if (mediaItems.length === 0) return [];
    if (sourceSplitAt == null || sourceSplitAt >= mediaItems.length) {
      return [mediaItems];
    }
    return [
      mediaItems.slice(0, sourceSplitAt),
      mediaItems.slice(sourceSplitAt),
    ];
  }, [mediaItems, sourceSplitAt]);

  // Sources stay on one row while it fits, else split into two balanced rows
  // (figma: up to 2 rows, horizontal scroll only). CSS alone can't do row-major
  // wrap + horizontal overflow, and grid column-flow breaks preview order.
  // offsetWidth/clientWidth are layout values, immune to the modal's scale
  // transition (getBoundingClientRect is not). (ebug:YCO260820P0021)
  const measureSourceRows = useCallback(() => {
    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;

    const thumbs = Array.from(
      wrapper.querySelectorAll(`.${styles.sourceRow} > *`)
    );
    if (thumbs.length < 3) {
      setSourceSplitAt(null);
      return;
    }

    const widths = thumbs.map((el) => el.offsetWidth);
    const total =
      widths.reduce((sum, w) => sum + w, 0) +
      SOURCE_ROW_GAP * (widths.length - 1);
    setSourceSplitAt(
      total > wrapper.clientWidth ? findBalancedSplitIndex(widths) : null
    );
  }, []);

  // refreshKey rebinds after open/data change — the wrapper isn't in the DOM
  // on first mount, and the hook doesn't retry a null ref by itself.
  useObserveElementResize({
    targetRef: imageWrapperRef,
    onResize: measureSourceRows,
    refreshKey: mediaItems,
  });

  const titleText = useMemo(() => {
    if (isImage) return t('header.items.product.image.template');
    const key = headerProducts[selectDetailData?.effectName]?.replaceAll(
      '-',
      '.'
    );
    if (!key) return '';
    return t(`header.items.product.${key}`);
  }, [isImage, selectDetailData?.effectName, t]);

  const subTitleText = useMemo(() => {
    const ts = selectDetailData?.ts;
    return ts ? timeUtils.formatTsForVideoFeature(ts) : '';
  }, [selectDetailData?.ts]);

  const handleModalClose = useCallback(() => {
    setSelectDetailData(null);
    setVideoResolution({ width: 0, height: 0 }); // 重置解析度
  }, [setSelectDetailData]);

  const handleVideoLoadedMetadata = useCallback((e) => {
    const video = e.target;
    if (video.videoWidth && video.videoHeight) {
      setVideoResolution({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    }
  }, []);

  const handleImageLoad = useCallback((e) => {
    const image = e.target;
    if (image.naturalWidth && image.naturalHeight) {
      setVideoResolution({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    }
  }, []);

  // Cross-promote keeps the user on the same outer RESULT_PAGE_CONTAINER_ID
  // (Next.js shallow route), so the previous module's scroll position
  // carries over to the new module's page. rAF x2 waits for React to flush
  // post-crossPromote dispatches (e.g. setCurrentResultTab(1)) before
  // scrolling so the smooth animation doesn't race the tab-switch commit.
  const scrollToTopAfterCrossPromote = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToTop());
    });
  }, [scrollToTop]);

  const onVideoEnhancerClick = useCallback(async () => {
    await crossPromoteForVideoFeature(moduleTypes.videoSr, null, url, {
      initStateSoftFlag: true,
    });
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  const onFaceSwapClick = useCallback(async () => {
    await crossPromoteForVideoFeature(moduleTypes.faceSwapVid, null, url, {
      initStateSoftFlag: true,
    });
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  const onStyleTransferClick = useCallback(async () => {
    await crossPromoteForVideoFeature(moduleTypes.aiVideoFilters, null, url, {
      initStateSoftFlag: true,
    });
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  const onObjectRemovalClick = useCallback(async () => {
    await crossPromoteForVideoFeature(moduleTypes.videoObjRemover, null, url, {
      initStateSoftFlag: true,
    });
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  const onVideoEditorClick = useCallback(async () => {
    await crossPromoteForVideoFeature(moduleTypes.aiVideoEditor, null, url, {
      initStateSoftFlag: true,
    });
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  const onCharacterMotionSwapClick = useCallback(async () => {
    await crossPromoteForVideoFeature(
      moduleTypes.characterMotionSwap,
      null,
      url,
      { initStateSoftFlag: true }
    );
    handleModalClose();
    scrollToTopAfterCrossPromote();
  }, [
    crossPromoteForVideoFeature,
    url,
    handleModalClose,
    scrollToTopAfterCrossPromote,
  ]);

  // Image Template's own next-action set (isImage) — same shape as the video
  // handlers above, but via crossPromoteWithAfterImage (the image analog of
  // crossPromoteForVideoFeature: it fetches `url` itself and seeds the
  // target tool's chain state with it, no `initStateSoftFlag` opt).
  const crossPromoteToImageFeature = useCallback(
    async (targetModuleType, targetSodType = null) => {
      await crossPromoteWithAfterImage(url, targetModuleType, targetSodType);
      handleModalClose();
      scrollToTopAfterCrossPromote();
    },
    [
      crossPromoteWithAfterImage,
      url,
      handleModalClose,
      scrollToTopAfterCrossPromote,
    ]
  );

  const onImageToVideoClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.img2Vid),
    [crossPromoteToImageFeature]
  );

  // txt2Img's own result page defaults to its Img2Img tab whenever no `tab`
  // query is present (text-to-image/hooks/use-tabs.js's getInitialTab
  // fallback) and auto-populates that tab's refImages from the incoming
  // chain image (text-to-image/hooks/use-logic.js's init()) — so landing
  // here with no sodType already lands on Img2Img with this image loaded.
  const onImageToImageClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.txt2Img),
    [crossPromoteToImageFeature]
  );

  const onPhotoEnhanceClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.enhance),
    [crossPromoteToImageFeature]
  );

  const onImageObjectRemovalClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.objRemoval),
    [crossPromoteToImageFeature]
  );

  const onAiReplaceClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.objReplace),
    [crossPromoteToImageFeature]
  );

  const onAiExtendClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.outPaint),
    [crossPromoteToImageFeature]
  );

  const onPhotoRepairClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.aiPhotoRepair),
    [crossPromoteToImageFeature]
  );

  // NextAction's "More" popup (image-template only) — Remove BG is the
  // `sod` tool's `remove` sodType, not its own moduleType (same resolution
  // moduleTypeToURL uses for productUrls[sod].remove elsewhere, e.g.
  // sideBarMenuUtils.js's own Remove Background entry).
  const onRemoveBgClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.sod, sodTypes.remove),
    [crossPromoteToImageFeature]
  );

  const onLightingClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.lighting),
    [crossPromoteToImageFeature]
  );

  const onEffectClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.photoFilterEffect),
    [crossPromoteToImageFeature]
  );

  const onCropClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.cropPhoto),
    [crossPromoteToImageFeature]
  );

  const onAdjustClick = useCallback(
    () => crossPromoteToImageFeature(moduleTypes.adjustLightColor),
    [crossPromoteToImageFeature]
  );

  const aiGenerateTrackingParams = useMemo(() => {
    const dataItem = selectDetailData?.dataItem;
    const effectName = selectDetailData?.effectName;
    const taskId = dataItem?.taskId || dataItem?.id;

    const outputData = extractVideoTrackingData(
      taskId,
      dataItem?.result,
      {},
      effectName
    );
    const inputData = extractInputMediaTrackingData(dataItem?.result);
    const resolvedDuration =
      outputData.outputVideoDuration === 'unknown'
        ? null
        : outputData.outputVideoDuration;
    return {
      moduleType: effectName,
      taskId,
      videoModelName:
        outputData.videoModelName === 'unknown'
          ? null
          : outputData.videoModelName,
      // aiGenerateTracking (verbatim inputData) carries the real entry
      // source recorded at generate time; outputData.source only ever
      // resolves through an always-empty taskInfo here, so it's just the
      // last-resort default for pre-stash history items.
      source: inputData.source || outputData.source,
      outputVideoUrl: outputData.outputVideoUrl,
      outputVideoResolution: outputData.outputVideoResolution,
      outputVideoDuration: resolvedDuration,
      // Editing-type features (enhance/filter/object-remover/face-swap/video-editor)
      // don't change duration, so the same resolved value is also the input's.
      // Only attach it when there's actually an input video (skips text/image-to-video).
      inputVideoDuration:
        inputData.inputVideoNum !== '0' ? resolvedDuration : null,
      templateGuid: outputData.templateGuid,
      ...inputData,
    };
  }, [selectDetailData]);

  const onLikeClick = useCallback(() => {
    trackAIGenerateFeedback('good', aiGenerateTrackingParams);
  }, [aiGenerateTrackingParams]);

  const onDislikeClick = useCallback(() => {
    trackAIGenerateFeedback('bad', aiGenerateTrackingParams);
  }, [aiGenerateTrackingParams]);

  const onDownloadClick = useCallback(() => {
    const ext = isImage ? 'png' : 'mp4';
    fetchAndGenerateAnchorAndDownloadVideo(
      selectDetailData?.url,
      `${generateDownloadFileName(selectDetailData?.effectName)}.${ext}`
    );
    trackAIGenerateDownload(aiGenerateTrackingParams);
  }, [
    isImage,
    fetchAndGenerateAnchorAndDownloadVideo,
    selectDetailData?.url,
    selectDetailData?.effectName,
    aiGenerateTrackingParams,
  ]);

  const onEditClick = useCallback(async () => {
    // My Gallery opens this modal off a tool page and passes `onRetry`: a real
    // cross-page history handoff is needed there so the freshly-mounted tool
    // page restores the original settings via initPage's history flow. The
    // in-place initHistoryTask below only applies when a result page is already
    // mounted (same-component shallow transition).
    if (onRetry) {
      // The raw item alone cannot identify the product under a shared effect.
      onRetry(selectDetailData?.dataItem, crossModuleType);
      return;
    }

    if (moduleType === crossModuleType) {
      handleModalClose();
    }

    await shallowRoute(crossModuleType, null, true);
    await initHistoryTask(crossModuleType, null, {
      historyResult: selectDetailData?.dataItem,
    });
    // Scroll is handled by the target module's own history branch via
    // `isClickEditButton && scrollToTop()`. Scrolling here would fire before
    // the target's effects commit and get cancelled by iOS Safari's
    // mid-animation DOM shifts.
  }, [
    onRetry,
    moduleType,
    crossModuleType,
    shallowRoute,
    initHistoryTask,
    selectDetailData?.dataItem,
    handleModalClose,
  ]);

  const handleMediaPreviewOpen = useCallback((index) => {
    setMediaPreviewIndex(index);
    setMediaPreviewOpened(true);
  }, []);

  const handleMediaPreviewClose = useCallback(() => {
    setMediaPreviewOpened(false);
  }, []);

  // 當 MediaPreviewModal 打開時，暫停主影片
  useEffect(() => {
    if (mediaPreviewOpened && videoRef.current) {
      videoRef.current.pause();
    }
  }, [mediaPreviewOpened]);

  const updateVideoWrapperHeight = () => {
    if (contentRef.current && videoWrapperRef.current) {
      const contentHeight = contentRef.current.clientHeight;
      // videoWrapper 的 maxHeight = content 的高度減去 padding/gap
      videoWrapperRef.current.style.maxHeight = `${contentHeight - 16}px`;
    }
  };

  useObserveElementResize({
    targetRef: contentRef,
    onResize: updateVideoWrapperHeight,
  });

  return (
    <>
      <Modal
        showModalScaleTransition={true}
        handleClose={handleModalClose}
        opened={opened}
        containerClassName={styles.modalBackground}
        modalClassName={styles.modalContainer}
      >
        <div className={styles.content} ref={contentRef}>
          <div className={styles.left}>
            {url && (
              <div className={styles.videoWrapper} ref={videoWrapperRef}>
                {isImage ? (
                  <img
                    className={styles.video}
                    src={url}
                    onLoad={handleImageLoad}
                    alt=""
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className={styles.video}
                    src={url}
                    controls
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={handleVideoLoadedMetadata}
                  />
                )}
              </div>
            )}
          </div>

          <div className={styles.right}>
            <div className={styles.header}>
              <div className={styles.title}>{titleText}</div>
              <div className={styles.subTitle}>{subTitleText}</div>
            </div>

            <div className={styles.scrollArea}>
              <div>
                <div className={styles.title}>
                  {t('video.detail.modal.original.source')}
                </div>

                {mediaRows.length > 0 && (
                  <div className={styles.imageWrapper} ref={imageWrapperRef}>
                    {mediaRows.map((row, rowIndex) => (
                      <div key={rowIndex} className={styles.sourceRow}>
                        {row.map((item, indexInRow) => {
                          // Global index into mediaItems — keeps MediaPreviewModal in sync
                          const index =
                            rowIndex === 0
                              ? indexInRow
                              : mediaRows[0].length + indexInRow;
                          const key =
                            item.id || item.dstKey || item.url || index;
                          const onClick = () => handleMediaPreviewOpen(index);

                          return item.type === 'image' ? (
                            <img
                              key={key}
                              src={item.url}
                              className={styles.sourceImage}
                              onClick={onClick}
                              onLoad={measureSourceRows}
                              alt=""
                            />
                          ) : (
                            <div
                              key={key}
                              className={styles.videoThumbnail}
                              onClick={onClick}
                            >
                              <video
                                className={styles.sourceImage}
                                src={`${item.url}#t=0.001`}
                                width={178}
                                height={100}
                                muted
                                playsInline
                                preload="auto"
                                onLoadedMetadata={measureSourceRows}
                              />
                              <img
                                src="/assets/images/videoCommonModal/video.svg"
                                alt=""
                                className={styles.playIcon}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {selectDetailData?.modelName && (
                  <div className={styles.detailRow}>
                    <div className={styles.subTitle}>
                      {isTemplate
                        ? t('image.to.video.settings.template')
                        : t('video.detail.modal.model')}
                    </div>
                    <div className={styles.modelName}>
                      {selectDetailData?.modelName}
                    </div>
                  </div>
                )}

                {!isImage && videoWidth > 0 && videoHeight > 0 && (
                  <div className={styles.detailRow}>
                    <div className={styles.subTitle}>
                      {t('image.to.video.settings.image.resolution')}
                    </div>
                    <div className={styles.resolution}>
                      {videoWidth} x {videoHeight}
                    </div>
                  </div>
                )}

                {!isImage && selectDetailData?.duration && (
                  <div className={styles.detailRow}>
                    <div className={styles.subTitle}>
                      {t('video.detail.modal.video.length')}
                    </div>
                    <div className={styles.duration}>
                      {Math.floor(selectDetailData?.duration)}s
                    </div>
                  </div>
                )}
              </div>

              {selectDetailData?.prompt && (
                <Prompt
                  prompt={selectDetailData?.prompt || ''}
                  variant={promptTypes.VIDEO_DIALOGUE}
                  historyLink={null}
                  placeholderLabel={null}
                  shouldUseOnChange={false}
                />
              )}
            </div>

            <NextAction
              videoId={selectDetailData?.dataItem?.id}
              currentModuleType={selectDetailData?.effectName}
              isImage={isImage}
              containerClassName={styles.nextActionContainer}
              optionButtonClassName={styles.nextOptionButton}
              onVideoEnhancerClick={onVideoEnhancerClick}
              onFaceSwapClick={onFaceSwapClick}
              onStyleTransferClick={onStyleTransferClick}
              onObjectRemovalClick={onObjectRemovalClick}
              onVideoEditorClick={onVideoEditorClick}
              onCharacterMotionSwapClick={onCharacterMotionSwapClick}
              onImageToVideoClick={onImageToVideoClick}
              onImageToImageClick={onImageToImageClick}
              onPhotoEnhanceClick={onPhotoEnhanceClick}
              onImageObjectRemovalClick={onImageObjectRemovalClick}
              onAiReplaceClick={onAiReplaceClick}
              onAiExtendClick={onAiExtendClick}
              onPhotoRepairClick={onPhotoRepairClick}
              onRemoveBgClick={onRemoveBgClick}
              onLightingClick={onLightingClick}
              onEffectClick={onEffectClick}
              onCropClick={onCropClick}
              onAdjustClick={onAdjustClick}
              onLikeClick={onLikeClick}
              onDislikeClick={onDislikeClick}
              onDownloadClick={onDownloadClick}
              onEditClick={onEditClick}
            />
          </div>
        </div>

        <div
          className={styles.close}
          style={{ backgroundImage: 'url(/assets/images/icon_close.svg)' }}
          onClick={handleModalClose}
        />
      </Modal>

      <MediaPreviewModal
        key={mediaPreviewOpened ? 'opened' : 'closed'} // Force remount on open/close
        items={mediaItems}
        currentIndex={mediaPreviewIndex}
        onIndexChange={setMediaPreviewIndex}
        opened={mediaPreviewOpened}
        onClose={handleMediaPreviewClose}
      />
    </>
  );
}
