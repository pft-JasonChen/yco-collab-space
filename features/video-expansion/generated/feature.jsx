// Compatibility entry. app/src/feature-registry.js globs every
// features/<slug>/generated/feature.jsx and expects a default component plus
// featureMeta; the module itself now lives in index.jsx alongside its
// settings/ (L1) and data/ (L2) layers.
export { default, featureMeta } from './index.jsx';
