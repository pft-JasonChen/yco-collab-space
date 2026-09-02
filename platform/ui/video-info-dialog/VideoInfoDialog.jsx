import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import characterMotionIcon from '../../../design-library/assets/icon/yco-video-actions/character-motion-swap.svg';
import dislikeIcon from '../../../design-library/assets/icon/yco-video-actions/dislike-default.svg';
import downloadIcon from '../../../design-library/assets/icon/yco-video-actions/download.svg';
import faceSwapIcon from '../../../design-library/assets/icon/yco-video-actions/face-swap.svg';
import likeIcon from '../../../design-library/assets/icon/yco-video-actions/like-default.svg';
import objectRemovalIcon from '../../../design-library/assets/icon/yco-video-actions/object-removal.svg';
import styleTransferIcon from '../../../design-library/assets/icon/yco-video-actions/style-transfer.svg';
import videoEditorIcon from '../../../design-library/assets/icon/yco-video-actions/video-editor.svg';
import videoEnhancerIcon from '../../../design-library/assets/icon/yco-video-actions/video-enhancer.svg';
import videoExpansionIcon from '../../../design-library/assets/icon/yco-video-actions/video-expansion.svg';
import styles from './VideoInfoDialog.module.scss';

const actionIcons = {
  'video-enhancer': videoEnhancerIcon,
  enhancer: videoEnhancerIcon,
  'face-swap': faceSwapIcon,
  'style-transfer': styleTransferIcon,
  'object-removal': objectRemovalIcon,
  'video-editor': videoEditorIcon,
  'character-motion-swap': characterMotionIcon,
  'video-expansion': videoExpansionIcon,
  expansion: videoExpansionIcon,
};

function DialogIcon({ name }) {
  const assetIcons = { like: likeIcon, dislike: dislikeIcon, download: downloadIcon };
  if (assetIcons[name]) return <img className={styles.iconAsset} src={assetIcons[name]} alt="" aria-hidden="true" />;
  const paths = {
    close: <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
    like: <path d="M6.5 13H4a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1h2.5L8 3c.4-.9 1.8-.6 1.8.4v3.1H12a1 1 0 0 1 1 1l-.8 4.5a1.2 1.2 0 0 1-1.2 1H6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
    dislike: <path d="M6.5 3H4a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1h2.5L8 13c.4.9 1.8.6 1.8-.4V9.5H12a1 1 0 0 0 1-1L12.2 4A1.2 1.2 0 0 0 11 3H6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
    download: <><path d="M8 2.8v7m0 0 2.7-2.7M8 9.8 5.3 7.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    video: <><rect x="2.5" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="m10.5 7 3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></>,
  };
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">{paths[name] ?? paths.video}</svg>;
}

function NextActionIcon({ action }) {
  const src = action.iconUrl ?? actionIcons[action.icon ?? action.id];
  return src ? <img className={styles.iconAsset} src={src} alt="" aria-hidden="true" /> : null;
}

export default function VideoInfoDialog({
  opened,
  title,
  date,
  videoUrl,
  posterUrl,
  sources = [],
  metadata = [],
  prompt,
  nextActions = [],
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
                <div>
                  <button type="button" onClick={onLike} disabled={!onLike} aria-label="Like"><DialogIcon name="like" /></button>
                  <button type="button" onClick={onDislike} disabled={!onDislike} aria-label="Dislike"><DialogIcon name="dislike" /></button>
                  <button type="button" onClick={onDownload} disabled={!onDownload} aria-label="Download"><DialogIcon name="download" /></button>
                </div>
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
