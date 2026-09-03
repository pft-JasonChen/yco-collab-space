import { useSelector } from 'react-redux';
import styles from './index.module.scss';
import ButtonWrapper from '@/components/common/button-wrapper';
import CreditBadge from './components/credit-badge';
import DiscountDisplay from './components/discount-display';

export default function ApplyButtonWithCoinCredit(props) {
  const {
    children,
    className,
    buttonText,
    descText,
    creditStyle,
    creditText,
    creditContainerStyle,
    ...restProps
  } = props;

  // Retrieve credit cost from Redux store (for t2i, i2v, t2v)
  const reduxCreditCost = useSelector(
    (state) => state.settings?.creditCost || {}
  );
  const {
    // creditCost = 0,
    originalCreditCost = 0,
    discountPercentage = 0,
  } = reduxCreditCost;

  const numericCredit = parseInt(creditText, 10);
  const displayCredit = !isNaN(numericCredit) ? numericCredit : creditText;

  const shouldShowCredit = creditText && displayCredit !== 0;
  const hasDiscount =
    originalCreditCost > numericCredit && discountPercentage > 0;

  return (
    <ButtonWrapper
      className={`${styles.buttonWithCoinCredit} ${className || ''}`}
      {...restProps}
    >
      {descText ? (
        <div className={styles.inline}>
          <div className={styles.desc2}>{buttonText}</div>
          <div className={styles.smallDesc}>{descText}</div>
        </div>
      ) : (
        buttonText && <div className={styles.desc}>{buttonText}</div>
      )}

      {shouldShowCredit && (
        <CreditBadge
          displayCredit={displayCredit}
          creditStyle={creditStyle}
          containerStyle={creditContainerStyle}
        />
      )}
      {shouldShowCredit && hasDiscount && (
        <DiscountDisplay
          originalCreditCost={originalCreditCost}
          discountPercentage={discountPercentage}
        />
      )}
      {children}
    </ButtonWrapper>
  );
}
