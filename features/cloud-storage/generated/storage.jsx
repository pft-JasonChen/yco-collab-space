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
export function StorageMeter({ t, usage, state, isPro, onUpgrade, onExpand }) {
  const percent = Math.min(100, Math.round((usage.usedBytes / usage.quotaBytes) * 100));

  return (
    <div
      className={styles.meter}
      data-component-role="storage-meter"
      data-testid="storage-meter"
      data-state={state}
    >
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
      {/* Pro is the highest subscription, so there is nothing left to upgrade
          to: the only thing still purchasable is capacity, and the action says
          so rather than offering a plan the user already has. */}
      <div className={styles.meterActions}>
        {isPro ? (
          <Button
            variant="secondary"
            tone="brand"
            size="tiny"
            onClick={onExpand}
            data-testid="storage-expand-entry"
          >
            {t('cloud.storage.action.expand.storage')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            tone="brand"
            size="tiny"
            onClick={onUpgrade}
            data-testid="storage-upgrade-entry"
          >
            {t('cloud.storage.action.upgrade')}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Persistent banner from 90 percent, and again once the quota is spent. Critical
 * is the last warning before an action is blocked; full is the state where it
 * already is, and it keeps a bar of its own rather than waiting for the blocking
 * dialog — a user who is over quota should be told so while looking at the page,
 * not only at the moment a save fails. The two are one component because they
 * say the same thing at two severities: the copy and the error ramp change, the
 * shape and the single exit do not.
 */
export function StorageStateBanner({ t, usage, state, onExpand }) {
  const isFull = state === 'full';
  return (
    <div
      className={styles.banner}
      data-testid={isFull ? 'storage-full-banner' : 'storage-critical-banner'}
      data-component-role="storage-state-banner"
      data-state={state}
      role="status"
    >
      <p className={styles.bannerText}>
        {isFull
          ? t('cloud.storage.banner.full.upgrade')
          : t('cloud.storage.banner.critical.upgrade', { remaining: usage.remainingLabel })}
      </p>
      {/* Cleanup was removed from the product on 2026-09-16, so adding space is
          the only action here. Recorded in decisions.md, including what it
          costs: a blocked user has no signposted way to clear space. */}
      <div className={styles.bannerActions}>
        <Button variant="primary" size="small" onClick={onExpand} data-testid="banner-expand-action">
          {t('cloud.storage.action.expand')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Raised at the moment an action needs space it does not have. It is a surface
 * rather than a button row: it shows the capacity that is full, so the number
 * the user is being asked to act on is visible at the moment of blocking, then
 * states what is blocked, then offers the one thing that resolves it. The action
 * opens the purchase overlay rather than buying anything itself.
 */
export function StorageFullDialog({ t, usage, onUpgrade, onClose }) {
  // The full-width meter this dialog used to carry overlapped the close control
  // and repeated a number the page already shows, so the detail line states the
  // quota instead.
  return (
    <div className={styles.dialogBackdrop} data-testid="storage-full-backdrop" onClick={onClose}>
      <div
        className={styles.dialog}
        data-testid="storage-full-dialog"
        data-component-role="storage-blocking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-storage-full-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label={t('cloud.storage.action.close')}
        >
          <span aria-hidden="true">✕</span>
        </button>

        <h2 className={styles.dialogTitle} id="cloud-storage-full-title">
          {t('cloud.storage.full.headline')}
        </h2>
        <p className={styles.dialogBody}>
          {t('cloud.storage.full.detail', { quota: usage.quotaLabel })}
        </p>

        <div className={styles.dialogActions}>
          <Button variant="primary" onClick={onUpgrade} data-testid="full-upgrade-action">
            {t('cloud.storage.action.upgrade.space')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Prototype-only. Capacity states cannot be reached reliably by uploading during
 * a review, so the reviewer sets them directly.
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

/**
 * Prototype-only, and pinned bottom-left so it never sits in the reading path of
 * the page it controls. Collapsed it is a single `Demo` pill; expanded it holds
 * the capacity states and the plan switch, so a reviewer can see the same page
 * under a Pro quota.
 *
 * The dashed border and the amber it borrows from the warning ramp are
 * deliberate: DESIGN-013 asks that this reads unmistakably as a review tool and
 * is never mistaken for product UI.
 */
export function DemoWidget({ t, open, onOpenChange, review, plan }) {
  if (!open) {
    return (
      <div className={styles.demo}>
        <button
          type="button"
          className={styles.demoPill}
          data-testid="demo-toggle"
          onClick={() => onOpenChange(true)}
        >
          {t('cloud.storage.demo.label')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.demo}>
      <div className={styles.demoPanel} data-testid="demo-panel" role="group" aria-label={t('cloud.storage.demo.title')}>
        <div className={styles.demoHeader}>
          <span className={styles.demoTitle}>{t('cloud.storage.demo.title')}</span>
          <button
            type="button"
            className={styles.demoClose}
            data-testid="demo-collapse"
            aria-label={t('cloud.storage.demo.collapse')}
            onClick={() => onOpenChange(false)}
          >
            −
          </button>
        </div>

        <div className={styles.demoRow}>
          <span className={styles.demoRowLabel}>{t('cloud.storage.demo.capacity')}</span>
          <ReviewUsageControl
            t={t}
            value={review.value}
            options={review.options}
            onChange={review.onChange}
          />
        </div>

        <div className={styles.demoRow}>
          <span className={styles.demoRowLabel}>{t('cloud.storage.demo.plan')}</span>
          <div className={styles.demoSegmented}>
            <button
              type="button"
              className={styles.demoSegment}
              data-testid="demo-plan-free"
              aria-pressed={plan.value === 'free'}
              onClick={() => plan.onChange('free')}
            >
              {t('cloud.storage.demo.plan.free')}
            </button>
            <button
              type="button"
              className={styles.demoSegment}
              data-testid="demo-plan-pro"
              aria-pressed={plan.value === 'pro'}
              onClick={() => plan.onChange('pro')}
            >
              {t('cloud.storage.demo.plan.pro')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

