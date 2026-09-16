import assetMap from './rd-assets.js';
import { getTranslationFunction } from './adapters.jsx';

/**
 * The left side of the gallery / ai-tools header bar.
 *
 * Shared markup between the gallery and ai-tools tabs; each tab passes its own
 * CSS-module `styles` object (so styling stays per-tab) and its own tip content
 * as `children` (gallery uses plain text, ai-tools uses sanitized HTML).
 *
 * @param {Object} props
 * @param {Object} props.styles            the caller's CSS-module styles
 * @param {boolean} props.isEditing
 * @param {boolean} props.isSelectAll      already-resolved boolean (gallery passes isSelectAll())
 * @param {Function} props.onToggleSelectAll
 * @param {Function} props.onNoticeClick
 * @param {React.ReactNode} props.children tip content shown when not editing
 */
export default function SelectAllHeader({
  styles,
  isEditing,
  isSelectAll,
  onToggleSelectAll,
  onNoticeClick,
  children,
}) {
  const { t } = getTranslationFunction();

  if (!isEditing) {
    return (
      <div className={styles.flex}>
        <div className={styles.icon} onClick={onNoticeClick}>
          <img src={assetMap["/assets/images/ico_yce_notice.svg"]} alt={'tips'} />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.flex}>
      <span className={`${styles.checkbox}`} onClick={onToggleSelectAll}>
        {isSelectAll && (
          <img
            src={assetMap["/assets/images/account/aiTools/aiHeadshot/icon_Tick.svg"]}
            className={styles.checkboxChecked}
          />
        )}
      </span>
      <label className={styles.label}>
        {t('my.account.history.select.all')}
        <input type="checkbox" onClick={onToggleSelectAll} />
      </label>
    </div>
  );
}
