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
        {/* Reference (2026-09-16, see UploadMediaBlock.module.scss's own
            .dashedBorder comment for the full back-and-forth): pathLength
            normalizes this rect's total length to 248 declared units
            regardless of its real rendered size, so a whole-number dasharray
            (124 dash+gap periods) always closes cleanly with no leftover
            seam at the rounded corners — while still landing close to
            Figma's actual 4px-dash/4px-gap spec at this shape's own default
            368x136 size. The rect itself is inset by half the stroke width
            (0.5px) on every side, rx/ry shrunk to match (7.5, from 8) — an
            SVG stroke paints centered on its path by default, so a rect
            drawn flush with the box edge (x=0/y=0/100%/100%) only ever has
            HALF its 1px width actually inside the box; the other half either
            bled outside (before .uploadBlock had overflow:hidden) or, after
            that fix, got clipped away, leaving every straight edge looking
            like a 0.5px sliver ("感覺有被切一半", reported live once the
            corners themselves looked right). Insetting the path itself keeps
            the FULL stroke inside the box on every edge, corners included —
            overflow:hidden stays on as a safety net, not the source of truth. */}
        <svg className={styles.dashedBorder} aria-hidden="true" width="100%" height="100%">
          <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="7.5" ry="7.5" fill="none" stroke="var(--stroke-strong)" strokeWidth="1" pathLength="248" strokeDasharray="1 1" />
        </svg>
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
            <>
              <video src={videoUrl} poster={imageUrl} muted playsInline preload="metadata" />
              {/* Reference (2026-09-15, requested live — "1除了時間還有play和volume",
                  comparing this thumbnail against the video-expansion settings
                  panel's own upload block, which only showed the duration
                  badge): a video thumbnail also needs a play affordance and a
                  muted indicator, matching VideoTrimModal's own preview overlay
                  (same icon font glyphs / color-mix(80%-opacity) treatment,
                  scaled down for this block's much smaller ~112px-tall preview).
                  Both are decorative only — this component has no inline
                  playback state of its own, `onPreview` (the whole button's
                  onClick) is still what actually opens a real preview. */}
              <span className={styles.previewPlay} aria-hidden="true">{''}</span>
              <span className={styles.previewMuted} aria-hidden="true">{''}</span>
            </>
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
