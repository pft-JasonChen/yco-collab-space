import styles from './index.module.scss';
import { useEffect, useMemo, useState } from 'react';
import useCheckHolidayProduct from '@/hooks/use-check-holiday-product';
import useActiveModule from '../../hooks/use-active-module';
import useWindowDevice from '@/hooks/use-window-device';
import useHeaderGeneral from '../../hooks/use-header-general';
import useTwoCheckout from '@/hooks/use-two-checkout';
import GeneralPricing from './general-pricing';
import HolidayPricing from './holiday-pricing';
import HoverBoxWrapper from '../hover-box-wrapper';
import HoverContent from './hover-content';
import useGetHolidayIcon from './holiday-pricing/hooks/use-get-holiday-icon';
import usePricingModal from '@/hooks/use-pricing-modal';
import { pricingModalTypes } from '@/components/common/pricing-modal/utils/pricingModalTypes';
import useGetUserSubscriptionType from '@/hooks/user/use-get-user-subscription-type';

export default function PricingIcon(props) {
  const {
    handleRouterToPricing,
    cmsUseCaseMenu,
    isSubscribe = false,
    isUpgrade = false,
    isProUser = false,
    isHeaderNavigation = false,
  } = props;
  const [loading, setLoading] = useState(true);
  const { isProductListCompleted, isHolidayMode } = useCheckHolidayProduct({
    isPricingIcon: true,
  });
  const { isActiveModule } = useActiveModule();
  const { isUserUser } = useGetUserSubscriptionType();
  const {
    updateSourcePage,
    updateSourceButton4PricingIcon,
    updateSourceButton4HoverPricing,
  } = useTwoCheckout();
  const { isDesktop, isMd } = useWindowDevice();
  const { isResultPage, isHomePage, isAiAgentPage } = useHeaderGeneral();
  const { init, cmsIcon, cmsIcon4Mb } = useGetHolidayIcon(
    isHolidayMode,
    cmsUseCaseMenu
  );
  const { pricingModalPopUp } = usePricingModal();

  useEffect(() => {
    if (!isProductListCompleted) return;
    setLoading(false);
  }, [isProductListCompleted]);

  const handleButtonClick = () => {
    updateSourcePage();
    updateSourceButton4PricingIcon();
    if (isHomePage && !isUserUser) {
      pricingModalPopUp(pricingModalTypes.normal);
      return;
    }
    handleRouterToPricing();
  };

  const handleHoverButtonClick = () => {
    updateSourcePage();
    updateSourceButton4HoverPricing();
    handleRouterToPricing();
  };

  /*if (loading && isMd) {
    return null;
    //return <div className={`${styles.skeletonMobile} shimmer-skeleton`} />;
  } else if (loading) {
    return null;
    //return <div className={`${styles.skeleton} shimmer-skeleton`} />;
  } else */
  if (isHolidayMode) {
    return (
      <HoverBoxWrapper
        hoverContent={
          <HolidayPricing
            handleButtonClick={handleButtonClick}
            init={init}
            cmsIcon={cmsIcon}
            cmsIcon4Mb={cmsIcon4Mb}
            isSubscribe={isSubscribe}
            isUpgrade={isUpgrade}
          />
        }
        content={<HoverContent handleClick={handleHoverButtonClick} />}
        align={!isHeaderNavigation ? 'right' : 'left'}
        customOffset={12} // margin between icons
        showPersistOnMobile={isDesktop}
      />
    );
  } else if (isHeaderNavigation === true) {
    return (
      <HoverBoxWrapper
        hoverContent={
          <GeneralPricing
            isActiveModule={isActiveModule}
            handleButtonClick={handleButtonClick}
            isResultPage={isResultPage}
            isMd={isMd}
            isSubscribe={isSubscribe}
            isUpgrade={isUpgrade}
            isProUser={isProUser}
            isHeaderNavigation={isHeaderNavigation}
          />
        }
        content={<HoverContent handleClick={handleHoverButtonClick} />}
        align={isResultPage ? 'right' : 'left'}
        showPersistOnMobile={isDesktop}
      />
    );
  } else {
    return (
      <HoverBoxWrapper
        hoverContent={
          <GeneralPricing
            isActiveModule={isActiveModule}
            handleButtonClick={handleButtonClick}
            isHomePage={isHomePage}
            isResultPage={isResultPage}
            isMd={isMd}
            isSubscribe={isSubscribe}
            isUpgrade={isUpgrade}
            isProUser={isProUser}
          />
        }
        content={<HoverContent handleClick={handleHoverButtonClick} />}
        align={isResultPage || isHomePage || isAiAgentPage ? 'right' : 'left'}
        customOffset={12}
        showPersistOnMobile={isDesktop}
      />
    );
  }
}
