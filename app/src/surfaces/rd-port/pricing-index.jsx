import pricingAssets from './pricing-assets.js';
import styles from './pricing-index.module.scss';
import { useWindowDevice as useWindowDevice } from './pricing-adapters.jsx';
import Modal from './Modal.jsx';
import CurrencySelector from './currency-index.jsx';
import { useCurrencySelector as useCurrencySelector } from './pricing-adapters.jsx';
import PlanTitle from './pricing-components-plan-title-general.jsx';
import Cover from './pricing-components-cover-index.jsx';
import FeatureTitle from './pricing-components-feature-title-general.jsx';
import FeatureList from './pricing-components-feature-list.jsx';
import PlanTabs from './pricing-components-plan-tabs.jsx';
import PlansSkeleton from './pricing-components-skeletons-plans.jsx';
import PlanList from './pricing-components-plan-list.jsx';
import MorePlanLink from './pricing-components-more-plan-link.jsx';
import CheckoutButton from './pricing-components-checkout-button.jsx';
import { Countdown as Countdown } from './pricing-adapters.jsx';
import _isEmpty from 'lodash/isEmpty';
import { usePricingLogic as useLogic } from './pricing-adapters.jsx';
import { useSelector } from './pricing-adapters.jsx';
import { useMemo } from 'react';
import { hoverClassMap, touchClassMap } from './pricing-adapters.jsx';
import { usePreviewLeft as usePreviewLeft } from './pricing-adapters.jsx';
import { useDebugPreviewLeft as useDebugPreviewLeft } from './pricing-adapters.jsx';
import { useCheckHolidayProduct as useCheckHolidayProduct } from './pricing-adapters.jsx';
import { useHolidayType as useHolidayType } from './pricing-adapters.jsx';

