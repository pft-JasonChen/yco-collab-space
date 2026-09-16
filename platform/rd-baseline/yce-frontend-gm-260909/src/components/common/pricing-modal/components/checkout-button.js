import styles from '../index.module.scss';
import ButtonWrapper from '../../button-wrapper';
import PoweredByStripe from '../../stripe-modal/components/powered-by-stripe';
import { getTranslationFunction } from '@/i18n';
import TabsKey from '../tabs-key';
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
