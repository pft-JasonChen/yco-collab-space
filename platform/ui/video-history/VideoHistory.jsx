import styles from './VideoHistory.module.scss';
import IconActionButtons, { ActionIcon, defaultResultActions } from '../icon-action-buttons/index.js';

function CardIcon({ name }) {
  if (name === 'warning') return <span className={styles.warningIcon} aria-hidden="true">!</span>;
  return <ActionIcon className={styles.actionIcon} name={name} />;
}

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  prompt: 'Prompt',
  processingLabel: 'Generating video',
  processingDescription: 'Preparing your result…',
  failureLabel: 'Video generation failed',
  retry: 'Retry',
  openDetail: 'Open {{title}} details',
  untitled: 'video',
};

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
            <span className={styles.spinner} aria-hidden="true" />
            <strong>{item.processingLabel ?? labels.processingLabel}</strong>
            <small>{item.processingDescription ?? labels.processingDescription}</small>
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
