import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import styles from './index.module.scss';
import TextActionButton from './textActionButton';
import IconActionButtons from '../icon-action-buttons';
import Icon from '../icon-action-buttons/icon';
import { getTranslationFunction } from '@/i18n';
import { moduleTypes } from '@/utils/moduleTypes';
import useObserveElementResize from '@/components/result-page/hooks/ui/use-observer-element-resize';

// [v1.30.0] 不再過濾當前 moduleType 對應的 action，所有 action 都會顯示
// moduleType 到 action id 的映射（用於過濾當前 moduleType 對應的 action）
// const MODULETYPE_TO_ACTION_MAP = {
//   [moduleTypes.videoSr]: 'video-enhancer',
//   [moduleTypes.faceSwapVid]: 'face-swap',
//   [moduleTypes.aiVideoFilters]: 'style-transfer',
// };

const NextAction = ({
  videoId,
  currentModuleType,
  isImage = false,
  onVideoEnhancerClick = () => {},
  onFaceSwapClick = () => {},
  onStyleTransferClick = () => {},
  onObjectRemovalClick = () => {},
  onVideoEditorClick = () => {},
  onCharacterMotionSwapClick = () => {},
  onImageToVideoClick = () => {},
  onImageToImageClick = () => {},
  onPhotoEnhanceClick = () => {},
  onImageObjectRemovalClick = () => {},
  onAiReplaceClick = () => {},
  onAiExtendClick = () => {},
  onPhotoRepairClick = () => {},
  onRemoveBgClick = () => {},
  onLightingClick = () => {},
  onEffectClick = () => {},
  onCropClick = () => {},
  onAdjustClick = () => {},
  onLikeClick = () => {},
  onDislikeClick = () => {},
  onDownloadClick = () => {},
  onEditClick = () => {},
  containerClassName = '',
  optionButtonClassName = '',
} = {}) => {
  const { t } = getTranslationFunction();

  const videoActionOptions = useMemo(
    () => [
      {
        id: 'video-enhancer',
        icon: 'video-enhancer',
        title: t('header.items.product.video.enhancer'),
      },
      {
        id: 'face-swap',
        icon: 'face-swap',
        title: t('cross.promote.to.face.swap'),
      },
      {
        id: 'style-transfer',
        icon: 'style-transfer',
        title: t('text.to.video.next.action.option.title.style.transfer'),
      },
      {
        id: 'object-removal',
        icon: 'object-removal',
        title: t('header.items.product.object.removal'),
      },
      {
        id: 'video-editor',
        icon: 'video-editor',
        title: t('header.items.product.ai.video.editor'),
      },
      {
        id: 'character-motion-swap',
        icon: 'character-motion-swap',
        title: t('header.items.product.ai.motion.transfer'),
      },
    ],
    [t]
  );

  // Image Template's own action set — click behavior is still TBD (see
  // actionHandlers below), this only wires up the visuals.
  const imageActionOptions = useMemo(
    () => [
      {
        id: 'image-to-video',
        icon: 'image-to-video',
        title: t('header.items.product.img.to.video'),
      },
      {
        id: 'image-to-image',
        icon: 'image-to-image',
        title: t('ai.agent.feature.image.to.image'),
      },
      {
        id: 'photo-enhance',
        icon: 'photo-enhance',
        title: t('text.to.video.next.action.option.title.photo.enhance'),
      },
      {
        id: 'object-removal',
        icon: 'image-object-removal',
        title: t('header.items.product.object.removal'),
      },
      {
        id: 'ai-replace',
        icon: 'ai-replace',
        title: t('header.items.product.obj.replace'),
      },
      {
        id: 'ai-extend',
        icon: 'ai-extend',
        title: t('text.to.video.next.action.option.title.ai.extend'),
      },
      {
        id: 'photo-repair',
        icon: 'photo-repair',
        title: t('header.items.product.ai.photo.repair'),
      },
      {
        id: 'more',
        icon: 'edit',
        title: t('result.features.panel.button.more'),
      },
    ],
    [t]
  );

  // Sub-menu revealed by the image action set's 'more' button.
  const moreMenuItems = useMemo(
    () => [
      {
        id: 'remove-bg',
        icon: 'remove-bg',
        title: t('text.to.video.next.action.option.title.remove.bg'),
      },
      {
        id: 'lighting',
        icon: 'lighting',
        title: t('footer.items.product.lighting'),
      },
      {
        id: 'effect',
        icon: 'effect',
        title: t('text.to.video.next.action.option.title.effect'),
      },
      {
        id: 'crop',
        icon: 'crop',
        title: t('header.items.product.crop.photo'),
      },
      {
        id: 'adjust',
        icon: 'adjust',
        title: t('text.to.video.next.action.option.title.adjust'),
      },
    ],
    [t]
  );

  const moreMenuHandlers = useMemo(
    () => ({
      'remove-bg': onRemoveBgClick,
      lighting: onLightingClick,
      effect: onEffectClick,
      crop: onCropClick,
      adjust: onAdjustClick,
    }),
    [
      onRemoveBgClick,
      onLightingClick,
      onEffectClick,
      onCropClick,
      onAdjustClick,
    ]
  );

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRootRef = useRef(null);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;
    const onDocMouseDown = (e) => {
      if (
        moreMenuRootRef.current &&
        !moreMenuRootRef.current.contains(e.target)
      ) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [moreMenuOpen]);

  // [v1.30.0] 不再過濾，所有 action 都顯示
  // const actionOptions = useMemo(() => {
  //   const currentActionId = MODULETYPE_TO_ACTION_MAP[currentModuleType];
  //   if (!currentActionId) return allActionOptions;
  //   return allActionOptions.filter((option) => option.id !== currentActionId);
  // }, [allActionOptions, currentModuleType]);
  const actionOptions = isImage ? imageActionOptions : videoActionOptions;

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
        id: 'download',
        title: t('header.items.download'),
      },
    ],
    [t]
  );

  const videoActionHandlers = useMemo(
    () => ({
      'video-enhancer': onVideoEnhancerClick,
      'face-swap': onFaceSwapClick,
      'style-transfer': onStyleTransferClick,
      'object-removal': onObjectRemovalClick,
      'video-editor': onVideoEditorClick,
      'character-motion-swap': onCharacterMotionSwapClick,
    }),
    [
      onVideoEnhancerClick,
      onFaceSwapClick,
      onStyleTransferClick,
      onObjectRemovalClick,
      onVideoEditorClick,
      onCharacterMotionSwapClick,
    ]
  );
  const imageActionHandlers = useMemo(
    () => ({
      'image-to-video': onImageToVideoClick,
      'image-to-image': onImageToImageClick,
      'photo-enhance': onPhotoEnhanceClick,
      'object-removal': onImageObjectRemovalClick,
      'ai-replace': onAiReplaceClick,
      'ai-extend': onAiExtendClick,
      'photo-repair': onPhotoRepairClick,
      // 'more' isn't a single cross-promote target — it's special-cased in
      // the render below to toggle the moreMenuOpen popup instead.
    }),
    [
      onImageToVideoClick,
      onImageToImageClick,
      onPhotoEnhanceClick,
      onImageObjectRemovalClick,
      onAiReplaceClick,
      onAiExtendClick,
      onPhotoRepairClick,
    ]
  );
  const actionHandlers = isImage ? imageActionHandlers : videoActionHandlers;

  const iconHandlers = useMemo(
    () => ({
      like: onLikeClick,
      dislike: onDislikeClick,
      download: onDownloadClick,
    }),
    [onDownloadClick, onLikeClick, onDislikeClick]
  );

  const containerRef = useRef(null);
  const actionGridRef = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const checkOverflow = useCallback(() => {
    const containerEl = containerRef.current;
    const gridEl = actionGridRef.current;
    if (!containerEl || !gridEl) return;

    // 暫時切成 max-content 測量 actionOptions 的自然寬度
    const original = gridEl.style.gridTemplateColumns;
    gridEl.style.gridTemplateColumns = 'repeat(2, max-content)';
    const naturalWidth = gridEl.scrollWidth;
    gridEl.style.gridTemplateColumns = original;

    setIsOverflow(naturalWidth > containerEl.clientWidth);
  }, []);

  useObserveElementResize({
    targetRef: containerRef,
    onResize: checkOverflow,
  });

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${containerClassName} ${
        isOverflow ? styles.overflowed : ''
      }`}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          {t('text.to.video.next.action.title')}
        </div>
      </div>
      <div className={styles.actionOptions} ref={actionGridRef}>
        {actionOptions.map((option) =>
          option.id === 'more' ? (
            <div
              key={option.id}
              className={styles.moreMenuWrapper}
              ref={moreMenuRootRef}
            >
              <TextActionButton
                icon={option.icon}
                onClick={() => setMoreMenuOpen((opened) => !opened)}
                title={option.title}
                optionButtonClassName={optionButtonClassName}
              />
              {moreMenuOpen && (
                <div className={styles.moreMenu}>
                  {moreMenuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.moreMenuItem}
                      onClick={() => {
                        setMoreMenuOpen(false);
                        moreMenuHandlers[item.id]?.();
                      }}
                    >
                      <Icon name={item.icon} />
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <TextActionButton
              key={option.id}
              icon={option.icon}
              onClick={actionHandlers[option.id]}
              title={option.title}
              optionButtonClassName={optionButtonClassName}
            />
          )
        )}
        {!isOverflow && actionOptions.length % 2 === 1 && <div />}
      </div>
      <div className={styles.actionOptions}>
        <IconActionButtons
          videoId={videoId}
          actions={iconActions}
          handlers={iconHandlers}
          centered={isOverflow}
        />
        <button className={styles.editButton} onClick={onEditClick}>
          {t('text.to.video.next.action.retry')}
        </button>
      </div>
    </div>
  );
};

export default NextAction;
