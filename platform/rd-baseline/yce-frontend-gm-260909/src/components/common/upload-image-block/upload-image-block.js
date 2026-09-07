import { getTranslationFunction } from '@/i18n';
import styles from './upload-image-block.module.scss';
import YCEUploadDashedBorder from '@/components/common/yce-upload-dashed-border';
import HiddenFileInput from '@/components/result-page/common/hidden-file-input';
import ReferencePhoto from '../reference-photo';
import MediaPreviewModal from '@/components/result-page/common/video-feature/media-preview-modal';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import useHandleFile from '@/components/home/components/hooks/use-handle-file';
import { useSelector } from 'react-redux';
import { moduleTypes } from '@/utils/moduleTypes';
import { upMarkNextPaint } from '@/utils/uploadTiming';
import {
  MuteIcon,
  UnmuteIcon,
  PlayIcon,
  PauseIcon,
} from '@/components/common/icons/video-controls';

function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * UploadMediaBlock — unified upload block for image or video.
 *
 * Two upload modes (mutually exclusive):
 *  1. **External input** (`onUploadClick`): caller owns its own <HiddenFileInput>
 *     with custom accept types (e.g. video-only). The internal file input is bypassed.
 *  2. **Internal input** (`onFileSelect`): uses the built-in <HiddenFileInput>.
 *     Accept types are determined by `customAccept` prop or HiddenFileInput defaults.
 *
 * Preview:
 *  - `imageUrl`: thumbnail shown in the upload area (image or video first-frame).
 *  - `videoUrl` + `isVideo`: clicking the thumbnail opens MediaPreviewModal.
 *  - Without `isVideo`, clicking opens ReferencePhoto lightbox.
 */
