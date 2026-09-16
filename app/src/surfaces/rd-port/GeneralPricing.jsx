import styles from './GeneralPricing.module.scss';
import assetMap from './rd-assets.js';
import { useMemo } from 'react';
import { useCheckHolidayProduct as useCheckHolidayProduct } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { HolidayTypes } from './adapters.jsx';
import { useHolidayType as useHolidayType } from './adapters.jsx';

export default function GeneralPricing(props) {
  const {
    isActiveModule,
    handleButtonClick,
    isHomePage,
    isResultPage,
    isMd,
    isSubscribe = false,
    isUpgrade = false,
    isProUser = false,
    isHeaderNavigation = false,
  } = props;
  const { t } = getTranslationFunction();
  const { holidayType: HolidayType } = useHolidayType();
  const { isHolidayMode } = useCheckHolidayProduct({ isPricingIcon: true });

  const text = useMemo(() => {
    if (isSubscribe) {
      return t('free.trial.button.subscribe');
    }
    if (isUpgrade) {
      return t('free.trial.button.change.plan');
    }
    return t('header.item.pricing');
  }, [isSubscribe, isUpgrade, t]);

  const getProductIcon = () => {
    return assetMap['/assets/images/header/icon_pricing_mb.svg'];
    /* if (!isHolidayMode) {
      return '/assets/images/header/icon_pricing_mb.svg';
    } else if (HolidayType === HolidayTypes.goldenWeek) {
      if (isMd) {
        return '/assets/images/header/ja/icon_pricing_mb.png';
      } else {
        return '/assets/images/header/ja/icon_pricing_dt.png';
      }
    } */
  };

  if (isProUser) {
    if (isMd && !isHomePage && !isResultPage)
      return (
        <div
          id={`yce-link-pricing`}
          className={`${styles.pricing} ${
            isActiveModule('pricing') ? styles.activePricing : ''
          }`}
          onClick={handleButtonClick}
        >
          <img
            className={styles.productIcon}
            src={getProductIcon()}
            loading="lazy"
            alt=""
          />
          {!isMd && <div className={styles.productText}>{text}</div>}
        </div>
      );
    else return null;
  }

  if (isHeaderNavigation) {
    return (
      <div
        id={`yce-link-pricing`}
        className={styles.pricingNoCustom}
        onClick={handleButtonClick}
      >
        <div className={styles.productTextNoCustom}>{text}</div>
      </div>
    );
  }

  return (
    <div
      id={`yce-link-pricing`}
      className={`${styles.pricing} ${
        isActiveModule('pricing') ? styles.activePricing : ''
      }`}
      onClick={handleButtonClick}
    >
      <img
        className={styles.productIcon}
        src={getProductIcon()}
        loading="lazy"
        alt=""
      />
      {!isMd && <div className={styles.productText}>{text}</div>}
    </div>
  );
}
