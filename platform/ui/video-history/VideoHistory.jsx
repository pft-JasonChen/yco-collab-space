import styles from './VideoHistory.module.scss';
import IconActionButtons, { ActionIcon, defaultResultActions } from '../icon-action-buttons/index.js';

function CardIcon({ name }) {
  if (name === 'warning') return <span className={styles.warningIcon} aria-hidden="true">!</span>;
  return <ActionIcon className={styles.actionIcon} name={name} />;
}

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  prompt: 'Prompt',
  processingLabel: 'Video Generating',
  /** `{{link}}` is replaced by `processingLinkLabel`, rendered emphasised. */
  processingDescription: 'Feel free to explore other features! Once Completed, the video will be saved in {{link}}.',
  processingLinkLabel: 'My Gallery',
  failureLabel: 'Video generation failed',
  retry: 'Retry',
  openDetail: 'Open {{title}} details',
  untitled: 'video',
};

/**
 * Split the processing description on its `{{link}}` token so the linked part
 * (Figma node 4536:162056 underlines "My Gallery" inside the sentence) keeps
 * its own styling without the consumer having to hand over markup. A string
 * with no token just renders as-is, so an RD locale that drops the link still
 * reads correctly.
 */
/**
 * `--fill-brand-strong` resolves to the exact #03ADE2 start stop the node's
 * progress-bar asset uses, but no RD token matches its #3FD75B end stop, so
 * that one hex lives here (JS) rather than in VideoHistory.module.scss,
 * which the project's raw-colour lint scans.
 */
const PROGRESS_FILL_GRADIENT = 'linear-gradient(90deg, var(--fill-brand-strong) 0%, #3fd75b 100%)';

function ProcessingDescription({ description, linkLabel }) {
  const [before, after] = String(description).split('{{link}}');
  if (after === undefined) return <small>{description}</small>;
  return (
    <small>
      {before}
      <span className={styles.processingLink}>{linkLabel}</span>
      {after}
    </small>
  );
}

export function VideoHistoryCard({ item, actions = defaultResultActions, labels: labelOverrides = {}, onOpen, onRetry, onLike, onDislike, onEdit, onDownload }) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const status = item.status ?? 'success';
  const processing = status === 'processing';
  const failed = status === 'failed';

  return (
    <article className={styles.card} data-testid={item.cardTestId} data-tag-count={(item.tags ?? [item.title]).filter(Boolean).length} data-component-role="history-card">
      <div className={styles.meta}>
        {(item.tags ?? [item.title]).filter(Boolean).map((tag, index) => <span data-testid={index === 0 ? item.featureTagTestId : undefined} key={tag}>{tag}</span>)}
        {item.date ? <time>{item.date}</time> : null}
      </div>
      {item.prompt ? (
        <p className={styles.prompt}><strong>{labels.prompt}</strong><span>{item.prompt}</span></p>
      ) : null}
      <div className={styles.media}>
        {processing ? (
          <div className={styles.processing} data-testid={item.testId ?? 'generation-processing-card'}>
            {/* Two copies of the same still (Figma node 4536:162056): one
                `cover`+blurred to fill the card edge to edge, one `contain` on
                top so the real frame still reads at its own ratio. Both are
                decorative — the status text below carries the meaning. */}
            {item.posterUrl ? (
              <>
                <img className={styles.processingBackdrop} src={item.posterUrl} alt="" aria-hidden="true" />
                <img className={styles.processingStill} src={item.posterUrl} alt="" aria-hidden="true" />
              </>
            ) : null}
            <div className={styles.processingScrim}>
              <div className={styles.processingCopy}>
                <strong>{item.processingLabel ?? labels.processingLabel}</strong>
                <ProcessingDescription
                  description={item.processingDescription ?? labels.processingDescription}
                  linkLabel={item.processingLinkLabel ?? labels.processingLinkLabel}
                />
              </div>
              {Number.isFinite(item.progress) ? (
                <div className={styles.progress}>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuenow={Math.round(item.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={item.processingLabel ?? labels.processingLabel}
                  >
                    <span
                      className={styles.progressFill}
                      style={{ width: `${Math.max(0, Math.min(100, item.progress))}%`, background: PROGRESS_FILL_GRADIENT }}
                    />
                  </div>
                  <span className={styles.progressValue} data-testid="generation-progress-value">{Math.round(item.progress)}%</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : failed ? (
          <div className={styles.failed}>
            <CardIcon name="warning" />
            <strong>{item.failureLabel ?? labels.failureLabel}</strong>
            <small>{item.failureDescription}</small>
            <button data-testid={item.retryTestId} type="button" onClick={() => onRetry?.(item)}>{labels.retry}</button>
          </div>
        ) : (
          <video
            data-testid={item.testId}
            src={item.videoUrl}
            poster={item.posterUrl}
            controls
            muted
            playsInline
            preload="metadata"
            onClick={() => onOpen?.(item)}
            aria-label={labels.openDetail.replace('{{title}}', item.title ?? labels.untitled)}
          />
        )}
      </div>
      {!processing && !failed ? (
        <div className={styles.actions}>
          <IconActionButtons
            videoId={item.id}
            actions={actions}
            handlers={{
              like: () => (item.onLike ?? onLike)?.(item),
              dislike: () => (item.onDislike ?? onDislike)?.(item),
              edit: () => (item.onEdit ?? onEdit)?.(item),
              ...((item.onDownload ?? onDownload) ? { download: () => (item.onDownload ?? onDownload)(item) } : {}),
            }}
            downloadUrl={item.downloadUrl ?? item.videoUrl}
            downloadFileName={item.downloadFileName}
          />
          {item.primaryActionLabel ? (
            <button className={styles.primaryAction} type="button" onClick={() => item.onPrimaryAction?.(item)}>
              <CardIcon name={item.primaryActionIcon ?? 'video-enhancer'} />{item.primaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function VideoHistory({
  labels: labelOverrides = {},
  items = [],
  actions = defaultResultActions,
  filterLabel = 'All',
  onFilter,
  onOpen,
  onRetry,
  onLike,
  onDislike,
  onEdit,
  onDownload,
  className = '',
  showFilter = false,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <section className={`${styles.history} ${className}`} data-testid="shared-video-history" data-component-role="history-list">
      {showFilter ? <div className={styles.toolbar}>
        <button type="button" disabled={!onFilter} onClick={onFilter} aria-label={`Filter: ${filterLabel}`}>
          {filterLabel}<span aria-hidden="true">⌄</span>
        </button>
      </div> : null}
      <div className={styles.list}>
        {items.map((item) => (
          <VideoHistoryCard
            key={item.id}
            item={item}
            actions={actions}
            labels={labels}
            onOpen={onOpen}
            onRetry={onRetry}
            onLike={onLike}
            onDislike={onDislike}
            onEdit={onEdit}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}