export default function PricingModal() {
  const { isMobile } = useWindowDevice();
  const { holidayType: HolidayType } = useHolidayType();
  const { isHolidayMode } = useCheckHolidayProduct();

  const {
    currencyList,
    setCurrencyList,
    toggleDropdown,
    currencyIndex,
    setCurrencyIndex,
    isActive,
    setIsActive,
  } = useCurrencySelector();

  const {
    opened,
    handleModalClose,
    getCustomModalStyles,
    getContainerModalStyles,
    onlyShowPayAsYouGo,
    onlyShowPro,
    getFeatureBoxStyles,
    credit,
    isProUser,
    isPlusUser,
    isFreeUser,
    planType,
    handleSetPlanType,
    isPayAsYouGoTab,
    currentPlans,
    getCreditAmount,
    setSelectedPlan,
    selectedPlan,
    savePercent,
    getPlanButtonStyles,
    handleClick,
    isEmptyPlans,
    isStripeMode,
    debugMode,
  } = useLogic({ currencyList, currencyIndex });

  const moduleType = useSelector((state) => state.info.moduleType);
  const sodType = useSelector((state) => state.info.sodType);
  const pricingModal = useSelector((state) => state.ui.pricingModal);

  const moduleTypeForDisplay = useMemo(() => {
    return pricingModal?.crossModuleType
      ? pricingModal.crossModuleType
      : moduleType;
  }, [moduleType, pricingModal]);

  const sodTypeForDisplay = useMemo(() => {
    return pricingModal?.crossSodType ? pricingModal.crossSodType : sodType;
  }, [sodType, pricingModal]);

  const { previewLeft: realPreviewLeft } = usePreviewLeft({
    name: `pricing-modal`,
  });
  const { debugPreviewLeft } = useDebugPreviewLeft();
  const previewLeft =
    debugPreviewLeft !== null ? debugPreviewLeft : realPreviewLeft;

  const checkoutButtonProps = {
    isStripeMode,
    onlyShowPayAsYouGo,
    planType,
    isPlusUser,
    isEmptyPlans,
    selectedPlan,
    getPlanButtonStyles,
    handleClick,
    holidayType: HolidayType,
  };

  return (
    <Modal
      opened={opened && !isEmptyPlans}
      handleClose={handleModalClose}
      customStyles={getCustomModalStyles()}
      showModalScaleTransition={true}
      containerStyles={getContainerModalStyles()}
    >
      <div
        className={`${styles.container} ${
          !isHolidayMode ? 'hidden-scrollbar' : ''
        }`}
        data-mode={HolidayType}
      >
        <div className={styles.featuresBlock} data-mode={HolidayType}>
          {(!isHolidayMode || !isMobile) && <Cover />}
          {!isHolidayMode && isMobile && (
            <div
              className={styles.close}
              style={{
                backgroundImage: `url("${pricingAssets['/assets/images/icon_close_w.svg']}")`,
              }}
              onClick={handleModalClose}
              data-mode={HolidayType}
            />
          )}
          <div className={styles.featuresContent}>
            {isHolidayMode && isMobile && (
              <PlanTitle onlyShowPayAsYouGo={onlyShowPayAsYouGo} />
            )}
            <div
              className={styles.featureBox}
              style={getFeatureBoxStyles(isMobile)}
              data-mode={HolidayType}
            >
              {!isMobile && <Countdown />}
              <div className={styles.featureTitleContainer}>
                {isHolidayMode && isMobile && <Cover />}
                <FeatureTitle
                  credit={credit}
                  isProUser={isProUser}
                  isPlusUser={isPlusUser}
                  isFreeUser={isFreeUser}
                  moduleType={moduleTypeForDisplay}
                  sodType={sodTypeForDisplay}
                  previewLeft={previewLeft}
                  isHolidayMode={isHolidayMode}
                  holidayType={HolidayType}
                />
              </div>
              <FeatureList
                planType={planType}
                isPayAsYouGoTab={isPayAsYouGoTab}
                credit={credit}
                isProUser={isProUser}
                isPlusUser={isPlusUser}
                isFreeUser={isFreeUser}
                moduleType={moduleTypeForDisplay}
                previewLeft={previewLeft}
                isHolidayMode={isHolidayMode}
              />
            </div>
          </div>
        </div>
        <div
          className={`${styles.rightBlock} ${
            isMobile && styles.rightBlock4ShortPhone
          }`}
          data-mode={HolidayType}
        >
          {(!isHolidayMode || !isMobile) && (
            <PlanTitle onlyShowPayAsYouGo={onlyShowPayAsYouGo} />
          )}
          <div
            className={`${styles.topContainer} ${
              !onlyShowPayAsYouGo && styles.flexColumn
            }`}
          >
            <PlanTabs
              planType={planType}
              handleSetPlanType={handleSetPlanType}
              onlyShowPayAsYouGo={onlyShowPayAsYouGo}
              onlyShowPro={onlyShowPro}
              isProUser={isProUser}
              isPlusUser={isPlusUser}
              isHolidayMode={isHolidayMode}
              isDebugMode={debugMode}
            />
          </div>
          <div>
            {_isEmpty(currentPlans) ? (
              <PlansSkeleton />
            ) : (
              <PlanList
                currentPlans={currentPlans}
                getCreditAmount={getCreditAmount}
                setSelectedPlan={setSelectedPlan}
                selectedPlan={selectedPlan}
                currencyList={currencyList}
                currencyIndex={currencyIndex}
                isPayAsYouGoTab={onlyShowPayAsYouGo}
                savePercent={savePercent}
                holidayType={HolidayType}
                isDebugMode={debugMode}
                moduleType={moduleTypeForDisplay}
              />
            )}
          </div>
          <div className={styles.bottomContainer}>
            <MorePlanLink
              planType={planType}
              handleModalClose={handleModalClose}
            />
            <CurrencySelector
              currencyList={currencyList}
              setCurrencyList={setCurrencyList}
              toggleDropdown={toggleDropdown}
              currencyIndex={currencyIndex}
              setCurrencyIndex={setCurrencyIndex}
              isActive={isActive}
              setIsActive={setIsActive}
              dropdownPosition="up"
              useIconUI={true}
            />
          </div>
          {(isHolidayMode || !isMobile) && (
            <CheckoutButton
              {...checkoutButtonProps}
              hoverClass={
                !isHolidayMode ? hoverClassMap.hover46e4fa : undefined
              }
              touchClass={
                !isHolidayMode ? touchClassMap.hover46e4fa : undefined
              }
            />
          )}
        </div>
        {!isHolidayMode && !isMobile && (
          <div
            className={styles.close}
            style={{
              backgroundImage: `url("${pricingAssets['/assets/images/icon_close.svg']}")`,
            }}
            onClick={handleModalClose}
            data-mode={HolidayType}
          />
        )}
      </div>
      {!isHolidayMode && isMobile && (
        <CheckoutButton
          {...checkoutButtonProps}
          hoverClass={hoverClassMap.hover46e4fa}
          touchClass={touchClassMap.hover46e4fa}
        />
      )}
      {isHolidayMode && (
        <div
          className={styles.close}
          style={{ backgroundImage: `url("${pricingAssets['/assets/images/icon_close.svg']}")` }}
          onClick={handleModalClose}
          data-mode={HolidayType}
        />
      )}
    </Modal>
  );
}
