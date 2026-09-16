import styles from './SelectionToolbar.module.scss';
import Button from '../button/index.js';
import trashIcon from '../../../design-library/assets/icon/yco-home-gallery/images__account__btn_trash_w.svg';
import downloadIcon from '../../../design-library/assets/icon/yco-home-gallery/images__icon_download_w.svg';
import tickIcon from '../../../design-library/assets/icon/yco-home-gallery/images__account__aiTools__aiHeadshot__icon_Tick.svg';
import noticeIcon from '../../../design-library/assets/icon/yco-home-gallery/images__ico_yce_notice.svg';

const defaultLabels = {
  select: 'Select',
  cancel: 'Cancel',
  selectAll: 'Select all',
  delete: 'Delete',
  download: 'Download',
  tips: 'Tips',
  exit: 'Exit selection',
};

/**
 * The gallery header bar's left side, ported from RD's
 * my-gallery-page/components/select-all-header.
 *
 * Out of selection mode it shows the tip row; in selection mode it becomes the
 * select-all control. RD swaps the whole left side rather than adding a control
 * beside the tip, and that is kept.
 */
export function SelectAllHeader({
  isEditing,
  isSelectAll = false,
  onToggleSelectAll,
  onNoticeClick,
  labels = {},
  children,
}) {
  const copy = { ...defaultLabels, ...labels };

  if (!isEditing) {
    return (
      <div className={styles.flex} data-component-role="selection-tip">
        <button
          type="button"
          className={styles.icon}
          onClick={onNoticeClick}
          aria-label={copy.tips}
        >
          <img src={noticeIcon} alt="" />
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.flex} data-component-role="select-all">
      <label className={styles.selectAllLabel}>
        <input
          type="checkbox"
          className={styles.nativeCheckbox}
          checked={isSelectAll}
          onChange={onToggleSelectAll}
          data-testid="select-all-input"
        />
        <span className={styles.checkbox} aria-hidden="true">
          {isSelectAll && <img src={tickIcon} className={styles.checkboxChecked} alt="" />}
        </span>
        <span className={styles.labelText}>{copy.selectAll}</span>
      </label>
    </div>
  );
}

/**
 * The gallery header bar's right side, ported from RD's
 * my-gallery-page/components/editing-toolbar: the select/cancel toggle, and
 * while editing the delete and download actions.
 *
 * RD takes the caller's CSS module as a `styles` prop so each tab can style the
 * same markup differently. A shared component owns its own styling instead, so
 * that prop is gone; `compact` selects the narrow icon-only treatment RD drives
 * from a viewport hook.
 *
 * @param {object} props
 * @param {boolean} props.isEditing
 * @param {boolean} [props.compact]          icon-only delete/download, RD's <=768px treatment
 * @param {'default'|'ghost'} [props.variant]  `default` is RD's filled pill row. `ghost` is the
 *        low-weight treatment a selection bar wants: icon plus label, no fill, so the actions do
 *        not outweigh the content they act on
 * @param {() => void} [props.onExit]         `ghost` only: the leading close control that leaves
 *        selection mode, which RD's row expresses as a Cancel pill instead
 * @param {React.ReactNode} [props.children]  `ghost` only: sits between the close control and the
 *        actions, where a selection bar puts its count and select-all
 * @param {React.ReactNode} [props.extraActions] `ghost` only: actions the consumer owns, placed
 *        before the destructive one so delete stays last
 * @param {boolean} [props.selectDisabled]
 * @param {boolean} [props.deleteDisabled]
 * @param {boolean} [props.downloadDisabled]
 * @param {boolean} [props.hideDelete]       tabs with no delete API
 * @param {() => void} props.onToggleEditing
 * @param {() => void} [props.onDelete]
 * @param {() => void} [props.onDownload]    when omitted, no download action is shown
 * @param {{select?: string, cancel?: string, delete?: string, download?: string}} [props.labels]
 */
export default function SelectionToolbar({
  isEditing,
  compact = false,
  variant = 'default',
  onExit,
  extraActions,
  children,
  selectDisabled = false,
  deleteDisabled = false,
  downloadDisabled = false,
  hideDelete = false,
  onToggleEditing,
  onDelete,
  onDownload,
  labels = {},
}) {
  const copy = { ...defaultLabels, ...labels };
  const isGhost = variant === 'ghost';

  return (
    <div
      className={`${styles.toolbar} ${isGhost ? styles.toolbarGhost : ''}`}
      data-component-role="selection-toolbar"
      data-editing={String(isEditing)}
      data-variant={variant}
    >
      {isGhost && onExit && (
        <button
          type="button"
          className={styles.exitButton}
          onClick={onExit}
          aria-label={copy.exit}
          data-testid="selection-exit"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
      {isGhost && children}
      {!isGhost && (
      <Button
        variant={isEditing ? 'secondary' : 'primary'}
        tone={isEditing ? 'neutral' : 'brand'}
        size="small"
        disabled={selectDisabled}
        onClick={onToggleEditing}
        data-testid="selection-toggle"
      >
        {isEditing ? copy.cancel : copy.select}
      </Button>
      )}

      {isEditing && onDownload && (
        <button
          type="button"
          className={isGhost ? styles.ghostAction : styles.downloadButton}
          disabled={downloadDisabled}
          onClick={onDownload}
          aria-label={compact ? copy.download : undefined}
          data-testid="selection-download"
        >
          {isGhost || compact ? <img src={downloadIcon} alt="" aria-hidden="true" /> : null}
          {compact ? null : copy.download}
        </button>
      )}

      {/* Ghost puts the consumer's own actions before the destructive one, so
          delete stays last — the order the reference selection bar uses. RD's
          default order (delete first) is untouched. */}
      {isGhost && extraActions}

      {isEditing && !hideDelete && (
        <button
          type="button"
          className={isGhost ? styles.ghostAction : styles.deleteButton}
          disabled={deleteDisabled}
          onClick={onDelete}
          aria-label={compact ? copy.delete : undefined}
          data-testid="selection-delete"
          data-destructive={isGhost ? 'true' : undefined}
        >
          {isGhost || compact ? <img src={trashIcon} alt="" aria-hidden="true" /> : null}
          {compact ? null : copy.delete}
        </button>
      )}
    </div>
  );
}
