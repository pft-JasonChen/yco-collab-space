import useCheckHolidayProduct from '@/hooks/use-check-holiday-product';
import { HolidayTypes } from '@/utils/holidayUtils';
import useHolidayType from '@/hooks/holiday/use-holiday-type';

// --- Static style definitions per theme ---

const FEATURE_TICK = {
  default: { color: '#03ADE2' },
  [HolidayTypes.halloween]: { color: '#FF8D05' },
  [HolidayTypes.blackfriday]: { color: '#CC0000' },
  [HolidayTypes.christmas]: { color: '#DC1205' },
  [HolidayTypes.endyear]: { color: '#FF8D05' },
};

const PLAN_TAB_PAYS = {
  default: null,
  [HolidayTypes.halloween]: {
    backgroundImage:
      'linear-gradient(51.71deg, #760AA1 12.98%, #9327BD 73.73%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  [HolidayTypes.blackfriday]: { color: '#15171F' },
  [HolidayTypes.christmas]: { color: '#15171F' },
};

const PLAN_TABS = {
  default: { border: 0, background: 'rgb(17 24 26 / 4%)' },
  [HolidayTypes.halloween]: { backgroundColor: '#F7F7F7' },
  [HolidayTypes.blackfriday]: { backgroundColor: '#F7F7F7' },
  [HolidayTypes.christmas]: { backgroundColor: '#F7F7F7' },
};

const PLAN_TAB_ACTIVE = {
  default: (isProTab) => ({
    background: isProTab
      ? 'linear-gradient(89.77deg, #FFB802 0%, #FFA51C 32.56%, #FF8800 99.8%)'
      : 'radial-gradient(208.4% 361.74% at 99.98% 0%, #44E3ED 0%, #03ADE2 49.02%)',
    color: '#fff',
  }),
  [HolidayTypes.halloween]: () => ({
    background: 'linear-gradient(51.71deg, #760AA1 12.98%, #9327BD 73.73%)',
    color: '#fff',
  }),
  [HolidayTypes.blackfriday]: () => ({
    background: '#CC0000',
    color: '#fff',
  }),
  [HolidayTypes.christmas]: () => ({
    background: 'linear-gradient(90deg, #FA1D5C 0%, #EA0220 100%)',
    color: '#fff',
  }),
  [HolidayTypes.endyear]: () => ({
    background:
      'linear-gradient(89.77deg, #FFB802 0%, #FFA51C 32.56%, #FF8800 99.8%)',
    color: '#fff',
  }),
};

const PLAN_WRAPPER = {
  default: (isActive) => ({
    border: '1px solid #03ade2',
    backgroundColor: isActive ? '#eafbff' : '#fff',
  }),
  [HolidayTypes.halloween]: (isActive) => ({
    border: isActive
      ? '2px solid rgb(147, 39, 190)'
      : '1px solid rgb(147, 39, 190)',
    backgroundColor: isActive ? 'rgba(127, 71, 153, 0.05)' : '#fff',
  }),
  [HolidayTypes.blackfriday]: (isActive) => ({
    border: isActive ? '2px solid #CC0000' : '1px solid #15171F',
    backgroundColor: isActive ? 'rgba(204, 0, 0, 0.05)' : '#ffffff',
  }),
  [HolidayTypes.christmas]: (isActive) => ({
    border: isActive ? '2px solid #EA0220' : '1px solid #11181A33',
    backgroundColor: isActive ? 'rgba(204, 0, 0, 0.05)' : '#ffffff',
  }),
  [HolidayTypes.endyear]: (isActive) => ({
    border: isActive ? '2px solid #FFA51C' : '1px solid #11181A33',
    backgroundColor: isActive ? 'rgba(204, 0, 0, 0.05)' : '#ffffff',
  }),
};

const PLAN_DISCOUNT_LABEL = {
  default: { backgroundColor: '#0ea639' },
  [HolidayTypes.halloween]: {
    background:
      'linear-gradient(172.77deg, #FFB802 15.32%, #FFA51C 27.64%, #FF8800 56.22%)',
  },
  [HolidayTypes.blackfriday]: { background: '#15171F' },
  [HolidayTypes.christmas]: {
    background:
      'linear-gradient(0deg, #CA2323 20.27%, #ED205E 59.84%, #E33D3D 84.16%)',
  },
};

const BEST_OFFSET_LABEL = {
  default: { background: '#FF6E64' },
  [HolidayTypes.halloween]: {
    background: 'linear-gradient(51.71deg, #760AA1 12.98%, #9327BD 73.73%)',
  },
  [HolidayTypes.blackfriday]: {
    background:
      'linear-gradient(90deg, #E4C684 10.5%, #CAA140 53.21%, #E4C684 91%)',
  },
  [HolidayTypes.christmas]: {
    background:
      'linear-gradient(90deg, #CAA140 -28.67%, #E4C684 49.14%, #CAA140 130%)',
  },
  [HolidayTypes.endyear]: {
    background: 'linear-gradient(90deg, #03ADE2 0%, #3FD75B 100%)',
  },
};

const PLAN_BUTTON = {
  default: { backgroundColor: '#03ade2' },
  [HolidayTypes.halloween]: {
    background:
      'linear-gradient(51.71deg, rgb(118, 10, 161) 12.98%, rgb(147, 39, 189) 73.73%)',
  },
  [HolidayTypes.blackfriday]: { background: '#CC0000' },
  [HolidayTypes.christmas]: {
    background: 'linear-gradient(90deg, #FA1D5C 0%, #EA0220 100%)',
    border: '1px solid #EA0220',
  },
  [HolidayTypes.endyear]: {
    background:
      'linear-gradient(89.77deg, #FFB802 0%, #FFA51C 32.56%, #FF8800 99.8%)',
    border: 'none',
  },
};

const MORE_PLAN_LINK = {
  default: { color: '#03ade2' },
  [HolidayTypes.halloween]: {
    backgroundImage:
      'linear-gradient(51.71deg, #760AA1 12.98%, #9327BD 73.73%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  [HolidayTypes.blackfriday]: { color: '#8F6C1A' },
  [HolidayTypes.christmas]: { color: '#088F4A' },
  [HolidayTypes.endyear]: { color: '#03ade2', fontWeight: '400' },
};

const MORE_PLAN_LINK_ICON = {
  default: '/assets/images/pricingModal/but-arrow.png',
  [HolidayTypes.halloween]:
    '/assets/images/holiday/halloween/pricing-modal-arrow-purple.svg',
  [HolidayTypes.blackfriday]:
    '/assets/images/holiday/blackfriday/pricing-modal-arrow-gold.svg',
  [HolidayTypes.christmas]:
    '/assets/images/holiday/christmas/pricing-modal-arrow-green.svg',
};

const SWITCH_WRAPPER = {
  default: { backgroundColor: '#bbefff' },
  [HolidayTypes.halloween]: { backgroundColor: '#FCF2BD' },
  [HolidayTypes.blackfriday]: { backgroundColor: '#FFE4E2' },
  [HolidayTypes.christmas]: { backgroundColor: '#E0F1E7' },
};

const SWITCH_ACTIVE = {
  default: {
    background:
      'linear-gradient(56.35deg, #46e4fa -2.43%, #03ade2 67.21%), linear-gradient(0deg, #03ade2, #03ade2)',
    border: '1px solid #03ade2',
  },
  [HolidayTypes.halloween]: {
    background:
      'linear-gradient(89.77deg, #FFB802 0%, #FFA51C 32.56%, #FF8800 99.8%)',
    border: '1px solid #FF8800',
  },
  [HolidayTypes.blackfriday]: {
    background: '#DC1205',
    border: '1px solid #DC1205',
  },
  [HolidayTypes.christmas]: {
    background: '#427D5C',
    border: '1px solid #427D5C',
  },
};

const FEATURE_BOX_MOBILE = {
  [HolidayTypes.blackfriday]: { border: '1px solid #DC1205' },
  [HolidayTypes.christmas]: { border: '1px solid #56A559' },
  [HolidayTypes.halloween]: { border: '1px solid rgb(147, 39, 190)' },
  default: { border: '1px solid #03ade2' },
};

// --- Helper to resolve theme key ---

const resolve = (map, key) => map[key] ?? map.default ?? null;

// --- Hook ---

export default function useHolidayStyles() {
  const { holidayType } = useHolidayType();
  const { isHolidayMode } = useCheckHolidayProduct();

  const themeKey = isHolidayMode ? holidayType : 'default';

  const getFeatureTickStyles = () => resolve(FEATURE_TICK, themeKey);

  const getPlanTabPaysStyles = () => resolve(PLAN_TAB_PAYS, themeKey);

  const getPlanTabsStyles = () => resolve(PLAN_TABS, themeKey);

  const getPlanTabStyles = (isActive, isProTab = false) => {
    if (!isActive) return null;
    const fn = PLAN_TAB_ACTIVE[themeKey] ?? PLAN_TAB_ACTIVE.default;
    return fn(isProTab);
  };

  const getPlanWrapperStyles = (isActive) => {
    const fn = PLAN_WRAPPER[themeKey] ?? PLAN_WRAPPER.default;
    return fn(isActive);
  };

  const getPlanDiscountLabelStyles = () =>
    resolve(PLAN_DISCOUNT_LABEL, themeKey);

  const getBestOffsetPlanLabelStyles = () =>
    resolve(BEST_OFFSET_LABEL, themeKey);

  const getPlanButtonStyles = () => resolve(PLAN_BUTTON, themeKey);

  const getMorePlanLinkStyles = () => resolve(MORE_PLAN_LINK, themeKey);

  const getMorePlanLinkIconSrc = () => resolve(MORE_PLAN_LINK_ICON, themeKey);

  const getSwitchWrapperStyles = (isActive) => {
    if (!isActive) return null;
    return resolve(SWITCH_WRAPPER, themeKey);
  };

  const getSwitchStyles = (isActive) => {
    if (!isActive) return null;
    return resolve(SWITCH_ACTIVE, themeKey);
  };

  const getFeatureBoxStyles = (isMobile) => {
    if (!isMobile || !isHolidayMode) return {};
    return resolve(FEATURE_BOX_MOBILE, themeKey);
  };

  return {
    getFeatureTickStyles,
    getPlanTabPaysStyles,
    getPlanTabsStyles,
    getPlanTabStyles,
    getPlanWrapperStyles,
    getPlanDiscountLabelStyles,
    getBestOffsetPlanLabelStyles,
    getPlanButtonStyles,
    getMorePlanLinkStyles,
    getMorePlanLinkIconSrc,
    getSwitchWrapperStyles,
    getSwitchStyles,
    getFeatureBoxStyles,
  };
}
