// Local data/services only; all pricing presentation is imported from RD.
import { createContext, useContext, useState } from 'react';
import DOMPurify from 'dompurify';
import useWindowDevice from './use-window-device.js';
import useHolidayStyles from './pricing-hooks-use-holiday-styles.jsx';
export { useWindowDevice };
export { getTranslationFunction, useSelector, LinkWithLocale, hoverClassMap, touchClassMap } from './adapters.jsx';
import { HolidayTypes } from './adapters.jsx';
export { HolidayTypes };
export const useHolidayType = () => ({ holidayType: HolidayTypes.default });
export const useCheckHolidayProduct = () => ({ isHolidayMode: false, getProductPromotion: () => null });
export const domPurifyUtils = { sanitize: text => DOMPurify.sanitize(text) };
export const paymentUtils = { getCurrency: () => 'USD' };
export const groupType = { ENH_SUB_TKN: 'ENH_SUB_TKN', ENH_PAYS_TKN: 'ENH_PAYS_TKN' };
export const useGA = () => ({ moreEvent() {} });
export const usePreviewLeft = () => ({ previewLeft: 0 });
export const useDebugPreviewLeft = () => ({ debugPreviewLeft: null });
export const Countdown = () => null; // RD returns null for the non-holiday branch.
export const PoweredByStripe = () => null; // fixture uses the non-Stripe branch.
const PricingContext = createContext(null);
export function PricingProvider({ children, onClose, onCheckout }) {
  return <PricingContext.Provider value={{ onClose, onCheckout }}>{children}</PricingContext.Provider>;
}
export function useCurrencySelector() {
  const [currencyList, setCurrencyList] = useState(['USD']);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  return { currencyList, setCurrencyList, currencyIndex, setCurrencyIndex, isActive, setIsActive, toggleDropdown: () => setIsActive(value => !value) };
}
// Synthetic display-only pricing, NOT a live offer, billing integration or checkout.
const fixturePlan = (id, cycle, amount, credits) => ({ info: { skuId: id, cycle, prices: [{ currency: 'USD', amount }], customInfo: { tokenInfo: { amount: credits } } } });
const plans = {
  pro: [fixturePlan('fixture-pro-month', 1, 19.99, 3000), fixturePlan('fixture-pro-year', 12, 119.99, 3000)],
  plus: [fixturePlan('fixture-plus-month', 1, 9.99, 1000), fixturePlan('fixture-plus-year', 12, 59.99, 1000)],
  payAsYouGo: [fixturePlan('fixture-credits-small', 1, 4.99, 100), fixturePlan('fixture-credits-large', 1, 19.99, 500)],
};
export function usePricingLogic() {
  const { onClose, onCheckout } = useContext(PricingContext);
  const { isMd, isDesktop } = useWindowDevice();
  const { getPlanButtonStyles, getFeatureBoxStyles } = useHolidayStyles();
  const [planType, setPlanType] = useState('pro');
  const [selectedPlan, setSelectedPlan] = useState(1);
  const currentPlans = plans[planType];
  return {
    opened: true, handleModalClose: onClose,
    // These style branches are copied from pricing-modal/hooks/use-logic.js.
    getContainerModalStyles: () => isDesktop ? { padding: '20px 10%' } : isMd ? { padding: '20px 14px' } : { padding: '14px' },
    getCustomModalStyles: () => !isMd ? { padding: 0, width: 'unset', minWidth: 'min(650px, 90%)' } : { padding: 0, width: 'inherit', minWidth: 'unset' },
    onlyShowPayAsYouGo: false, onlyShowPro: false, isProUser: false, isPlusUser: false, isFreeUser: true,
    planType, handleSetPlanType: value => { setPlanType(value); setSelectedPlan(1); },
    isPayAsYouGoTab: planType === 'payAsYouGo', currentPlans,
    getCreditAmount: plan => plan.info.customInfo.tokenInfo.amount,
    credit: currentPlans[selectedPlan]?.info.customInfo.tokenInfo.amount,
    selectedPlan, setSelectedPlan, savePercent: 50, getPlanButtonStyles, getFeatureBoxStyles,
    handleClick: onCheckout, isEmptyPlans: false, isStripeMode: false, debugMode: false,
  };
}
