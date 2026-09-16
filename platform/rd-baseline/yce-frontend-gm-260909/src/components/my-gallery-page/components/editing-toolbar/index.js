import { getTranslationFunction } from '@/i18n';
import browserUtils from '@/utils/browserUtils';

/**
 * The right side of the gallery / ai-tools header bar: the select/cancel
 * toggle and, while editing, the delete button (text on desktop, trash icon on
 * mobile).
 *
 * Shared markup between the gallery and ai-tools tabs; each tab passes its own
 * CSS-module `styles` plus the already-resolved disabled predicates.
 *
 * @param {Object} props
 * @param {Object} props.styles            the caller's CSS-module styles
 * @param {boolean} props.isEditing
 * @param {boolean} props.isMd
 * @param {boolean} props.selectDisabled   disables the select/cancel button
 * @param {boolean} props.deleteDisabled   disables the delete button
 * @param {Function} props.onToggleEditing
 * @param {Function} props.onDelete
 * @param {Function} [props.onDownload]      when provided, shows a Download button while editing
 * @param {boolean} [props.downloadDisabled] disables the download button
 * @param {boolean} [props.hideDelete]       hide the delete button (tabs with no delete API)
 */
export default function EditingToolbar({
  styles,
  isEditing,
  isMd,
  selectDisabled,
  deleteDisabled,
  onToggleEditing,
  onDelete,
  onDownload,
  downloadDisabled,
  hideDelete = false,
}) {
  const { t } = getTranslationFunction();

  return (
    <>
      <button
        className={`${styles.selectButton} ${
          isEditing ? styles.cancelStyle : ''
        } `}
        disabled={selectDisabled}
        onClick={onToggleEditing}
      >
        {t(
          !isEditing ? 'my.account.history.select' : 'my.account.history.cancel'
        )}
      </button>
      {isEditing &&
        !hideDelete &&
        (!isMd ? (
          <button
            className={styles.deleteButton}
            disabled={deleteDisabled}
            onClick={onDelete}
          >
            {t('general.delete')}
          </button>
        ) : (
          <button
            className={styles.deleteButton}
            disabled={deleteDisabled}
            onClick={onDelete}
          >
            <img src={'/assets/images/account/btn_trash_w.svg'} />
          </button>
        ))}
      {!(
        browserUtils.isIOs() ||
        browserUtils.isIPad() ||
        browserUtils.isAndroid()
      ) &&
        isEditing &&
        onDownload && (
          <button
            className={styles.downloadButton}
            disabled={downloadDisabled}
            onClick={onDownload}
          >
            {!isMd ? (
              t('header.items.download')
            ) : (
              <img src={'/assets/images/icon_download_w.svg'} alt="" />
            )}
          </button>
        )}
    </>
  );
}
