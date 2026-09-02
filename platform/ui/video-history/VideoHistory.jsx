import styles from './VideoHistory.module.scss';
import dislikeIcon from '../../../design-library/assets/icon/yco-video-actions/dislike-default.svg';
import downloadIcon from '../../../design-library/assets/icon/yco-video-actions/download.svg';
import editIcon from '../../../design-library/assets/icon/yco-video-actions/edit.svg';
import likeIcon from '../../../design-library/assets/icon/yco-video-actions/like-default.svg';
import videoEnhancerIcon from '../../../design-library/assets/icon/yco-video-actions/video-enhancer.svg';

function ActionIcon({ name }) {
  const icons = { like: likeIcon, dislike: dislikeIcon, edit: editIcon, download: downloadIcon, enhancer: videoEnhancerIcon };
  if (name === 'warning') return <span className={styles.warningIcon} aria-hidden="true">!</span>;
  return icons[name] ? <img className={styles.actionIcon} src={icons[name]} alt="" aria-hidden="true" /> : null;
}

export function VideoHistoryCard({ item, onOpen, onRetry }) {
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
        <p className={styles.prompt}><strong>Prompt</strong><span>{item.prompt}</span></p>
      ) : null}
      <div className={styles.media}>
        {processing ? (
          <div className={styles.processing} data-testid={item.testId ?? 'generation-processing-card'}>
            <span className={styles.spinner} aria-hidden="true" />
            <strong>{item.processingLabel ?? 'Generating video'}</strong>
            <small>{item.processingDescription ?? 'Preparing your result…'}</small>
          </div>
        ) : failed ? (
          <div className={styles.failed}>
            <ActionIcon name="warning" />
            <strong>{item.failureLabel ?? 'Video generation failed'}</strong>
            <small>{item.failureDescription}</small>
            <button data-testid={item.retryTestId} type="button" onClick={() => onRetry?.(item)}>Retry</button>
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
            aria-label={`Open ${item.title ?? 'video'} details`}
          />
        )}
      </div>
      {!processing && !failed ? (
        <div className={styles.actions}>
          <div>
            <button type="button" onClick={() => item.onLike?.(item)} aria-label="Like"><ActionIcon name="like" /></button>
            <button type="button" onClick={() => item.onDislike?.(item)} aria-label="Dislike"><ActionIcon name="dislike" /></button>
            <button type="button" onClick={() => item.onEdit?.(item)} aria-label="Edit"><ActionIcon name="edit" /></button>
            <button type="button" onClick={() => item.onDownload?.(item)} aria-label="Download"><ActionIcon name="download" /></button>
          </div>
          {item.primaryActionLabel ? (
            <button className={styles.primaryAction} type="button" onClick={() => item.onPrimaryAction?.(item)}>
              <ActionIcon name="enhancer" />{item.primaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function VideoHistory({
  items = [],
  filterLabel = 'All',
  onFilter,
  onOpen,
  onRetry,
  className = '',
  showFilter = false,
}) {
  return (
    <section className={`${styles.history} ${className}`} data-testid="shared-video-history" data-component-role="history-list">
      {showFilter ? <div className={styles.toolbar}>
        <button type="button" disabled={!onFilter} onClick={onFilter} aria-label={`Filter: ${filterLabel}`}>
          {filterLabel}<span aria-hidden="true">⌄</span>
        </button>
      </div> : null}
      <div className={styles.list}>
        {items.map((item) => (
          <VideoHistoryCard key={item.id} item={item} onOpen={onOpen} onRetry={onRetry} />
        ))}
      </div>
    </section>
  );
}
