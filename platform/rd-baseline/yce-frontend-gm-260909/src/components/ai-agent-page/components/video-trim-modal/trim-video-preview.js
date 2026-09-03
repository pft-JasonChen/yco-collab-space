import styles from './trim-video-preview.module.scss';
import {
  MuteIcon,
  PauseIcon,
  PlayIcon,
  UnmuteIcon,
} from '@/components/common/icons/video-controls';

export default function TrimVideoPreview({
  videoRef,
  videoUrl,
  isPlaying,
  isMuted,
  aspectRatio,
  onLoadedMetadata,
  onTogglePlay,
  onToggleMute,
}) {
  return (
    <div className={styles.trimVideoWrap} style={{ aspectRatio }}>
      <video
        ref={videoRef}
        className={styles.trimVideo}
        src={videoUrl}
        preload="auto"
        playsInline
        muted={isMuted}
        onLoadedMetadata={onLoadedMetadata}
      />
      <div className={styles.trimPlayBtn} onClick={onTogglePlay}>
        <div className={styles.trimPlayCircle}>
          {isPlaying ? (
            <PauseIcon width={24} height={24} fill="#03ADE2" />
          ) : (
            <PlayIcon width={24} height={24} fill="#03ADE2" />
          )}
        </div>
      </div>
      <button className={styles.trimMuteBtn} onClick={onToggleMute}>
        {isMuted ? (
          <MuteIcon width={26} height={26} />
        ) : (
          <UnmuteIcon width={26} height={26} />
        )}
      </button>
    </div>
  );
}
