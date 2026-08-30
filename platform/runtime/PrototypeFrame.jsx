import styles from './PrototypeFrame.module.scss';

export default function PrototypeFrame({ metadata, children }) {
  const isReviewReady = metadata.readiness === 'review-ready';

  return (
    <div className={styles.shell}>
      <header className={styles.banner} data-testid="prototype-banner">
        <div>
          <p className="text-uppercase text-bold">Prototype · Mock data</p>
          <p className="text-tiny text-regular">
            {metadata.title} · {metadata.stage}
          </p>
        </div>
        <span
          className={isReviewReady ? styles.ready : styles.working}
          data-testid="prototype-readiness"
        >
          {isReviewReady ? 'Review-ready' : 'Working preview'}
        </span>
      </header>
      {children}
    </div>
  );
}
