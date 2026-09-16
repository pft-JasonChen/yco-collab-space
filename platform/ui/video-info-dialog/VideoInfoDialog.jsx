import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconActionButtons, { defaultDetailActions } from '../icon-action-buttons/index.js';
import styles from './VideoInfoDialog.module.scss';

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  close: 'Close video details',
  originalSource: 'Original Source',
  prompt: 'Prompt',
  nextAction: 'Next Action',
  retry: 'Retry',
  sourceAlt: 'Source {{index}}',
};

export default function VideoInfoDialog({
  labels: labelOverrides = {},
  opened,
  videoId = 'video-detail',
  title,
  date,
  videoUrl,
  posterUrl,
  sources = [],
  metadata = [],
  prompt,
  nextActions = [],
  actions = defaultDetailActions,
  downloadFileName = null,
  onClose,
  onRetry,
  onLike,
  onDislike,
  onDownload,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const closeRef = useRef(null);

  useEffect(() => {
    if (!opened) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [opened, onClose]);

  if (!opened) return null;

  const dialog = (
    <div
      className={styles.backdrop}
      data-testid="video-info-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <section
        className={styles.dialog}
        data-testid="video-detail-dialog"
        data-component-role="video-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-info-title"
      >
        <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label={labels.close}>
          <span aria-hidden="true">&#xe943;</span>
        </button>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.videoWrapper}>
              <video src={videoUrl} poster={posterUrl} controls muted playsInline preload="metadata" />
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.scrollArea}>
              <header className={styles.header}>
                <h2 id="video-info-title">{title}</h2>
                {date ? <p>{date}</p> : null}
              </header>
              {sources.length > 0 ? (
                <section className={styles.sources}>
                  <h3>{labels.originalSource}</h3>
                  <div>
                    {sources.map((source, index) => (
                      <img key={source.id ?? source.url ?? index} src={source.url} alt={source.alt ?? labels.sourceAlt.replace('{{index}}', String(index + 1))} />
                    ))}
                  </div>
                </section>
              ) : null}
              {metadata.length > 0 ? (
                <dl className={styles.metadata}>
                  {metadata.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                </dl>
              ) : null}
              {prompt ? (
                <section className={styles.prompt}>
                  <h3>{labels.prompt}</h3>
                  <p>{prompt}</p>
                </section>
              ) : null}
            </div>
            <section className={styles.nextAction} data-component-role="next-action">
              <h3>{labels.nextAction}</h3>
              <div className={styles.nextGrid}>
                {nextActions.map((action) => (
                  <button
                    data-testid={action.testId}
                    key={action.id}
                    type="button"
                    disabled={!action.onSelect}
                    onClick={action.onSelect}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className={styles.footer}>
                <IconActionButtons
                  videoId={videoId}
                  actions={actions}
                  handlers={{
                    like: onLike,
                    dislike: onDislike,
                    ...(onDownload ? { download: onDownload } : {}),
                  }}
                  downloadUrl={videoUrl}
                  downloadFileName={downloadFileName}
                />
                {onRetry ? <button className={styles.retry} type="button" onClick={onRetry}>{labels.retry}</button> : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
