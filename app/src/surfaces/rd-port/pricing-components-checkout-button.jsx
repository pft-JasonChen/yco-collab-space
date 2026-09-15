import styles from './pricing-index.module.scss';
import ButtonWrapper from './ButtonWrapper.jsx';
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
  getPlanButtonStyles,
  handleClick,
  holidayType,
  hoverClass,
  touchClass,
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
      <ButtonWrapper
        className={styles.button}
        style={getPlanButtonStyles()}
        onClick={handleClick}
        disabled={isEmptyPlans || _isNil(selectedPlan)}
        hoverClass={hoverClass}
        touchClass={touchClass}
        data-mode={holidayType}
      >
        {getButtonLabel()}
      </ButtonWrapper>
      {isStripeMode && <PoweredByStripe disableLink={true} />}
    </div>
  );
}
