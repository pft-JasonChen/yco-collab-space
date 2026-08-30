import PrototypeFrame from '../../platform/runtime/PrototypeFrame.jsx';
import { featureEntries, getFeatureFromLocation } from './feature-registry.js';
import styles from './App.module.scss';

function FeatureIndex() {
  return (
    <main className={styles.index}>
      <p className="text-uppercase text-bold">YCO Prototype Factory</p>
      <h1 className="text-heading-1 text-bold">Available prototype features</h1>
      <p className="text-small text-regular">
        Every page is a static prototype that uses synthetic data only.
      </p>
      <ul className={styles.featureList}>
        {featureEntries.map(({ slug, featureMeta }) => (
          <li key={slug}>
            <a href={'/features/' + slug + '/'}>
              <span className="text-heading-5 text-bold">{featureMeta.title}</span>
              <span className="text-tiny text-regular">{featureMeta.stage}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

function UnknownFeature({ slug }) {
  return (
    <main className={styles.index}>
      <p className="text-uppercase text-bold">Unknown feature</p>
      <h1 className="text-heading-2 text-bold">{slug}</h1>
      <p className="text-small text-regular">
        This route has no registered generated feature.
      </p>
      <a href="/">Return to the feature index</a>
    </main>
  );
}

export default function App() {
  const selection = getFeatureFromLocation(window.location.pathname);

  if (!selection.requested) {
    return <FeatureIndex />;
  }

  if (!selection.entry) {
    return <UnknownFeature slug={selection.slug} />;
  }

  const Feature = selection.entry.Component;

  return (
    <PrototypeFrame metadata={selection.entry.featureMeta}>
      <Feature />
    </PrototypeFrame>
  );
}
