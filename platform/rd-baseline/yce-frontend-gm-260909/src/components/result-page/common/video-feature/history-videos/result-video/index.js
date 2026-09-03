import styles from './index.module.scss';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslationFunction } from '@/i18n';
import VideoPlayer from './video-player';
import FallbackFullscreenBlock from './fallback-fullscreen-block';
import { useDispatch, useSelector } from 'react-redux';
import { updateHistoryByIdToken } from '@/store/actions/taskAction';
import { moduleTypes } from '@/utils/moduleTypes';
import useMappedModelName from '../hooks/use-mapped-model-name';
import useFormattedDate from '../hooks/use-formatted-date';
import useChain from '@/components/result-page/hooks/use-chain';
import useInit from '@/components/result-page/hooks/use-init';
import useHeaderGeneral from '@/components/common/headers/hooks/use-header-general';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import _isNull from 'lodash/isNull';
import _isUndefined from 'lodash/isUndefined';
import useWindowDevice from '@/hooks/use-window-device';
import videoUtils from '@/utils/videoUtils';
import { generateDownloadFileName } from '@/utils/downloadFileNameUtils';
import moduleTypeUtils from '@/utils/moduleTypes';
import IconActionButtons from '../../icon-action-buttons';
import TextActionButton from '../../next-action/textActionButton';
import acmsUtils from '@/utils/acms/acmsUtils';
import {
  trackAIGenerateFeedback,
  trackAIGenerateDownload,
} from '@/utils/countly/countlyAIGenerateUtils';
import {
  extractVideoTrackingData,
  extractInputMediaTrackingData,
} from '@/utils/countly/videoTrackingHelper';

