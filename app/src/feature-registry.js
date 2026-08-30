import config from '../../prototype.config.json';

const featureModules = import.meta.glob(
  '../../features/*/generated/feature.jsx',
  { eager: true },
);

function extractSlug(path) {
  return path.match(/\/features\/([^/]+)\/generated\/feature\.jsx$/)?.[1];
}

export const featureEntries = Object.entries(featureModules)
  .map(([path, module]) => {
    const slug = extractSlug(path);

    if (!slug || typeof module.default !== 'function' || !module.featureMeta) {
      throw new Error('Invalid generated feature module: ' + path);
    }

    if (module.featureMeta.slug !== slug) {
      throw new Error(
        'Feature metadata slug "' +
          module.featureMeta.slug +
          '" does not match folder "' +
          slug +
          '"',
      );
    }

    return {
      slug,
      Component: module.default,
      featureMeta: module.featureMeta,
    };
  })
  .sort((left, right) => left.slug.localeCompare(right.slug));

const featureMap = new Map(featureEntries.map((entry) => [entry.slug, entry]));

export function getFeatureFromLocation(pathname) {
  const prefix = config.routes.featurePrefix + '/';

  if (!pathname.startsWith(prefix)) {
    return { requested: false, slug: null, entry: null };
  }

  const slug = pathname.slice(prefix.length).split('/')[0];

  return {
    requested: true,
    slug,
    entry: featureMap.get(slug) ?? null,
  };
}
