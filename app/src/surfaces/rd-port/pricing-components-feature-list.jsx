import styles from './pricing-components-feature-list.module.scss';
import { useMemo } from 'react';
import useHolidayStyles from './pricing-hooks-use-holiday-styles.jsx';
import { getTranslationFunction } from './pricing-adapters.jsx';
import TabsKey from './pricing-tabs-key.jsx';
import { useSelector } from './pricing-adapters.jsx';
import {
  pricingModalTypes,
  PLUS_CUSTOM_PRICING_MODULE_TYPES,
  FREE_CUSTOM_PRICING_MODULE_TYPES,
} from './pricing-utils-pricingModalTypes.jsx';
import { domPurifyUtils as domPurifyUtils } from './pricing-adapters.jsx';
import usePlanList from './pricing-hooks-use-plan-list.jsx';
import { moduleTypes } from './pricing-module-exports.js';
import {
  FEATURE_LIST_PRO,
  FEATURE_LIST_PLUS,
  FEATURE_LIST_NORMAL,
  FEATURE_LIST_PAY_AS_YOU_GO,
} from './pricing-config-feature-list-config.jsx';

export default function FeatureList(props) {
  const {
    isPayAsYouGoTab,
    planType,
    credit,
    isProUser,
    isPlusUser,
    isFreeUser,
    moduleType,
    previewLeft,
    isHolidayMode = false,
  } = props;

  const pricingModalType = useSelector((state) => state.ui.pricingModal?.type);

  const { t } = getTranslationFunction();

  const { getFeatureTickStyles } = useHolidayStyles();

  const {
    getFeatureListPro,
    getFeatureListPlus,
    getFeatureListForPlusUser,
    getFeatureListFreeUserWithPreviewLeft,
  } = usePlanList();

  const features = useMemo(() => {
    // Pay-As-You-Go 方案
    if (isPayAsYouGoTab) return FEATURE_LIST_PAY_AS_YOU_GO;

    const isProPlan = planType === TabsKey.pro;

    const hasLowCredit = [
      pricingModalTypes.outOfCredit,
      pricingModalTypes.lowCredits,
    ].includes(pricingModalType);

    const creditsItem = {
      title: 'pricing.modal.credits.unit',
      interpolationKey: 'credits',
      interpolationValue: credit,
    };

    // Plus user 在特定 module 用完額度 → 顯示該 module 的專屬 feature list
    if (isPlusUser && PLUS_CUSTOM_PRICING_MODULE_TYPES.has(moduleType)) {
      return getFeatureListForPlusUser(credit, moduleType);
    }

    // Free user preview 用完 + outOfPreview → 顯示該 module 的 photo editing feature list
    if (
      isFreeUser &&
      pricingModalType === pricingModalTypes.outOfPreview &&
      FREE_CUSTOM_PRICING_MODULE_TYPES.has(moduleType)
    ) {
      return isProPlan
        ? getFeatureListPro(credit, moduleType)
        : getFeatureListPlus(credit, moduleType);
    }

    // Free user 尚有 preview 次數 → 顯示該 module 的專屬 feature list
    if (
      isFreeUser &&
      previewLeft > 0 &&
      FREE_CUSTOM_PRICING_MODULE_TYPES.has(moduleType)
    ) {
      return getFeatureListFreeUserWithPreviewLeft(
        credit,
        moduleType,
        isProPlan
      );
    }

    if (
      isFreeUser &&
      pricingModalType === pricingModalTypes.outOfCredit &&
      moduleType === moduleTypes.aiAgent
    ) {
      return isProPlan
        ? getFeatureListPro(credit, moduleType)
        : getFeatureListPlus(credit, moduleType);
    }

    // Pro 方案且有低額度警告 / PlusUser 看到 Pro 方案要 show 點數
    if ((isProPlan && hasLowCredit) || isPlusUser) {
      return [creditsItem, ...FEATURE_LIST_PRO];
    }

    // 一般方案且有低額度警告
    if (hasLowCredit) {
      return [
        creditsItem,
        ...(isProPlan ? FEATURE_LIST_NORMAL : FEATURE_LIST_PLUS),
      ];
    }

    // 預設回傳 Pro 或 Plus 清單
    return isProPlan
      ? moduleType
        ? getFeatureListPro(credit, moduleType)
        : FEATURE_LIST_PRO
      : moduleType
      ? getFeatureListPlus(credit, moduleType)
      : FEATURE_LIST_PLUS;
  }, [
    isPayAsYouGoTab,
    planType,
    credit,
    pricingModalType,
    isProUser,
    isPlusUser,
    moduleType,
    previewLeft,
  ]);

  return (
    <div className={styles.outerWrapper}>
      <div className={styles.box} data-holiday={isHolidayMode}>
        {features.map((feature, index) => (
          <div key={`box-${index}`} className={styles.boxItem}>
            <div className={styles.checkmark} style={getFeatureTickStyles()}>
              <Tick />
            </div>
            <div
              className={styles.featureText}
              dangerouslySetInnerHTML={{
                __html: domPurifyUtils.sanitize(
                  t(feature.title, {
                    ...(feature.interpolationKey && {
                      [feature.interpolationKey]: feature.interpolationValue,
                    }),
                    ...feature.interpolation,
                  }),
                  'span'
                ),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const Tick = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.6606 6.2493C19.0752 6.61415 19.1156 7.24603 18.7507 7.66064L9.20001 18.5137L4.2493 12.8879C3.88444 12.4733 3.92478 11.8414 4.33938 11.4766C4.75399 11.1117 5.38587 11.152 5.75073 11.5667L9.20001 15.4863L17.2493 6.33938C17.6142 5.92478 18.246 5.88444 18.6606 6.2493Z"
        fill="currentColor"
      />
    </svg>
  );
};
