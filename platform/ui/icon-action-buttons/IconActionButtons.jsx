import ActionIcon, { isReactionId } from './ActionIcon.jsx';
import { useVideoReaction } from './reaction-store.js';
import styles from './IconActionButtons.module.scss';

export const defaultResultActions = [
  { id: 'like', title: 'Like' },
  { id: 'dislike', title: 'Dislike' },
  { id: 'edit', title: 'Edit' },
  { id: 'download', title: 'Download' },
];

export const defaultDetailActions = [
  { id: 'like', title: 'Like' },
  { id: 'dislike', title: 'Dislike' },
  { id: 'download', title: 'Download' },
];

/**
 * Downloads the already-loaded prototype asset through an anchor. RD calls
 * `fetchAndGenerateAnchorAndDownloadVideo`; the prototype keeps the anchor step and
 * drops the production fetch/auth service, so this never touches the network.
 */
function downloadFromUrl(url, fileName) {
  if (!url || typeof document === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'video.mp4';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function IconActionButtons({
  videoId,
  actions = defaultResultActions,
  handlers = {},
  downloadUrl = null,
  downloadFileName = null,
  centered = false,
  className = '',
}) {
  const [reaction, toggleReaction] = useVideoReaction(videoId);

  const handleClick = (id) => () => {
    if (isReactionId(id)) toggleReaction(id);
    if (id === 'download' && !handlers.download) {
      downloadFromUrl(downloadUrl, downloadFileName);
      return;
    }
    handlers[id]?.();
  };

  return (
    <div
      className={`${styles.actionButtons} ${centered ? styles.centered : ''} ${className}`}
      data-testid="shared-icon-action-buttons"
      data-component-role="result-actions"
    >
      {actions.map(({ id, title }) => {
        const active = isReactionId(id) && reaction === id;
        return (
          <button
            key={id}
            className={styles.iconButton}
            data-testid={`icon-action-${id}`}
            data-action-active={active ? 'true' : 'false'}
            type="button"
            onClick={handleClick(id)}
            aria-label={title}
            aria-pressed={isReactionId(id) ? active : undefined}
          >
            <ActionIcon className={styles.icon} name={id} active={active} />
            <span className={styles.tooltip} aria-hidden="true">{title}</span>
          </button>
        );
      })}
    </div>
  );
}
