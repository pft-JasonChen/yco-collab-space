const ratioTypes = {
  DEFAULT: 'default',
  GERY: 'gery',
  GERY_V2: 'gery_v2',
  /* Reference (2026-09-15, found live — this key never existed even though
     Ratio.jsx/Ratio.module.scss/Ratio.stories.jsx all already referenced
     `ratioTypes.IMAGE_EXTENDER`): every consumer passing it got `undefined`,
     which Ratio's own `variant = ratioTypes.GERY_V2` default parameter
     silently turned into GERY_V2 — so this variant was never actually
     reachable before now. */
  IMAGE_EXTENDER: 'image_extender',
};

const ratioTitleTypes = {
  DEFAULT: 'default',
  GERY: 'gery',
};

export { ratioTypes, ratioTitleTypes };
