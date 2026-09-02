import creditIcon from '../../../design-library/assets/icon/yco-credit-controls/credit.svg';
import addIcon from '../../../design-library/assets/icon/yco-credit-controls/add.svg';
import loadingIcon from '../../../design-library/assets/icon/yco-credit-controls/loading.png';
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
  cost = 10,
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
}) {
  return (
    <div className={`${styles.actionBar} ${className}`} data-component-role="primary-action generate-action-with-credit">
      <Button
        className={styles.generateButton}
        data-testid="generate-video"
        tone={buttonTones.BRAND}
        disabled={disabled}
        isLoading={isLoading}
        onClick={onClick}
      >
        <span>{isLoading ? 'Generating…' : label}</span>
        {!isLoading ? <CreditBadge value={cost} testId="generate-credit-cost" /> : null}
        {isLoading ? <img className={styles.loadingIcon} src={loadingIcon} alt="" aria-hidden="true" /> : null}
      </Button>
    </div>
  );
}

export default CreditControl;
