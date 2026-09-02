import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconActionButtons, { ActionIcon, actionIcons, defaultDetailActions } from '../icon-action-buttons/index.js';
import styles from './VideoInfoDialog.module.scss';

function DialogIcon({ name }) {
  const paths = {
    close: <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
    video: <><rect x="2.5" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="m10.5 7 3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></>,
  };
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">{paths[name] ?? paths.video}</svg>;
}

function NextActionIcon({ action }) {
  if (action.iconUrl) return <img className={styles.iconAsset} src={action.iconUrl} alt="" aria-hidden="true" />;
  const name = action.icon ?? action.id;
  return actionIcons[name] ? <ActionIcon className={styles.iconAsset} name={name} /> : null;
}

export default function VideoInfoDialog({
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
        <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label="Close video details">
          <DialogIcon name="close" />
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
                  <h3>Original Source</h3>
                  <div>
                    {sources.map((source, index) => (
                      <img key={source.id ?? source.url ?? index} src={source.url} alt={source.alt ?? `Source ${index + 1}`} />
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
                  <h3>Prompt</h3>
                  <p>{prompt}</p>
                </section>
              ) : null}
            </div>
            <section className={styles.nextAction} data-component-role="next-action">
              <h3>Next Action</h3>
              <div className={styles.nextGrid}>
                {nextActions.map((action) => (
                  <button
                    data-testid={action.testId}
                    key={action.id}
                    type="button"
                    disabled={!action.onSelect}
                    onClick={action.onSelect}
                  >
                    <NextActionIcon action={action} />{action.label}
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
                {onRetry ? <button className={styles.retry} type="button" onClick={onRetry}>Retry</button> : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
