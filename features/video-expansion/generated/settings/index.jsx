/**
 * L1 — Video Expansion settings panel.
 *
 * Composition only. This layer may import shared components from `platform/ui`,
 * pure data from `../data`, and the copy translator — nothing else. It holds no
 * state, touches no DOM API and knows nothing about the canvas, so RD can port
 * it by swapping the import alias and reconnecting its own `t()` and store.
 */
import Ratio, { ratioTitleTypes, ratioTypes } from '../../../../platform/ui/ratio/index.js';
import UploadMediaBlock from '../../../../platform/ui/upload-media-block/index.js';
import Icon from '../icons.jsx';
import { ACCEPTED_VIDEO_TYPES, ratioTestId } from '../data/defaults.js';
import { buildRatioOptions, parseRatio } from '../data/canvas-geometry.js';
import styles from './index.module.scss';

export function VideoSection({
  t,
  loaded,
  sourceUrl,
  thumbnailUrl,
  selectedDuration,
  fileInputRef,
  onPick,
  onRemove,
  onTrim,
  onFileChange,
}) {
  return (
    <section className={styles.settingsSection}>
      <h2 className={styles.sectionTitle}>{t('video.expansion.settings.video.title')}</h2>
      <div
        data-testid="video-upload-entry"
        data-component-role="uploaded-media media-upload"
        data-surface-zone="video-input"
      >
        {/* Reference (2026-09-15, requested live — "如果是video只要保留 X 和
            scissors icon"): this section is always a video (there's no image
            variant of it), so UploadMediaBlock's own Replace action never
            applies here — no onReplace prop is passed at all, rather than
            passing it conditionally-undefined, since it's never meant to
            appear on this particular upload block. */}
        <UploadMediaBlock
          imageUrl={loaded ? thumbnailUrl : undefined}
          videoUrl={loaded ? sourceUrl : undefined}
          videoDuration={loaded ? selectedDuration : undefined}
          onUpload={onPick}
          onRemove={loaded ? onRemove : undefined}
          actionSlot={loaded ? (
            <button
              className={styles.trimMediaAction}
              data-testid="open-trim-dialog"
              type="button"
              onClick={onTrim}
              aria-label={t('video.expansion.trim.action')}
            >
              <Icon name="trim" />
            </button>
          ) : null}
        />
      </div>
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        data-testid="video-file-input"
        type="file"
        accept={ACCEPTED_VIDEO_TYPES}
        onChange={onFileChange}
      />
    </section>
  );
}

export function AspectRatioSection({ t, ratios, value, onChange, disabled }) {
  return (
    <section className={styles.settingsSection} data-component-role="aspect-ratio-selector">
      {/* Reference (2026-09-15, requested live — "video expansion 不要用
          [image_extender]，用一般的Five Ratios 那個variant就好"): was
          ratioTypes.IMAGE_EXTENDER, a key that didn't exist on ratioTypes
          until just now — Ratio's own default-parameter fallback silently
          turned that into GERY_V2 anyway, so this makes explicit what was
          already rendering, rather than switching to the newly-real
          IMAGE_EXTENDER variant. */}
      <Ratio
        ratioList={buildRatioOptions(ratios)}
        ratio={parseRatio(value)}
        setRatio={(next) => onChange(`${next.w}:${next.h}`)}
        title={t('text.to.image.settings.advance.settings.aspect.ratio')}
        variant={ratioTypes.GERY_V2}
        titleVariant={ratioTitleTypes.GERY}
        disabled={disabled}
        getOptionTestId={ratioTestId}
        optionLabelTestId="ratio-option"
      />
    </section>
  );
}

export function UploadErrorNotice({ message }) {
  return (
    <div
      className={styles.inlineError}
      data-testid="upload-error"
      data-component-role="error-recovery"
      role="alert"
    >
      <Icon name="warning" />
      <span>{message}</span>
    </div>
  );
}

export function HistorySourceBadge({ t }) {
  return (
    <div className={styles.historySourceBadge} data-testid="history-source-badge">
      {t('video.expansion.history.source.badge')}
    </div>
  );
}

/** The whole left panel, in the order the surface pack declares. */
export default function SettingsPanel({
  t,
  ratios,
  loaded,
  sourceState,
  sourceUrl,
  thumbnailUrl,
  selectedDuration,
  uploadErrorMessage,
  showHistoryBadge,
  ratio,
  fileInputRef,
  onPick,
  onRemove,
  onTrim,
  onFileChange,
  onRatioChange,
}) {
  return (
    <>
      <VideoSection
        t={t}
        loaded={loaded}
        sourceUrl={sourceUrl}
        thumbnailUrl={thumbnailUrl}
        selectedDuration={selectedDuration}
        fileInputRef={fileInputRef}
        onPick={onPick}
        onRemove={onRemove}
        onTrim={onTrim}
        onFileChange={onFileChange}
      />
      {sourceState === 'error' ? <UploadErrorNotice message={uploadErrorMessage} /> : null}
      {showHistoryBadge ? <HistorySourceBadge t={t} /> : null}
      <AspectRatioSection
        t={t}
        ratios={ratios}
        value={ratio}
        onChange={onRatioChange}
        disabled={!loaded}
      />
    </>
  );
}
