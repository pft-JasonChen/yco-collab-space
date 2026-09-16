import pricingAssets from './pricing-assets.js';
import { HolidayTypes } from './pricing-adapters.jsx';

/**
 * Holiday theme configuration for the pricing modal cover images.
 * Each theme provides desktop and mobile background image paths.
 */
const COVER_CONFIG = {
  [HolidayTypes.default]: {
    desktop: pricingAssets['/assets/images/pricingModal/pricing_popup_bg.jpg'],
    mobile: pricingAssets['/assets/images/pricingModal/pricing_popup_bg.jpg'],
  },
  [HolidayTypes.halloween]: {
    desktop: '/assets/images/holiday/halloween/popup-bg-dt.png',
    mobile: '/assets/images/holiday/halloween/popup-bg-mb.png',
  },
  [HolidayTypes.blackfriday]: {
    desktop: '/assets/images/holiday/blackfriday/popup-bg-dt.jpg',
    mobile: '/assets/images/holiday/blackfriday/popup-bg-mb.jpg',
  },
  [HolidayTypes.christmas]: {
    desktop: '/assets/images/holiday/christmas/popup-bg-dt.jpg',
    mobile: '/assets/images/holiday/christmas/popup-bg-mb.jpg',
  },
  [HolidayTypes.endyear]: {
    desktop: '/assets/images/holiday/endyear/popup-bg-dt.jpg',
    mobile: '/assets/images/holiday/endyear/popup-bg-mb.jpg',
  },
};

/**
 * Gets the cover image source based on holiday type and device.
 * Falls back to the default (general) cover when the type is unknown.
 */
export const getCoverImageSrc = (holidayType, isMobile) => {
  const config = COVER_CONFIG[holidayType] ?? COVER_CONFIG[HolidayTypes.default];
  return isMobile ? config.mobile : config.desktop;
};

export default COVER_CONFIG;
