import creditIcon from '../../../design-library/assets/icon/yco-credit-controls/credit.svg';
import addIcon from '../../../design-library/assets/icon/yco-credit-controls/add.svg';
import Button, { buttonTones } from '../button/index.js';
import styles from './CreditControls.module.scss';

export function CreditBadge({ value, testId, className = '' }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <span className={`${styles.badge} ${className}`} data-testid={testId}>
      <img src={creditIcon} alt="" aria-hidden="true" />
      <span>{value}</span>
    </span>
  );
}

export function CreditControl({ balance = 436, onClick, showAdd = true, className = '' }) {
  const content = (
    <>
      <img className={styles.balanceIcon} src={creditIcon} alt="" aria-hidden="true" />
      <span data-testid="credit-balance">{balance}</span>
      {showAdd ? <img className={styles.addIcon} src={addIcon} alt="" aria-hidden="true" /> : null}
    </>
  );

  return onClick ? (
    <button className={`${styles.control} ${className}`} data-testid="credit-control" data-component-role="credit-control" type="button" onClick={onClick} aria-label={`${balance} credits`}>
      {content}
    </button>
  ) : (
    <div className={`${styles.control} ${className}`} data-testid="credit-control" data-component-role="credit-control" aria-label={`${balance} credits`}>
      {content}
    </div>
  );
}

export function GenerateActionBar({
  label = 'Generate',
  subtitle,
  cost = 10,
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
}) {
  // Figma handoff spec (Footer Button, 2026-09): Text Only = 42px, Text with
  // credits = 44px (revised 2026-09-15 from 48px — "有credits的時候本來和你
  // 說高度是48px我們改成44px"), Two-line text = 56px, regardless of whether
  // the two-line version also carries a credit badge — subtitle presence
  // alone decides the height, not the badge. See CreditControls.module.scss's
  // .generateButton.
  //
  // Reference (2026-09-15, requested live — "當disable的時候無法偵測所需
  // credits所以可以把credit拿掉，然後按鈕高度設回42px"): while disabled, the
  // actual cost can't be known yet (it depends on a selection that isn't
  // finalized), so showing a specific credit number is misleading — the
  // badge is now hidden whenever disabled, not just while isLoading, which
  // makes this the plain "Text Only" composition from the spec above (42px),
  // not "Text with credits" (44px).
  const showCredit = !isLoading && !disabled;
  return (
    <div className={`${styles.actionBar} ${className}`} data-component-role="primary-action generate-action-with-credit">
      {/* .actionBarInner (2026-09-15, "不需要有綠色這層padding"): its only job
          was a width-responsive padding for this bar's old full-bleed
          edge-to-edge treatment — removed along with that padding, since it
          commonly sits inside an already-padded panel now instead (see
          CreditControls.module.scss's own decisionBasis). */}
        <Button
          className={`${styles.generateButton} ${subtitle ? styles.generateButtonTwoLine : (!showCredit ? styles.generateButtonNoCredit : '')}`}
          data-testid="generate-video"
          tone={buttonTones.BRAND}
          disabled={disabled}
          isLoading={isLoading}
          onClick={onClick}
        >
          <span className={styles.generateButtonText}>
            <span>{isLoading ? 'Generating…' : label}</span>
            {subtitle && !isLoading ? <span className={styles.generateButtonSubtitle}>{subtitle}</span> : null}
          </span>
          {showCredit ? <CreditBadge value={cost} testId="generate-credit-cost" /> : null}
        </Button>
    </div>
  );
}

export default CreditControl;
