import Button from '../../../platform/ui/button/index.js';
import styles from './storage.module.scss';

/**
 * Capacity surfaces. Nothing in the RD snapshot covers storage quota, so these
 * three are feature-owned and built from RD tokens only — the severity ramp
 * reuses the existing warning/error semantic set rather than introducing colour.
 *
 * One usage value drives all four states, so a reviewer can walk normal ->
 * warning -> critical -> full without having to fill a real library.
 */

export function resolveStorageState(usedBytes, quotaBytes) {
  const ratio = quotaBytes > 0 ? usedBytes / quotaBytes : 0;
  if (ratio >= 1) return 'full';
  if (ratio >= 0.9) return 'critical';
  if (ratio >= 0.75) return 'warning';
  return 'normal';
}

/**
 * Sits in the page heading, immediately beside the upgrade entry. The metric and
 * the action it triggers are never separated: a storage row that opens a
 * credits-led modal somewhere else is the specific failure this avoids.
 */
export function StorageMeter({ t, usage, state, onManage, onUpgrade }) {
  const percent = Math.min(100, Math.round((usage.usedBytes / usage.quotaBytes) * 100));

  return (
    <div className={styles.meter} data-testid="storage-meter" data-state={state}>
      <div className={styles.meterText}>
        <span className={styles.meterUsage} data-testid="storage-meter-usage">
          {t('cloud.storage.meter.usage', { used: usage.usedLabel, quota: usage.quotaLabel })}
        </span>
        {state !== 'normal' && (
          <span className={styles.meterRemaining} data-testid="storage-meter-remaining">
            {t('cloud.storage.meter.remaining', { remaining: usage.remainingLabel })}
          </span>
        )}
      </div>
      <div className={styles.meterTrack} role="presentation">
        <div className={styles.meterFill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.meterActions}>
        <Button variant="tertiary" size="small" onClick={onManage} data-testid="storage-manage-entry">
          {t('cloud.storage.action.manage')}
        </Button>
        <Button variant="tertiary" size="small" onClick={onUpgrade} data-testid="storage-upgrade-entry">
          {t('cloud.storage.action.upgrade')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Persistent banner from 90 percent. It is the last warning before an action is
 * actually blocked, so it carries both exits: clearing space and buying it.
 */
export function StorageCriticalBanner({ t, usage, onManage, onExpand }) {
  return (
    <div className={styles.banner} data-testid="storage-critical-banner" role="status">
      <p className={styles.bannerText}>
        {t('cloud.storage.banner.critical', { remaining: usage.remainingLabel })}
      </p>
      <div className={styles.bannerActions}>
        <Button variant="secondary" size="small" onClick={onManage} data-testid="banner-manage-action">
          {t('cloud.storage.action.manage.space')}
        </Button>
        <Button variant="primary" size="small" onClick={onExpand} data-testid="banner-expand-action">
          {t('cloud.storage.action.expand')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Raised at the moment an action needs space it does not have. Three exits, in
 * deliberate order: clearing space comes first so paying is never presented as
 * the only way out.
 */
export function StorageFullDialog({ t, usage, onManage, onBuyPack, onUpgrade, onClose }) {
  return (
    <div className={styles.dialogBackdrop} data-testid="storage-full-backdrop" onClick={onClose}>
      <div
        className={styles.dialog}
        data-testid="storage-full-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-storage-full-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.dialogTitle} id="cloud-storage-full-title">
          {t('cloud.storage.full.title')}
        </h2>
        <p className={styles.dialogBody}>
          {t('cloud.storage.full.body', { quota: usage.quotaLabel })}
        </p>
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onManage} data-testid="full-manage-action">
            {t('cloud.storage.action.manage.space')}
          </Button>
          <Button variant="secondary" onClick={onBuyPack} data-testid="full-pack-action">
            {t('cloud.storage.action.add.storage')}
          </Button>
          <Button variant="primary" onClick={onUpgrade} data-testid="full-upgrade-action">
            {t('cloud.storage.action.upgrade.pro')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Prototype-only. Capacity states cannot be reached reliably by uploading during
 * a review, so the reviewer sets them directly. Marked as a review tool rather
 * than styled like product UI.
 */
export function ReviewUsageControl({ t, value, options, onChange }) {
  return (
    <label className={styles.reviewControl}>
      <span className={styles.reviewLabel}>{t('cloud.storage.review.label')}</span>
      <select
        className={styles.reviewSelect}
        data-testid="review-usage-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
