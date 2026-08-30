import { useState } from 'react';
import Button from '../../../platform/ui/Button.jsx';
import mockData from '../product/mocks/readiness.json';
import styles from './feature.module.scss';

export const featureMeta = {
  slug: 'factory-readiness',
  title: 'Prototype Factory Readiness',
  stage: 'pm-draft',
  readiness: 'working',
};

export default function FactoryReadinessFeature() {
  const [status, setStatus] = useState('draft');
  const isReady = status === 'review-ready';

  return (
    <main
      className={styles.page}
      data-testid="factory-readiness-page"
      data-state={status}
    >
      <section className={styles.hero}>
        <p className="text-uppercase text-bold">Internal vertical slice</p>
        <h1 className="text-heading-1 text-bold">
          PM can prototype before final design
        </h1>
        <p className="text-small text-regular">
          This fixture proves that approved product inputs can produce a local,
          mock-only React experience.
        </p>
      </section>

      <section className={styles.statusPanel} aria-live="polite">
        <div>
          <p className="text-tiny text-regular">Demonstration status</p>
          <p
            className="text-heading-4 text-bold"
            data-testid="feature-status"
          >
            {isReady ? 'Review-ready' : 'Draft'}
          </p>
        </div>
        <span className={isReady ? styles.readyDot : styles.draftDot} />
      </section>

      <section className={styles.grid} aria-label="Readiness inputs">
        {mockData.inputs.map((input) => (
          <article
            className={styles.card}
            data-testid="readiness-input"
            key={input.id}
          >
            <p className="text-heading-5 text-bold">{input.label}</p>
            <p className="text-small text-regular">{input.description}</p>
          </article>
        ))}
      </section>

      <section className={styles.actions}>
        {isReady ? (
          <>
            <p
              className="text-small text-bold"
              data-testid="ready-message"
            >
              The interaction fixture is ready for manager review.
            </p>
            <Button
              data-testid="reset-draft"
              onClick={() => setStatus('draft')}
              variant="secondary"
            >
              Reset
            </Button>
          </>
        ) : (
          <>
            <p className="text-small text-regular">
              This changes local React state only. No backend request is made.
            </p>
            <Button
              data-testid="start-review"
              onClick={() => setStatus('review-ready')}
            >
              Start manager review
            </Button>
          </>
        )}
      </section>
    </main>
  );
}
