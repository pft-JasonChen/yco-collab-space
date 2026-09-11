import addIcon from '../../../design-library/assets/icon/yco-upload-media-block/add.svg';
import removeIcon from '../../../design-library/assets/icon/yco-upload-media-block/remove.svg';
import replaceIcon from '../../../design-library/assets/icon/yco-upload-media-block/replace.svg';
import cropIcon from '../../../design-library/assets/icon/yco-upload-media-block/crop.svg';
import swapIcon from '../../../design-library/assets/icon/yco-upload-media-block/swap.svg';
import infoIcon from '../../../design-library/assets/icon/yco-upload-media-block/info.svg';
import errorIcon from '../../../design-library/assets/icon/yco-upload-media-block/error.svg';
import toggleOnIcon from '../../../design-library/assets/icon/yco-upload-media-block/toggle-on.svg';
import toggleOffIcon from '../../../design-library/assets/icon/yco-upload-media-block/toggle-off.svg';
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
  toggleLabel: 'Start & End Frame',
  toggleOn: 'ON',
  toggleOff: 'OFF',
  startFrameLabel: 'Start Frame',
  endFrameLabel: 'End Frame (Optional)',
  endFrameInfo: 'The end frame is optional — leave it empty to let the model choose.',
  pickImage: 'Choose image',
  crop: 'Crop',
  addImage: 'Add image',
  changeTemplate: 'Change',
};

function MiniButton({ icon, label, onClick, className }) {
  if (!onClick) return null;
  return (
    <button type="button" className={`${styles.miniButton} ${className || ''}`} onClick={onClick} aria-label={label}>
      <img src={icon} alt="" aria-hidden="true" />
    </button>
  );
}

