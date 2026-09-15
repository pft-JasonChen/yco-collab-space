import styles from './SelectionToolbar.module.scss';
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

  return (
    <div className={styles.toolbar} data-component-role="selection-toolbar" data-editing={String(isEditing)}>
      <button
        type="button"
        className={[styles.selectButton, isEditing ? styles.cancelStyle : null]
          .filter(Boolean)
          .join(' ')}
        disabled={selectDisabled}
        onClick={onToggleEditing}
        data-testid="selection-toggle"
      >
        {isEditing ? copy.cancel : copy.select}
      </button>

      {isEditing && !hideDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          disabled={deleteDisabled}
          onClick={onDelete}
          aria-label={compact ? copy.delete : undefined}
          data-testid="selection-delete"
        >
          {compact ? <img src={trashIcon} alt="" /> : copy.delete}
        </button>
      )}

      {isEditing && onDownload && (
        <button
          type="button"
          className={styles.downloadButton}
          disabled={downloadDisabled}
          onClick={onDownload}
          aria-label={compact ? copy.download : undefined}
          data-testid="selection-download"
        >
          {compact ? <img src={downloadIcon} alt="" /> : copy.download}
        </button>
      )}
    </div>
  );
}
