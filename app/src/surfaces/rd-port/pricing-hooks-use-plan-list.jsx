import { moduleTypes } from './pricing-module-exports.js';
import { headerProducts } from './moduleConfigTypes.js';
import { getTranslationFunction } from './pricing-adapters.jsx';
import _get from 'lodash/get';
import {
  FEATURE_LIST_PRO,
  FEATURE_LIST_PLUS,
} from './pricing-config-feature-list-config.jsx';

/**
 * Feature list configs per module type.
 * Each entry: [proFeature1, proFeature2, plusFeature1, plusFeature2]
 * The credits line + "no watermark" are appended automatically.
 * 這邊的pro, plus是指tab的方案，不是user的方案。比如Free user看到Pro tab裡的feature list，就會用到pro的feature list config。
 */
const MODULE_FEATURE_MAP = {
  [moduleTypes.enhance]: {
    pro: [
      'free.trial.unlimited.for.enhance.tool',
      'free.trial.unlimited.for.batch.enhance',
    ],
    plus: ['free.trial.per.day.for.enhance', 'free.trial.batch.enhance.images'],
  },
  [moduleTypes.sod]: {
    pro: [
      'free.trial.unlimited.for.background.tool',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: [
      'free.trial.per.day.for.background',
      'free.trial.access.to.batch.editing',
    ],
  },
  photoEditing: {
    pro: [
      'free.trial.full.access.photo.editing',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: [
      'free.trial.access.photo.editing',
      'free.trial.access.to.batch.editing',
    ],
  },
  [moduleTypes.faceRetouch]: {
    pro: [
      'free.trial.full.access.retouch',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: ['free.trial.access.retouch', 'free.trial.access.to.batch.editing'],
  },
  [moduleTypes.objRemoval]: {
    pro: [
      'free.trial.unlock.prefessional.object.removal',
      'free.trial.full.access.photo.editing',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: [
      'free.trial.unlock.standard.object.removal',
      'free.trial.access.photo.editing',
      'free.trial.access.to.batch.editing',
    ],
  },
  [moduleTypes.aiPhotoRepair]: {
    pro: [
      'free.trial.full.access.photo.editing',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: [
      'free.trial.access.photo.editing',
      'free.trial.access.to.batch.editing',
    ],
    // Plus user upgrading to Pro sees Photo Repair–specific copy (not photo editing)
    plusUser: ['free.trial.full.access.photo.repair'],
    // Free user who still has previews → module-specific copy
    freePreview: {
      pro: ['free.trial.full.access.photo.repair'],
      plus: [{ title: 'free.trial.per.day.for.tool', times: 5 }],
    },
  },
  [moduleTypes.bodyReshape]: {
    // Free user sees the shared photo-editing copy (spec groups body-reshape
    // with the photo-editing tools); a Plus user dialing a Pro-only feature
    // (Slim / Waist) gets the body-reshape-specific unlock copy via plusUser.
    // plusUser uses the shared {{featureName}} template (object form so it
    // receives the interpolation) — the unified style for new features.
    pro: [
      'free.trial.full.access.photo.editing',
      'free.trial.unlimited.for.batch.editing',
    ],
    plus: [
      'free.trial.access.photo.editing',
      'free.trial.access.to.batch.editing',
    ],
    plusUser: [
      { title: 'free.trial.full.access.tool' },
      'free.trial.unlimited.for.batch.editing',
    ],
  },
  [moduleTypes.aiAgent]: {
    // Spec sells only the Pro plan for AI Agent (free + Plus both see Pro, no
    // Plus tab). The free-chat quota was cancelled for every plan, so the
    // headline bullet is full tool access ({{featureName}} resolved by
    // featureNameOf) — the credits/month line is appended by buildFeatureList.
    // `plus` mirrors `pro` purely as a safety net: the Plus tab is hidden via
    // onlyShowPro, but FeatureList still computes the plus list on the first
    // render (default planType=plus) before the effect forces Pro, so the array
    // must exist or buildFeatureList crashes on undefined.map().
    pro: [
      { title: 'free.trial.full.access.tool' },
      'free.trial.full.access.editing.tools',
    ],
    plus: [
      { title: 'free.trial.full.access.tool' },
      'free.trial.full.access.editing.tools',
    ],
  },
};

const PHOTO_EDITING_TYPES = new Set([
  moduleTypes.colorize,
  moduleTypes.objReplace,
  moduleTypes.outPaint,
  moduleTypes.colorCorrection,
  moduleTypes.lighting,
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.imageConverterBatch,
  moduleTypes.photoFilterEffect,
  moduleTypes.hairColor,
  moduleTypes.hairColorChanger,
]);

const resolveModuleCategory = (moduleType) => {
  if (
    moduleType === moduleTypes.enhance ||
    moduleType === moduleTypes.enhanceBatch
  ) {
    return moduleTypes.enhance;
  }
  if (moduleType === moduleTypes.sod) return moduleTypes.sod;
  if (PHOTO_EDITING_TYPES.has(moduleType)) return 'photoEditing';
  if (moduleType === moduleTypes.faceRetouch) return moduleTypes.faceRetouch;
  if (moduleType === moduleTypes.objRemoval) return moduleTypes.objRemoval;
  if (moduleType === moduleTypes.aiPhotoRepair)
    return moduleTypes.aiPhotoRepair;
  if (moduleType === moduleTypes.bodyReshape) return moduleTypes.bodyReshape;
  if (moduleType === moduleTypes.aiAgent) return moduleTypes.aiAgent;
  return null;
};

const buildFeatureList = (keys, credit, extraInterpolation = {}) => [
  ...keys.map((item) => {
    if (typeof item === 'string') return { title: item };
    const { title, ...rest } = item;
    return { title, interpolation: { ...rest, ...extraInterpolation } };
  }),
  {
    title: 'free.trial.credits.for.generative.ai',
    interpolationKey: 'creditNum',
    interpolationValue: credit,
  },
  { title: 'free.trial.feature.1' },
];

export default function usePlanList() {
  const { t } = getTranslationFunction();

  // Why: the {{featureName}} templates must name the module being rendered, not
  // the store's active one — FeatureList is handed `crossModuleType` when the
  // modal is opened for a different tool. How: derive it from the argument every
  // list already receives (matches FeatureTitle's featureDisplayName).
  const featureNameOf = (moduleType) => {
    const productKey = _get(headerProducts, moduleType, '');
    return t(`header.items.product.${productKey.replaceAll('-', '.')}`);
  };

  const getFeatureListPro = (credit, moduleType) => {
    const category = resolveModuleCategory(moduleType);
    if (!category) return FEATURE_LIST_PRO;
    const config = MODULE_FEATURE_MAP[category];
    return buildFeatureList(config?.pro, credit, {
      featureName: featureNameOf(moduleType),
    });
  };

  const getFeatureListPlus = (credit, moduleType) => {
    const category = resolveModuleCategory(moduleType);
    if (!category) return FEATURE_LIST_PLUS;
    const config = MODULE_FEATURE_MAP[category];
    return buildFeatureList(config?.plus, credit, {
      featureName: featureNameOf(moduleType),
    });
  };

  // Plus user 用完額度升級 Pro — 用 module 專屬文案（可能跟 Free user 看到的 Pro plan 不同）
  const getFeatureListForPlusUser = (credit, moduleType) => {
    const category = resolveModuleCategory(moduleType);
    if (!category) return FEATURE_LIST_PRO;
    const config = MODULE_FEATURE_MAP[category];
    const keys = config?.plusUser ?? config?.pro;
    return buildFeatureList(keys, credit, {
      featureName: featureNameOf(moduleType),
    });
  };

  // Free user 尚有 preview 次數 → 顯示該 module 的專屬 feature list（有 freePreview config 則用，否則 fallback 到 pro/plus）
  const getFeatureListFreeUserWithPreviewLeft = (
    credit,
    moduleType,
    isProPlan
  ) => {
    const category = resolveModuleCategory(moduleType);
    if (!category) return isProPlan ? FEATURE_LIST_PRO : FEATURE_LIST_PLUS;
    const config = MODULE_FEATURE_MAP[category];
    const interpolation = { featureName: featureNameOf(moduleType) };
    if (!config?.freePreview) {
      return isProPlan
        ? buildFeatureList(config?.pro, credit, interpolation)
        : buildFeatureList(config?.plus, credit, interpolation);
    }
    const keys = isProPlan ? config.freePreview.pro : config.freePreview.plus;
    return buildFeatureList(keys, credit, interpolation);
  };

  return {
    getFeatureListPro,
    getFeatureListPlus,
    getFeatureListForPlusUser,
    getFeatureListFreeUserWithPreviewLeft,
  };
}