/** One side of the `type="startEnd"` pair (node 7938:189409 / 7943:107377). */
function FrameSlot({ frame, labels, side, optional, onUpload, onReplace, onCrop, onRemove }) {
  const imageUrl = frame?.imageUrl;
  const typeLabel = frame?.typeLabel;
  const emptyText = side === 'start' ? labels.startFrameLabel : labels.endFrameLabel;

  if (!imageUrl) {
    return (
      <button
        type="button"
        className={styles.frameSlotEmpty}
        onClick={onUpload}
        disabled={!onUpload}
        data-testid={`upload-media-${side}-frame`}
      >
        <span className={styles.frameAddButton} aria-hidden="true">
          <img src={addIcon} alt="" />
        </span>
        <span className={styles.frameEmptyText}>{emptyText}</span>
        {optional ? (
          <span className={styles.frameInfo} aria-hidden="true">
            <img src={infoIcon} alt="" title={labels.endFrameInfo} />
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className={styles.frameSlotFilled} data-testid={`upload-media-${side}-frame`}>
      <img className={styles.frameImage} src={imageUrl} alt="" />
      {typeLabel ? <span className={styles.frameTypeLabel}>{typeLabel}</span> : null}
      <MiniButton icon={replaceIcon} label={labels.pickImage} onClick={onReplace} className={styles.frameButtonTopLeft} />
      <MiniButton icon={removeIcon} label={`Remove ${emptyText}`} onClick={onRemove} className={styles.frameButtonTopRight} />
      {onCrop ? <MiniButton icon={cropIcon} label={labels.crop} onClick={onCrop} className={styles.frameButtonBottomRight} /> : null}
    </div>
  );
}

/** `type="multiple"` filmstrip (node 7943:109872). */
function MultiImageStrip({ images, labels, onImageRemove, onImageAdd, maxImages }) {
  const canAddMore = onImageAdd && (maxImages == null || images.length < maxImages);
  return (
    <div className={styles.multiStrip} data-testid="upload-media-multiple">
      {images.map((image, index) => (
        <div
          key={image.id ?? index}
          className={styles.multiStripItem}
          style={{ aspectRatio: image.aspectRatio || '1 / 1' }}
        >
          <img className={styles.multiStripImage} src={image.url} alt="" />
          {image.label ? <span className={styles.multiStripTag}>{image.label}</span> : null}
          <MiniButton
            icon={removeIcon}
            label={`Remove ${image.label || `image ${index + 1}`}`}
            onClick={onImageRemove ? () => onImageRemove(image, index) : undefined}
            className={styles.multiStripRemove}
          />
        </div>
      ))}
      {canAddMore ? (
        <button type="button" className={styles.multiStripAdd} onClick={onImageAdd} aria-label={labels.addImage}>
          <span className={styles.frameAddButton} aria-hidden="true">
            <img src={addIcon} alt="" />
          </span>
        </button>
      ) : null}
    </div>
  );
}

/** `type="template"` selector row (node 13631:167115). */
function TemplateRow({ templateImageUrl, templateName, labels, onTemplateChange }) {
  return (
    <div className={styles.templateRow} data-testid="upload-media-template">
      {templateImageUrl ? <img className={styles.templateThumb} src={templateImageUrl} alt="" /> : null}
      <span className={styles.templateName}>{templateName}</span>
      {onTemplateChange ? (
        <button type="button" className={styles.templateChangeButton} onClick={onTemplateChange}>
          {labels.changeTemplate}
        </button>
      ) : null}
    </div>
  );
}

export default function UploadMediaBlock({
  labels: labelOverrides = {},
  /** 'single' (default, existing photo/video upload-or-preview), 'startEnd' (a
   *  Start Frame + End Frame pair), 'multiple' (a filmstrip of images), or
   *  'template' (a picked template's thumbnail + name + change button). */
  type = 'single',
  /** Shows the "Start & End Frame" toggle in the block's own header row. */
  showToggle = false,
  toggleOn = false,
  onToggleChange,
  /** Shows the "Supports PNG, JPG, WebP…" hint line below the upload area. */
  showHint = false,
  hintText = 'Supports PNG, JPG, WebP (Up to 7MB/file)',
  /** Renders an inline error row (icon + message) below the upload area, for
   *  any `type` — e.g. "Please upload a video between 3 to 10 seconds." */
  errorMessage,
  // type="single"
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
  // type="startEnd"
  startFrame,
  endFrame,
  onStartFrameUpload,
  onStartFrameReplace,
  onStartFrameCrop,
  onStartFrameRemove,
  onEndFrameUpload,
  onEndFrameReplace,
  onEndFrameCrop,
  onEndFrameRemove,
  // type="multiple"
  images = [],
  onImageRemove,
  onImageAdd,
  maxImages,
  // type="template"
  templateImageUrl,
  templateName,
  onTemplateChange,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const loaded = Boolean(imageUrl || videoUrl);

  let content;
  if (type === 'startEnd') {
    content = (
      <div className={styles.startEndRow}>
        <FrameSlot
          frame={startFrame}
          labels={labels}
          side="start"
          onUpload={onStartFrameUpload}
          onReplace={onStartFrameReplace}
          onCrop={onStartFrameCrop}
          onRemove={onStartFrameRemove}
        />
        <img className={styles.swapIcon} src={swapIcon} alt="" aria-hidden="true" />
        <FrameSlot
          frame={endFrame}
          labels={labels}
          side="end"
          optional
          onUpload={onEndFrameUpload}
          onReplace={onEndFrameReplace}
          onCrop={onEndFrameCrop}
          onRemove={onEndFrameRemove}
        />
      </div>
    );
  } else if (type === 'multiple') {
    content = (
      <MultiImageStrip images={images} labels={labels} onImageRemove={onImageRemove} onImageAdd={onImageAdd} maxImages={maxImages} />
    );
  } else if (type === 'template') {
    content = (
      <TemplateRow templateImageUrl={templateImageUrl} templateName={templateName} labels={labels} onTemplateChange={onTemplateChange} />
    );
  } else if (!loaded) {
    content = (
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
  } else {
    content = (
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

  return (
    <div className={styles.root} data-component-role="upload-media-block" data-upload-media-type={type}>
      {showToggle ? (
        <div className={styles.toggleRow} data-testid="upload-media-toggle">
          <span className={styles.toggleLabel}>{labels.toggleLabel}</span>
          <button
            type="button"
            role="switch"
            aria-checked={toggleOn}
            className={styles.toggleTrack}
            onClick={onToggleChange ? () => onToggleChange(!toggleOn) : undefined}
            disabled={!onToggleChange}
          >
            <img src={toggleOn ? toggleOnIcon : toggleOffIcon} alt="" aria-hidden="true" />
          </button>
          <span className={styles.toggleState}>{toggleOn ? labels.toggleOn : labels.toggleOff}</span>
        </div>
      ) : null}
      {content}
      {errorMessage ? (
        <p className={styles.errorRow} data-testid="upload-media-error">
          <img src={errorIcon} alt="" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}
      {showHint ? <p className={styles.hint}>{hintText}</p> : null}
    </div>
  );
}
