import pauseIcon from '../../../design-library/assets/icon/yco-video-timeline/pause.svg';
import playIcon from '../../../design-library/assets/icon/yco-video-timeline/play.svg';
import styles from './VideoTimeline.module.scss';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatTimelineTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

export default function VideoTimeline({
  posterUrl,
  frameUrls = [],
  duration = 0,
  currentTime = 0,
  startTime = 0,
  endTime,
  isPlaying = false,
  onSeek,
  onPlay,
  onPause,
  synchronized = false,
  frameStrategy,
  thumbnailCount = 10,
  className = '',
}) {
  const selectionEnd = Number.isFinite(endTime) ? endTime : duration;
  const safeEnd = Math.max(startTime, selectionEnd);
  const value = clamp(currentTime, startTime, safeEnd);
  const selectedDuration = Math.max(0, safeEnd - startTime);
  const progress = selectedDuration ? ((value - startTime) / selectedDuration) * 100 : 0;
  const hasCapturedFrames = frameUrls.length > 0;

  return (
    <div
      className={`${styles.timeline} ${className}`}
      data-testid="canvas-playback-timeline"
      data-placement="below-canvas"
      data-synchronized={synchronized ? 'true' : 'false'}
      data-frame-source={hasCapturedFrames ? 'captured-video' : posterUrl ? 'poster' : 'pending'}
      data-frame-count={frameUrls.length}
      data-frame-strategy={frameStrategy}
      data-component-role="video-playback-timeline"
      data-surface-zone="canvas-playback-timeline"
    >
      <button
        className={styles.playButton}
        data-testid="canvas-playback-toggle"
        type="button"
        onClick={isPlaying ? onPause : onPlay}
        disabled={isPlaying ? !onPause : !onPlay}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        <img src={isPlaying ? pauseIcon : playIcon} alt="" aria-hidden="true" />
      </button>
      <div className={styles.track}>
        <div className={styles.frames} aria-hidden="true">
          {Array.from({ length: thumbnailCount }, (_, index) => {
            const frameUrl = frameUrls[index] || (!hasCapturedFrames ? posterUrl : undefined);
            return frameUrl ? <img key={index} src={frameUrl} alt="" draggable={false} /> : <span key={index} />;
          })}
        </div>
        <span className={styles.playhead} style={{ left: `${progress}%` }} aria-hidden="true" />
        <input
          aria-label="Video playback position"
          type="range"
          min={startTime}
          max={safeEnd || 0}
          step="0.05"
          value={value}
          onChange={(event) => onSeek?.(Number(event.target.value))}
        />
      </div>
      <time>{formatTimelineTime(value - startTime)} / {formatTimelineTime(selectedDuration)}</time>
    </div>
  );
}