function ResultVideo(props) {
  const { dataItem, settings, setSettings, setSelectDetailData } = props;

  const {
    effectName,
    vendorType,
    modelName,
    name_key,
    prompt,
    ts,
    aiSound,
    aiAud,
    pfAud,
    isTemplate,
    fileName,
    duration,
    width,
    height,
    fps,
    url,
    thumbnail,
    i18n,
  } = videoUtils.extractData(dataItem);

  const [resolution, setResolution] = useState({
    videoWidth: 0,
    videoHeight: 0,
  });
  const [playing, setPlaying] = useState(false);
  const [fallbackFullscreenOpened, setFallbackFullscreenOpened] =
    useState(false);

  const isUpdateHistory = useRef(false);
  const resultVideoRef = useRef(null);
  const containerRef = useRef(null);
  const videoBlockRef = useRef(null);

  const customModalOpen = useSelector((state) => state.ui.customModalOpen);

  // This card is shared by every video-producing module, but this fix is
  // deliberately scoped to videoTemplate only — every other module keeps
  // the exact pre-existing (hardcoded img2Vid) behavior unchanged, even
  // where that's arguably also imprecise for them, to keep this change's
  // blast radius limited to Video Template.
  const resultModuleType =
    effectName === moduleTypes.videoTemplate
      ? moduleTypes.videoTemplate
      : moduleTypes.img2Vid;

  const config =
    useSelector((state) => state.result.productConfig[resultModuleType]) || {};

  const dispatch = useDispatch();

  const { t, locale } = getTranslationFunction();

  const showSoundIcon =
    _isNull(aiSound) || _isUndefined(aiSound) ? aiAud || pfAud : aiSound;

  const mappedModelName = useMappedModelName(name_key, vendorType);
  const formattedDate = useFormattedDate(ts);

  const { isDesktop, isMd, is992 } = useWindowDevice();
  const { crossPromoteForVideoFeature, shallowRoute } = useChain();
  const { initHistoryTask } = useInit();
  const { fetchAndGenerateAnchorAndDownloadVideo } = useHeaderGeneral();

  const taskId = dataItem?.taskId || dataItem?.id;

  const aiGenerateTrackingParams = useMemo(() => {
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
  }, [dataItem, effectName, taskId]);

  const onLikeClick = () =>
    trackAIGenerateFeedback('good', aiGenerateTrackingParams);
  const onDislikeClick = () =>
    trackAIGenerateFeedback('bad', aiGenerateTrackingParams);
  const onDownloadClick = () => {
    fetchAndGenerateAnchorAndDownloadVideo(
      url,
      `${generateDownloadFileName(effectName)}.mp4`
    );
    trackAIGenerateDownload(aiGenerateTrackingParams);
  };
  const onEditClick = async () => {
    // effectName, not the raw effect — the two v2v products share an umbrella
    // effect. Identical to dataItem.effect for every other module.
    const crossModuleType = effectName || dataItem?.effect;

    await shallowRoute(crossModuleType, null, true);
    await initHistoryTask(
      crossModuleType,
      null,
      {
        historyResult: dataItem,
      },
      true
    );
  };

  const onVideoEnhancerClick = async () => {
    await crossPromoteForVideoFeature(moduleTypes.videoSr, null, url, {
      initStateSoftFlag: true,
    });
  };

  const moduleName = useMemo(() => {
    const moduleNameKey = moduleTypeUtils.moduleTypeToModuleName(
      effectName,
      null
    );
    return t(`header.items.product.${moduleNameKey}`);
  }, [effectName, t]);

  const resultVideoMetadata = useMemo(() => {
    const objectUrl = url || '';
    return {
      objectUrl,
      ...resolution,
    };
  }, [dataItem, resolution]);

  const iconActions = useMemo(
    () => [
      {
        id: 'like',
        title: t('text.to.video.next.icon.title.like'),
      },
      {
        id: 'dislike',
        title: t('text.to.video.next.icon.title.dislike'),
      },
      {
        id: 'edit',
        title: t('my.account.me.edit'),
      },
      {
        id: 'download',
        title: t('header.items.download'),
      },
    ],
    [t]
  );

  const iconHandlers = useMemo(
    () => ({
      like: onLikeClick,
      dislike: onDislikeClick,
      download: onDownloadClick,
      edit: onEditClick,
    }),
    [onDownloadClick, onLikeClick, onDislikeClick, onEditClick]
  );

  const actionOptions = useMemo(
    () => [
      {
        id: moduleTypes.videoSr,
        icon: 'video-enhancer',
        title: t('header.items.product.video.enhancer'),
      },
    ],
    [t]
  );

  const actionHandlers = useMemo(
    () => ({
      [moduleTypes.videoSr]: onVideoEnhancerClick,
    }),
    [onVideoEnhancerClick]
  );

  const showTextActionOptions = useMemo(() => {
    if (dataItem?.effect === moduleTypes.videoSr) {
      return false;
    }
    return true;
  }, [dataItem]);

  useEffect(() => {
    const adjustWidthToInteger = () => {
      if (videoBlockRef.current) {
        videoBlockRef.current.style.width = '';
        if (isDesktop) {
          const currentWidth =
            videoBlockRef.current.getBoundingClientRect().width;
          const adjustedWidth = Math.floor(currentWidth);
          videoBlockRef.current.style.width = `${adjustedWidth}px`;
        }
      }
    };

    adjustWidthToInteger();

    window.addEventListener('resize', adjustWidthToInteger);

    const resizeObserver = new ResizeObserver(() => {
      adjustWidthToInteger();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', adjustWidthToInteger);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [isDesktop]);

  // Set result video source src
  useEffect(() => {
    if (!resultVideoRef.current || !url) return;
    resultVideoRef.current.setVideoSrc(url);
  }, [url]);

  const handleVideoEnded = () => {
    resultVideoRef.current?.resetCurrentTime?.(0);
  };

  const handleFallbackFullscreen = () => {
    setFallbackFullscreenOpened(true);
  };

  const handleLoadedMetadata = () => {
    const video = resultVideoRef.current.getVideoCurrent();
    const { videoWidth, videoHeight } = video || {};
    if (!videoWidth || !videoHeight) return;
    // TODO: trigger updateHistory to set video resolution
    setResolution({ videoWidth, videoHeight });
    const width = _get(
      config,
      'historyResult.result.misc.custom.clientCfg.width'
    );
    const height = _get(
      config,
      'historyResult.result.misc.custom.clientCfg.height'
    );
    if (width && height) return;
    if (!isUpdateHistory.current && !_isEmpty(config)) {
      const { historyResult } = config;
      const { id, result } = historyResult;
      dispatch(
        updateHistoryByIdToken({
          effect: resultModuleType,
          id,
          idType: 'historyId',
          status: {
            ...result,
            misc: {
              ...result.misc,
              custom: {
                ...result.misc.custom,
                clientCfg: {
                  ...result.misc.custom.clientCfg,
                  width: videoWidth,
                  height: videoHeight,
                },
              },
            },
          },
        })
      );
      isUpdateHistory.current = true;
    }
  };

  const mute = useMemo(() => {
    if (customModalOpen) return true;
    return settings?.isMute;
  }, [settings?.isMute, customModalOpen]);

  const setMuted = (isMute) => setSettings((ps) => ({ ...ps, isMute }));

  const handleOpenDetailModal = () => {
    if (setSelectDetailData) {
      const detailData = {
        effectName,
        vendorType,
        modelName: isTemplate
          ? acmsUtils.getStyleI18nName({ i18n }, locale, {
              includeDef: true,
            }) || t('image.to.video.settings.template')
          : mappedModelName,
        prompt,
        ts,
        fileName,
        duration,
        fps,
        width,
        height,
        url,
        thumbnail,
        dataItem,
        isTemplate,
      };
      setSelectDetailData(detailData);
    }
  };

  return (
    <div
      id={`history-card-${dataItem.id}`}
      className={styles.container}
      ref={containerRef}
    >
      <div className={styles.title}>
        <div className={styles.block}>{moduleName}</div>
        {
          // if no model name / template, hide this block
          (isTemplate || mappedModelName) && (
            <div className={styles.block}>
              {isTemplate
                ? t('image.to.video.settings.template')
                : mappedModelName}
            </div>
          )
        }
        {!is992 && <div className={styles.date}>{formattedDate}</div>}
      </div>
      {is992 && (
        <div className={styles.title}>
          <div className={styles.date}>{formattedDate}</div>
        </div>
      )}
      <div className={styles.prompt} style={prompt ? {} : { display: 'none' }}>
        <span className={styles.promptTitle}>
          {t('text.to.image.settings.prompt.title')}
        </span>
        <span className={styles.promptDesc}>{prompt}</span>
      </div>
      <div className={styles.videoBlock} ref={videoBlockRef}>
        <VideoPlayer
          ref={resultVideoRef}
          playing={playing}
          setPlaying={setPlaying}
          handleVideoEnded={handleVideoEnded}
          handleLeaveFullscreen={handleVideoEnded}
          handleFallbackFullscreen={handleFallbackFullscreen}
          handleLoadedMetadataCallback={handleLoadedMetadata}
          showSoundIcon={showSoundIcon}
          muted={mute}
          setMuted={setMuted}
          handleOpenDetailModal={handleOpenDetailModal}
          thumbnail={thumbnail}
        />
      </div>
      <div className={styles.actionOptions}>
        <IconActionButtons
          videoId={dataItem.id}
          actions={iconActions}
          handlers={iconHandlers}
        />
        {showTextActionOptions &&
          actionOptions.map((option) => (
            <TextActionButton
              key={option.id}
              icon={option.icon}
              onClick={actionHandlers[option.id]}
              title={option.title}
              hideIcon={!isMd && is992}
            />
          ))}
      </div>

      <FallbackFullscreenBlock
        opened={fallbackFullscreenOpened}
        setOpened={setFallbackFullscreenOpened}
        resultVideoMetadata={resultVideoMetadata}
      />
    </div>
  );
}

export default React.memo(ResultVideo);
