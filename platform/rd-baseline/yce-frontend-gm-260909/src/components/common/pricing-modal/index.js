import styles from './index.module.scss';
import useWindowDevice from '@/hooks/use-window-device';
import Modal from '@/components/common/modal';
import CurrencySelector from '../currency-selector';
import useCurrencySelector from '../currency-selector/hooks/use-currency-selector';
import PlanTitle from './components/plan-title';
import Cover from './components/cover';
import FeatureTitle from './components/feature-title';
import FeatureList from './components/feature-list';
import PlanTabs from './components/plan-tabs';
import PlansSkeleton from './components/skeletons/plans';
import PlanList from './components/plan-list';
import MorePlanLink from './components/more-plan-link';
import CheckoutButton from './components/checkout-button';
import Countdown from './components/countdown';
import _isEmpty from 'lodash/isEmpty';
import useLogic from './hooks/use-logic';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { hoverClassMap, touchClassMap } from '@/utils/styles/stylesTypes';
import usePreviewLeft from '@/components/common/headers/hooks/use-preview-left';
import useDebugPreviewLeft from './hooks/use-debug-preview-left';
import useCheckHolidayProduct from '@/hooks/use-check-holiday-product';
import useHolidayType from '@/hooks/holiday/use-holiday-type';

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
                backgroundImage: 'url(/assets/images/icon_close_w.svg)',
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
              backgroundImage: 'url(/assets/images/icon_close.svg)',
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
          style={{ backgroundImage: 'url(/assets/images/icon_close.svg)' }}
          onClick={handleModalClose}
          data-mode={HolidayType}
        />
      )}
    </Modal>
  );
}
