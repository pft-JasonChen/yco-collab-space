import { useSelector } from './pricing-adapters.jsx';
import styles from './pricing-components-feature-title-general.module.scss';
import { getTranslationFunction } from './pricing-adapters.jsx';
import {
  freeUserNoPreviewPricingTypes,
  pricingModalTypes,
  PLUS_CUSTOM_PRICING_MODULE_TYPES,
  FREE_CUSTOM_PRICING_MODULE_TYPES,
} from './pricing-utils-pricingModalTypes.jsx';
import { domPurifyUtils as domPurifyUtils } from './pricing-adapters.jsx';
import { useMemo } from 'react';
import { useWindowDevice as useWindowDevice } from './pricing-adapters.jsx';
import {
  headerProducts,
  moduleTypes,
  noLimitTypes,
  sodTypes,
} from './pricing-module-exports.js';
import _get from 'lodash/get';
import { Textfit } from 'react-textfit';

export default function GeneralFeatureTitle(props) {
  const {
    credit,
    isProUser,
    isPlusUser,
    isFreeUser,
    moduleType,
    sodType,
    previewLeft,
  } = props;

  const pricingModalType = useSelector((state) => state.ui.pricingModal?.type);

  const { t, locale } = getTranslationFunction();
  const { isMobile } = useWindowDevice();

  const featureDisplayName = useMemo(() => {
    let i18nKey = headerProducts[moduleTypes.enhance] || ''; // use enhace as default
    if (moduleType === moduleTypes.sod) {
      if (sodType === sodTypes.blur) {
        i18nKey = _get(headerProducts, moduleTypes.blurBackground, '');
      } else if (sodType === sodTypes.change) {
        i18nKey = _get(headerProducts, moduleTypes.changeBackground, '');
      } else if (sodType === sodTypes.remove) {
        i18nKey = _get(headerProducts, moduleTypes.removeBackground, '');
      }
    } else {
      i18nKey = _get(headerProducts, moduleType, '');
    }
    return t(`header.items.product.${i18nKey.replaceAll('-', '.')}`);
  }, [moduleType, sodType]);

  const isPreviewPricingModal = useMemo(() => {
    if (!moduleType) {
      return false;
    }
    return freeUserNoPreviewPricingTypes.includes(moduleType);
  }, [moduleType]);

  const fitTitleStyles = useMemo(() => {
    if (isMobile && ['ja'].includes(locale)) {
      return {
        fontSize: '22px',
      };
    }
  }, [locale, isMobile]);

  // --- Render helpers ---

  const renderBigTitle = (i18nKey, extraStyle) => (
    <div
      className={styles.bigTitle}
      dangerouslySetInnerHTML={{
        __html: domPurifyUtils.sanitize(t(i18nKey), 'br'),
      }}
      style={extraStyle}
    />
  );

  const renderContainer = (children) => (
    <div className={styles.container}>
      <div className={styles.featureTitles}>{children}</div>
    </div>
  );

  // --- 1. Pro user / PayAsYouGo → "Need More Credits?"
  if (
    [pricingModalTypes.onlyShowPayAsYouGo].includes(pricingModalType) ||
    isProUser
  ) {
    return renderContainer(
      renderBigTitle('pricing.modal.feature.left.big.title.4')
    );
  }

  // --- 2. Free / Plus user + 特定 moduleType → "Subscribe / Upgrade to Unlock [featureName] Tool"
  const isCustomPricingModule =
    (isFreeUser && FREE_CUSTOM_PRICING_MODULE_TYPES.has(moduleType)) ||
    (isPlusUser && PLUS_CUSTOM_PRICING_MODULE_TYPES.has(moduleType));

  if (isCustomPricingModule) {
    // A Plus user hitting a Pro-only feature (onlyShowPro) "subscribes" to Pro
    // rather than "upgrades" — matches spec for the Pro-only-feature case.
    const unlockI18nKey =
      isFreeUser || pricingModalType === pricingModalTypes.onlyShowPro
        ? 'free.trial.subscribe.to.unlock'
        : 'free.trial.upgrade.to.unlock';

    return renderContainer(
      <>
        {pricingModalType === pricingModalTypes.outOfPreview && (
          <div className={`${styles.title} ${styles.title2}`}>
            {t('free.trial.no.preview.left')}
          </div>
        )}
        <Textfit mode="multi" max={28} min={12}>
          <div
            className={styles.title}
            dangerouslySetInnerHTML={{
              __html: domPurifyUtils.sanitize(
                t(unlockI18nKey, {
                  featureName: featureDisplayName,
                }),
                ['br', 'span']
              ),
            }}
          />
        </Textfit>
      </>
    );
  }

  // --- 3. outOfCredit / outOfPreview / lowCredits
  if (
    [pricingModalTypes.outOfCredit, pricingModalTypes.lowCredits].includes(
      pricingModalType
    )
  ) {
    return renderContainer(
      <>
        <div className={styles.title}>{t('pricing.modal.right.title.3')}</div>
        <div className={styles.bigTitle}>
          {isPlusUser
            ? t('pricing.modal.feature.left.big.title.2.upgrade')
            : t('pricing.modal.feature.left.big.title.2')}
        </div>
      </>
    );
  }

  // --- 4. Plus user (default)
  if (isPlusUser) {
    return renderContainer(
      renderBigTitle('pricing.modal.feature.left.big.title.3', fitTitleStyles)
    );
  }

  // --- 5. Free user + preview pricing modal → "Subscribe to Unlock [featureName] Tool"
  if (isPreviewPricingModal) {
    return renderContainer(
      <>
        {pricingModalType === pricingModalTypes.outOfPreview &&
          !noLimitTypes.includes(moduleType) && (
            <div className={`${styles.title} ${styles.title2}`}>
              {t('free.trial.no.preview.left')}
            </div>
          )}
        <Textfit mode="multi" max={28} min={12}>
          <div
            className={styles.title}
            dangerouslySetInnerHTML={{
              __html: domPurifyUtils.sanitize(
                t('free.trial.subscribe.to.unlock', {
                  featureName: featureDisplayName,
                }),
                ['br', 'span']
              ),
            }}
          />
        </Textfit>
      </>
    );
  }

  // --- 7. Default → credit display
  return (
    <div className={styles.container}>
      <div className={styles.featureTitles}>
        <div className={styles.title}>
          {t('pricing.modal.feature.left.title')}
        </div>
      </div>
      {!!credit && (
        <div className={styles.creditContainer}>
          <div className={styles.credit}>
            <span className={styles.creditNumber}>{credit || 0}</span>
          </div>
          <div className={styles.creditUnit}>
            {t('my.account.account.credit.usage.credits')} /{' '}
            {t('pricing.modal.feature.left.month')}
          </div>
        </div>
      )}
    </div>
  );
}