const UploadMediaBlock = (props) => {
  const {
    uploadTextTitle: uploadTextTitleProp,
    uploadTextDesc = null,
    // Mode 1: override click → caller triggers its own file input
    onUploadClick,
    onEditMedia = () => {},
    onRemoveMedia = () => {},
    imageUrl = null,
    videoUrl = null,
    isVideo = false,
    videoDuration = null,
    showVideoControls = false,
    // Mode 2: internal file input → caller receives the selected File
    onFileSelect = () => {},
    canDrop = false,
    showRemoveButton = true,
    showReuploadButton = false,
    customAccept = null,
    descTags = null,
    hintLabel = null, // 通常是圖片要求上傳的格式說明，render 在 upload area 下方
  } = props;

  const uploadTextTitle =
    uploadTextTitleProp ??
    (isVideo
      ? 'video.enhance.tool.upload.video.title'
      : 'image.to.video.upload.image');

  const [refImageOpened, setRefImageOpened] = useState(false);
  const [videoPreviewOpened, setVideoPreviewOpened] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const { t } = getTranslationFunction();

  const moduleType = useSelector((state) => state.info.moduleType);

  const { dropMethods } = useHandleFile({
    moduleType: moduleType,
    canDrop,
  });

  const {
    handleDragEnter,
    handleDragLeave,
    cancelDefault,
    dragging,
    setDragging,
  } = dropMethods;

  const openFilePicker = () => inputRef.current.click();

  const handleDrop = (e) => {
    cancelDefault(e);
    const file = e.dataTransfer.files[0];
    onFileSelect(file);
    setDragging(false);
  };

  const handleInputFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = null;
    onFileSelect(file);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (isVideo && videoUrl) {
      setVideoPreviewOpened(true);
    } else {
      setRefImageOpened(true);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const videoItems = useMemo(() => {
    if (!videoUrl) return [];
    return [{ url: videoUrl, type: 'video' }];
  }, [videoUrl]);

  // Resolve upload handler: external override takes priority over internal file picker
  const onUpload = onUploadClick ?? openFilePicker;

  useEffect(() => {
    if (imageUrl && imageRef.current) {
      setImageReady(false);
      const img = imageRef.current;
      // YCO260709 upload-timing diagnostic: img2Vid has no dedicated
      // before/after image preview, so this shared upload thumbnail is the
      // closest analog to the "image decoded/painted" mark other features fire.
      const markDecoded = () => {
        if (moduleType === moduleTypes.img2Vid) {
          upMarkNextPaint('img2Vid-image-decoded', null, true);
        }
      };
      if (img.complete) {
        setImageReady(true);
        markDecoded();
      } else {
        const onLoad = () => {
          setImageReady(true);
          markDecoded();
        };
        img.addEventListener('load', onLoad);
        return () => img.removeEventListener('load', onLoad);
      }
    } else if (!imageUrl) {
      setImageReady(false);
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
      setIsMuted(true);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!videoUrl) return;
    if (isPlaying) setIsPlaying(false);
  }, [videoUrl]);

  return (
    <>
      {!imageUrl ? (
        <div
          className={`${
            dragging ? styles.containerDragging : styles.container
          }`}
          onClick={() => onUpload()}
          onDragEnter={canDrop ? handleDragEnter : null}
          onDragLeave={canDrop ? handleDragLeave : null}
          onDragOver={canDrop ? cancelDefault : null}
          onDrop={canDrop ? handleDrop : null}
        >
          <YCEUploadDashedBorder strokeDasharray={'6 6'} />
          <img
            className={styles.icon}
            src="/assets/images/txt2Img/settings/add_image_icon.svg"
            alt=""
          />
          <div className={styles.textWrapper}>
            <div className={styles.uploadTitle}>{t(uploadTextTitle)}</div>
            {descTags?.length > 0 ? (
              <div className={styles.descTags}>
                {descTags.map((tag) => (
                  <span key={tag} className={styles.descTag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.uploadDesc}>{t(uploadTextDesc)}</div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={styles.mediaContainer}
          onClick={() => {
            onEditMedia();
          }}
        >
          {isVideo && videoUrl ? (
            <div className={styles.videoWrapper}>
              <video
                ref={videoRef}
                className={styles.video}
                src={videoUrl}
                poster={imageUrl}
                muted={isMuted}
                preload="metadata"
                playsInline
                onEnded={handleVideoEnded}
              />
              {showVideoControls && (
                <>
                  <button
                    className={`${styles.videoOverlayBtn} ${styles.videoMuteBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                  >
                    {isMuted ? (
                      <MuteIcon width={12} height={12} />
                    ) : (
                      <UnmuteIcon width={12} height={12} />
                    )}
                  </button>
                  <button
                    className={`${styles.videoOverlayBtn} ${styles.videoPlayBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                  >
                    {isPlaying ? (
                      <PauseIcon width={12} height={12} />
                    ) : (
                      <PlayIcon width={12} height={12} />
                    )}
                  </button>
                  {videoDuration != null && (
                    <span className={styles.videoDurationText}>
                      {formatDuration(videoDuration)}
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={styles.imageWrapper}>
              <img
                ref={imageRef}
                className={styles.image}
                src={imageUrl}
                onClick={handleClick}
                style={{ visibility: imageReady ? 'visible' : 'hidden' }}
              />
            </div>
          )}
          <div
            className={showReuploadButton ? styles.iconButtonGroup : undefined}
          >
            {showRemoveButton && (
              <div className={styles.iconCancelWrapper}>
                <img
                  src="/assets/images/txt2Img/settings/reference_photo/cancel_icon3.svg"
                  alt=""
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveMedia();
                  }}
                />
              </div>
            )}
            {showReuploadButton && (
              <div
                className={styles.iconCancelWrapper}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload();
                }}
              >
                <img
                  src={
                    isVideo
                      ? '/assets/images/interactionToolsBar/video_upload_icon.svg'
                      : '/assets/images/interactionToolsBar/photo_upload_icon.svg'
                  }
                  alt=""
                />
              </div>
            )}
          </div>
        </div>
      )}
      {hintLabel && <div className={styles.uploadHint}>{hintLabel}</div>}
      <HiddenFileInput
        inputRef={inputRef}
        handleInputFileChange={handleInputFileChange}
        customAccept={customAccept}
      />
      {refImageOpened && imageUrl && (
        <ReferencePhoto
          refImageOpened={refImageOpened}
          setRefImageOpened={setRefImageOpened}
          src={imageUrl}
        />
      )}
      {videoPreviewOpened && videoUrl && (
        <MediaPreviewModal
          items={videoItems}
          currentIndex={0}
          onIndexChange={() => {}}
          opened={videoPreviewOpened}
          onClose={() => setVideoPreviewOpened(false)}
          hideArrows={true}
        />
      )}
    </>
  );
};

export default UploadMediaBlock;
