import { moduleTypes } from '@/utils/moduleTypes';

const pricingModalTypes = {
  outOfCredit: 'outOfCredit',
  outOfPreview: 'outOfPreview',
  lowCredits: 'lowCredits',
  promoDownload: 'promoDownload',
  giftBox: 'giftBox',

  normal: 'normal',

  signUp: 'signUp',
  dailySignIn: 'dailySignIn',

  onlyShowSubscriptions: 'onlyShowSubscriptions',
  onlyShowPayAsYouGo: 'onlyShowPayAsYouGo',

  onlyShowPro: 'onlyShowPro',
  discountPro: 'discountPro',

  debugMode: 'debugMode',
};

/**
 * 有 preview 機制的 moduleType 清單。
 * Free user 在這些 module preview 次數用完時，會跳出 pricing modal。
 */
const freeUserNoPreviewPricingTypes = [
  moduleTypes.enhance,
  // moduleTypes.enhanceBatch, // YCO260427P0001
  moduleTypes.sod,
  moduleTypes.colorize,
  moduleTypes.objReplace,
  moduleTypes.outPaint,
  moduleTypes.colorCorrection,
  moduleTypes.lighting,
  moduleTypes.objRemoval,
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.bodyReshape,
  // moduleTypes.imageConverterBatch, // YCO260427P0001
  moduleTypes.faceRetouch,
  moduleTypes.photoFilterEffect,
  moduleTypes.hairColor,
  moduleTypes.hairColorChanger,
  moduleTypes.aiPhotoRepair,
];

/**
 * Plus user 在這些 moduleType 用完額度時，
 * 使用 outOfPreview type，顯示 unlock title + module 專屬 feature list。
 */
const PLUS_CUSTOM_PRICING_MODULE_TYPES = new Set([
  moduleTypes.aiPhotoRepair,
  moduleTypes.bodyReshape,
  moduleTypes.faceRetouch,
  moduleTypes.aiAgent,
]);

/**
 * Free user 在這些 moduleType，
 * 使用 outOfPreview type，顯示 unlock title + module 專屬 feature list。
 */
const FREE_CUSTOM_PRICING_MODULE_TYPES = new Set([
  moduleTypes.aiPhotoRepair,
  moduleTypes.enhanceBatch,
  moduleTypes.imageConverterBatch,
  moduleTypes.aiAgent,
]);

export {
  pricingModalTypes,
  freeUserNoPreviewPricingTypes,
  PLUS_CUSTOM_PRICING_MODULE_TYPES,
  FREE_CUSTOM_PRICING_MODULE_TYPES,
};
