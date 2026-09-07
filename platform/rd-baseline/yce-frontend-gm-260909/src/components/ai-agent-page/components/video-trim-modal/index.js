import { useEffect, useState } from 'react';
import styles from './index.module.scss';
import Modal from '@/components/common/modal';
import useScrollLock from '@/hooks/use-scroll-lock';
import useObjectURL from '@/hooks/use-object-url';
import useVideoTrim from './use-video-trim';
import TrimVideoPreview from './trim-video-preview';
import TrimTimeline from './trim-timeline';
import {
  isTrimRangeTooLong,
  snapTrimRangeToDisplayedDuration,
} from './constants';

export default function VideoTrimModal({
  opened,
  videoFile,
  onCancel,
  onConfirm,
  t,
}) {
  useScrollLock(opened);

  // Keep rendering the last video while the shared Modal plays its close
  // transition (parent nulls videoFile the same render it flips opened=false).
  const [activeVideoFile, setActiveVideoFile] = useState(videoFile);
  useEffect(() => {
    if (videoFile) setActiveVideoFile(videoFile);
  }, [videoFile]);

  const videoUrl = useObjectURL(activeVideoFile);

  const {
    videoRef,
    duration,
    isPlaying,
    isMuted,
    currentTime,
    setCurrentTime,
    trimRange,
    setTrimRange,
    aspectRatio,
    handleLoadedMetadata,
    togglePlay,
    toggleMute,
    stop,
    unload,
    resume,
  } = useVideoTrim(videoUrl);

  // Gates "Use Video" until the timeline's own thumbnail-generation decode
  // session (a separate mediabunny Input over the same file) has released
  // the file, so it isn't still competing with trimVideoFile's decode+encode
  // pass for hardware video decoder resources.
  const [thumbnailsReady, setThumbnailsReady] = useState(false);

  const handleCancel = () => {
    stop();
    onCancel?.();
  };

  const handleUseVideo = () => {
    if (!thumbnailsReady) return;
    const thumbnail = unload();
    onConfirm?.(snapTrimRangeToDisplayedDuration(trimRange), thumbnail);
  };

  const isTooLong = isTrimRangeTooLong(trimRange);

  return (
    <Modal
      opened={opened}
      handleClose={handleCancel}
      modalClassName={styles.trimModal}
      customStyles={{
        width: 'min(700px, 100%)',
        padding: '32px',
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.16)',
      }}
    >
      <div className={styles.trimContent}>
        <div className={styles.trimTitle}>{t('ai.agent.trim.title')}</div>

        <TrimVideoPreview
          videoRef={videoRef}
          videoUrl={videoUrl}
          isPlaying={isPlaying}
          isMuted={isMuted}
          aspectRatio={aspectRatio}
          onLoadedMetadata={handleLoadedMetadata}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
        />

        <TrimTimeline
          t={t}
          videoRef={videoRef}
          videoFile={activeVideoFile}
          duration={duration}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          trimRange={trimRange}
          setTrimRange={setTrimRange}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          stop={stop}
          resume={resume}
          onThumbnailsReadyChange={setThumbnailsReady}
        />

        <div className={styles.trimActions}>
          <button className={styles.btnCancel} onClick={handleCancel}>
            {t('ai.agent.trim.cancel')}
          </button>
          <button
            className={styles.btnUse}
            onClick={handleUseVideo}
            disabled={isTooLong || !thumbnailsReady}
          >
            {t('ai.agent.trim.use.video')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
