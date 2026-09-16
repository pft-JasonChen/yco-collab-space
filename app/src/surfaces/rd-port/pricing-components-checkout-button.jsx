import styles from './pricing-index.module.scss';
import Button from '../../../../platform/ui/button/index.js';
import { PoweredByStripe as PoweredByStripe } from './pricing-adapters.jsx';
import { getTranslationFunction } from './pricing-adapters.jsx';
import TabsKey from './pricing-tabs-key.jsx';
import _isNil from 'lodash/isNil';

export default function CheckoutButton({
  isStripeMode,
  onlyShowPayAsYouGo,
  planType,
  isPlusUser,
  isEmptyPlans,
  selectedPlan,
  handleClick,
  holidayType,
}) {
  const { t } = getTranslationFunction();

  const getButtonLabel = () => {
    if (isStripeMode) {
      return t('pricing.dialog.button.next');
    }
    if (onlyShowPayAsYouGo || planType === TabsKey.payAsYouGo) {
      return t('message.dialog.button.credit.low');
    }
    if (isPlusUser && planType === TabsKey.pro) {
      return t('my.account.subscription.upgrade');
    }
    return t('my.account.subscription.subscribe');
  };

  return (
    <div className={styles.buttonContainer} data-mode={holidayType}>
      <Button
        className={styles.button}
        onClick={handleClick}
        disabled={isEmptyPlans || _isNil(selectedPlan)}
        variant="primary"
        tone="brand"
        size="medium"
        data-mode={holidayType}
      >
        {getButtonLabel()}
      </Button>
      {isStripeMode && <PoweredByStripe disableLink={true} />}
    </div>
  );
}
