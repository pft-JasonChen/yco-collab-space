import addIcon from '../../../design-library/assets/icon/yco-upload-media-block/add.svg';
import removeIcon from '../../../design-library/assets/icon/yco-upload-media-block/remove.svg';
import replaceIcon from '../../../design-library/assets/icon/yco-upload-media-block/replace.svg';
import styles from './UploadMediaBlock.module.scss';

export function formatMediaDuration(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(value / 60);
  const remainder = String(Math.floor(value % 60)).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  preview: 'Preview uploaded video',
  remove: 'Remove video',
  replace: 'Replace video',
};

export default function UploadMediaBlock({
  labels: labelOverrides = {},
  imageUrl,
  videoUrl,
  videoDuration,
  uploadTitle = 'Upload video',
  uploadDescription = 'MP4, MOV or WebM · trim up to 30 sec',
  onUpload,
  onPreview,
  onRemove,
  onReplace,
  actionSlot,
  disabled = false,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const loaded = Boolean(imageUrl || videoUrl);

  if (!loaded) {
    return (
      <button
        className={styles.uploadBlock}
        data-testid="shared-upload-media-block"
        type="button"
        disabled={disabled || !onUpload}
        onClick={onUpload}
      >
        <span className={styles.dashedBorder} aria-hidden="true" />
        <img className={styles.addIcon} src={addIcon} alt="" aria-hidden="true" />
        <span className={styles.uploadCopy}>
          <strong>{uploadTitle}</strong>
          <small>{uploadDescription}</small>
        </span>
      </button>
    );
  }

  return (
    <div className={styles.mediaBlock} data-testid="shared-upload-media-block">
      <button
        className={styles.preview}
        type="button"
        onClick={onPreview}
        aria-disabled={!onPreview || undefined}
        aria-label={labels.preview}
      >
        {videoUrl ? (
          <video src={videoUrl} poster={imageUrl} muted playsInline preload="metadata" />
        ) : (
          <img src={imageUrl} alt="Uploaded media" />
        )}
        {videoDuration != null ? (
          <span className={styles.duration} data-testid="selected-duration">
            {formatMediaDuration(videoDuration)}
          </span>
        ) : null}
      </button>
      <div className={styles.actions}>
        {onRemove ? (
          <button type="button" onClick={onRemove} aria-label={labels.remove}>
            <img src={removeIcon} alt="" aria-hidden="true" />
          </button>
        ) : null}
        {onReplace ? (
          <button type="button" onClick={onReplace} aria-label={labels.replace}>
            <img src={replaceIcon} alt="" aria-hidden="true" />
          </button>
        ) : null}
        {actionSlot ? <div className={styles.featureAction}>{actionSlot}</div> : null}
      </div>
    </div>
  );
}
