// Compatibility entry. app/src/feature-registry.js globs every
// features/<slug>/generated/feature.jsx and expects a default component plus
// featureMeta; the module itself lives in index.jsx alongside storage.jsx.
export { default, featureMeta } from './index.jsx';
