import styles from './index.module.scss';
import useCreditsLeft from '../../hooks/use-credits-left';
import LinkWithLocale from '@/components/utils/link-with-locale';
import { useEffect, useMemo } from 'react';
import localStorageUtils, {
  localStorageTypes,
  creditLowNotificationKey,
} from '@/utils/localStorageTypes';
import { useSelector } from 'react-redux';
import _get from 'lodash/get';
import SalesHint from '../sales-hint';
import usePricingModal from '@/hooks/use-pricing-modal';
import { pricingModalTypes } from '@/components/common/pricing-modal/utils/pricingModalTypes';
import { selectAccountCreditsDataReady } from '@/store/selector/apiSelector';

export default function CreditsLeft(props) {
  const { headerMenuOpened } = props;
  const leftCredits = useCreditsLeft();
  const userId = useSelector((state) => state.user.userInfo?.userId);
  const accountCreditsDataReady = useSelector(selectAccountCreditsDataReady);
  const { pricingModalPopUp } = usePricingModal();

  useEffect(() => {
    const localStorageResult = localStorageUtils.getParsedItem(
      localStorageTypes.creditLowNotification
    );
    const userData = _get(localStorageResult, userId);
    const showCreditLowNotification = _get(
      userData,
      creditLowNotificationKey.showCreditLowNotification
    );
    if (leftCredits > 6 && showCreditLowNotification && userId) {
      localStorageUtils.removeItem(
        localStorageTypes.creditLowNotification,
        userId
      );
    }
  }, [leftCredits]);

  const renderCredits = useMemo(() => {
    // const isPlural = leftCredits > 1;
    // if (!isPlural && _isEqual(locale, 'en-us')) {
    // return `${leftCredits} credit left`;
    // }
    // return t('header.credits.left', { credits: leftCredits });
    return accountCreditsDataReady && leftCredits !== null
      ? `${leftCredits}`
      : '--';
  }, [accountCreditsDataReady, leftCredits]);

  // if (!isLoginUser)
  //   return (
  //     <LinkWithLocale
  //       href="#"
  //       className={styles.container}
  //       onClick={(e) => {
  //         e.stopPropagation();
  //         dispatch(setLoginModalOpen(true));
  //       }}
  //     >
  //       {renderCredits()}
  //     </LinkWithLocale>
  //   );

  const openPopupPricing = (e) => {
    e.preventDefault();
    e.stopPropagation();
    pricingModalPopUp(pricingModalTypes.normal);
  };

  return (
    !headerMenuOpened && (
      <div className={styles.wrapper}>
        <LinkWithLocale
          href="#"
          className={styles.container}
          rel="noopener noreferrer"
          onClick={openPopupPricing}
        >
          <img
            className={styles.icon}
            src={`/assets/images/header/icon_credit.svg`}
            alt=""
          />
          <span className={styles.text}>{renderCredits}</span>
          <img
            className={`${styles.icon} ${styles.iconAdd}`}
            src={`/assets/images/header/icon_add.svg`}
            alt=""
          />
        </LinkWithLocale>
        <SalesHint />
      </div>
    )
  );
}
