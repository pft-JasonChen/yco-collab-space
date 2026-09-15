import styles from './pricing-components-plan-title-general.module.scss';
// import { useSelector } from './pricing-adapters.jsx';
import { getTranslationFunction } from './pricing-adapters.jsx';
// import { pricingModalTypes } from './pricing-utils-pricingModalTypes.jsx';

export default function GeneralTitle({ onlyShowPayAsYouGo }) {
  const { t } = getTranslationFunction();
  // const ui = useSelector((state) => state.ui);
  // const { pricingModal } = ui;

  // if (
  //   [pricingModalTypes.outOfCredit, pricingModalTypes.lowCredits].includes(
  //     pricingModal.type
  //   )
  // ) {
  //   return (
  //     <div className={styles.title}>
  //       {t('pricing.modal.right.title.3')}{' '}
  //       <span>{t('pricing.modal.right.title.4')}</span>
  //     </div>
  //   );
  // } else
  if (onlyShowPayAsYouGo) {
    return (
      <div className={styles.title}>{t('pricing.modal.right.title.6')}</div>
    );
  } else {
    return (
      <div className={styles.title}>{t('pricing.modal.right.title.5')}</div>
    );
  }
}
