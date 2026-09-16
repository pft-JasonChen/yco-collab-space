import styles from './plan-list.module.scss';
import { useMemo } from 'react';
import useCheckHolidayProduct from '@/hooks/use-check-holiday-product';
import useHolidayStyles from '../hooks/use-holiday-styles';
import { getTranslationFunction } from '@/i18n';
import {
  getCurrencyPrice,
  getCurrencySymbol,
  shouldDisplayDecimal,
} from '@/components/pricing-page/hooks/get-currency-symbol';
import _map from 'lodash/map';
import _get from 'lodash/get';
import { freeUserNoPreviewPricingTypes } from '../utils/pricingModalTypes';
import { Textfit } from 'react-textfit';

export default function PlanList(props) {
  const {
    currentPlans,
    getCreditAmount,
    setSelectedPlan,
    selectedPlan,
    currencyList,
    currencyIndex,
    isPayAsYouGoTab,
    savePercent,
    holidayType,
    isDebugMode = false,
    moduleType,
  } = props;

  const { isHolidayMode, getProductPromotion } = useCheckHolidayProduct();

  const {
    getPlanWrapperStyles,
    getPlanDiscountLabelStyles,
    getBestOffsetPlanLabelStyles,
  } = useHolidayStyles();

  const { t } = getTranslationFunction();

  const isPreviewPricingModal = useMemo(() => {
    if (!moduleType) {
      return false;
    }
    return freeUserNoPreviewPricingTypes.includes(moduleType);
  }, [moduleType]);

  const plans = useMemo(() => {
    const getCreditCycle = (creditPlan) => {
      const cycle = _get(creditPlan, 'info.cycle');
      if (!cycle || cycle < 0) {
        return 1;
      } else {
        return cycle;
      }
    };

    return _map(currentPlans, (plan, index) => {
      const skuId = _get(plan, 'info.skuId', '');
      const localePrice = getCurrencyPrice(plan, currencyList[currencyIndex]);
      const amount = parseFloat(localePrice.amount);
      const creditAmount = getCreditAmount(plan);
      const cycle = getCreditCycle(plan);
      const price = isPayAsYouGoTab ? amount / cycle : amount;
      const currencySymbol =
        getCurrencySymbol(localePrice?.currency) +
        (localePrice?.currency === 'JPY' ? ' ' : '');

      const promotion = getProductPromotion(plan, isHolidayMode);
      const discount = parseInt(_get(promotion, 'discount.value') || 0);
      const originalPrice = shouldDisplayDecimal(
        isPayAsYouGoTab ? price : price / cycle,
        localePrice.currency
      );
      const discountPrice = shouldDisplayDecimal(
        (price * (100 - discount)) / 100 / cycle,
        localePrice.currency
      );

      return {
        amount,
        creditAmount,
        currencySymbol,
        discount,
        cycle,
        originalPrice,
        discountPrice,
        // only show on yearly plan
        savePercent: !isPayAsYouGoTab && cycle === 12 ? savePercent : null,
        skuId,
      };
    });
  }, [currentPlans, isHolidayMode, currencyIndex]);

  if (isDebugMode) {
    return plans.map(
      (
        {
          amount,
          creditAmount,
          currencySymbol,
          discount,
          cycle,
          originalPrice,
          discountPrice,
          savePercent,
          skuId,
        },
        index
      ) => (
        <div
          key={`rightBlock-${index}`}
          className={`${styles.planWrapper} ${
            isPreviewPricingModal ? styles.previewPriceWrapper : ''
          }`}
          style={getPlanWrapperStyles(selectedPlan === index)}
          onClick={() => setSelectedPlan(index)}
          data-debug="true"
        >
          {isPayAsYouGoTab ? (
            <div className={`${styles.leftContainer} ${styles.credits}`}>
              <span className={styles.creditsNumber}>
                <Textfit
                  mode="single"
                  max={18}
                  min={12}
                  className={styles.creditsNumber}
                >
                  {creditAmount}
                </Textfit>
              </span>{' '}
              <Textfit
                mode="single"
                max={16}
                min={12}
                className={styles.leftContainer}
              >
                {t('my.account.account.credit.usage.credits')}
              </Textfit>
            </div>
          ) : (
            <div className={styles.leftContainer}>
              <Textfit
                mode="single"
                max={16}
                min={12}
                className={styles.leftContainer}
              >
                {skuId}
              </Textfit>
            </div>
          )}
          <div
            className={`${styles.priceWrapper}  ${
              discount && styles.discountPriceWrapper
            } ${isPreviewPricingModal ? styles.previewPriceWrapper : ''}`}
          >
            <div
              className={`${styles.price} ${discount && styles.discountPrice}`}
            >
              <Textfit mode="single" max={24} min={12} className={styles.price}>
                {currencySymbol}
              </Textfit>
              {!isPayAsYouGoTab ? (
                <>
                  <Textfit mode="single" max={16} min={12}>
                    {discountPrice}/{t('price.card.abbr.mo')}
                  </Textfit>
                </>
              ) : (
                <>{discountPrice}</>
              )}
            </div>
            {discount ? (
              <div className={`${styles.priceLineThrough}`}>
                <Textfit
                  mode="single"
                  max={14}
                  min={10}
                  className={styles.priceLineThrough}
                >
                  {currencySymbol}
                </Textfit>
                {!isPayAsYouGoTab ? (
                  <>
                    <Textfit mode="single" max={14} min={12}>
                      {originalPrice}/{t('price.card.abbr.mo')}
                    </Textfit>
                  </>
                ) : (
                  <>
                    <Textfit mode="single" max={14} min={12}>
                      {amount}
                    </Textfit>
                  </>
                )}
              </div>
            ) : (
              <div></div>
            )}
          </div>
          {savePercent && (
            <div
              className={styles.savePercentWrapper}
              style={getBestOffsetPlanLabelStyles()}
              data-event={isHolidayMode ? holidayType : 'general'}
            >
              <div
                className={styles.savePercent}
                data-event={isHolidayMode ? holidayType : false}
              >
                {t('pricing.modal.save.off', { savePercent })}
              </div>
            </div>
          )}
        </div>
      )
    );
  }

  return plans.map(
    (
      {
        amount,
        creditAmount,
        currencySymbol,
        discount,
        cycle,
        originalPrice,
        discountPrice,
        savePercent,
      },
      index
    ) => (
      <div
        key={`rightBlock-${index}`}
        className={`${styles.planWrapper} ${
          isPreviewPricingModal ? styles.previewPriceWrapper : ''
        }`}
        style={getPlanWrapperStyles(selectedPlan === index)}
        onClick={() => setSelectedPlan(index)}
      >
        <div
          className={`${styles.priceWrapper}  ${
            discount && styles.discountPriceWrapper
          } ${isPreviewPricingModal ? styles.previewPriceWrapper : ''}`}
        >
          <div
            className={`${styles.price} ${discount && styles.discountPrice}`}
          >
            <Textfit mode="single" max={24} min={12} className={styles.price}>
              {currencySymbol}
            </Textfit>
            {!isPayAsYouGoTab ? (
              <>
                <Textfit
                  mode="single"
                  max={24}
                  min={12}
                  className={styles.price}
                >
                  {discountPrice}
                </Textfit>
                <span className={styles.perMonth}>
                  <Textfit mode="single" max={16} min={12}>
                    /{t('price.card.abbr.mo')}
                  </Textfit>
                </span>
              </>
            ) : (
              <>
                <Textfit
                  mode="single"
                  max={24}
                  min={12}
                  className={styles.price}
                >
                  {discountPrice}
                </Textfit>
              </>
            )}
          </div>
          {discount ? (
            <div className={`${styles.priceLineThrough}`}>
              <Textfit
                mode="single"
                max={14}
                min={10}
                className={styles.priceLineThrough}
              >
                {currencySymbol}
              </Textfit>
              {!isPayAsYouGoTab ? (
                <>
                  <Textfit mode="single" max={14} min={10}>
                    {originalPrice}/{t('price.card.abbr.mo')}
                  </Textfit>
                </>
              ) : (
                <>
                  <Textfit mode="single" max={14} min={10}>
                    {amount}
                  </Textfit>
                </>
              )}
            </div>
          ) : (
            <div></div>
          )}
        </div>
        {isPayAsYouGoTab ? (
          <div className={`${styles.leftContainer} ${styles.credits}`}>
            <span className={styles.creditsNumber}>
              <Textfit
                mode="single"
                max={14}
                min={10}
                className={styles.creditsNumber}
              >
                {creditAmount}
              </Textfit>
            </span>{' '}
            <Textfit
              mode="single"
              max={14}
              min={10}
              className={styles.creditsNumber}
            >
              {t('my.account.account.credit.usage.credits')}
            </Textfit>
          </div>
        ) : (
          <div className={styles.leftContainer}>
            <Textfit
              mode="single"
              max={16}
              min={12}
              className={styles.creditsNumber}
            >
              {cycle === 12
                ? t('pricing.modal.yearly')
                : t('pricing.modal.monthly')}
            </Textfit>
          </div>
        )}
        {savePercent && (
          <div
            className={styles.savePercentWrapper}
            style={getBestOffsetPlanLabelStyles()}
            data-event={isHolidayMode ? holidayType : 'general'}
          >
            <div
              className={styles.savePercent}
              data-event={isHolidayMode ? holidayType : false}
            >
              <Textfit
                mode="single"
                max={13}
                min={9}
                className={styles.savePercent}
              >
                {t('pricing.modal.save.off', { savePercent })}
              </Textfit>
            </div>
          </div>
        )}
      </div>
    )
  );
}
