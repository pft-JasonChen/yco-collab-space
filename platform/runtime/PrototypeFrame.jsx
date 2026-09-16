import styles from './PrototypeFrame.module.scss';

/** Reference (2026-09-16, requested live — "先幫我移除PROTOTYPE · MOCK DATA
 * 那條，我想看真實高度"): the banner is removed so `.content` gets the full
 * 100vh `.shell` reserves instead of 100vh-minus-banner, letting height-
 * sensitive layout (e.g. video-expansion's own max-height media query work)
 * be checked against the real viewport. `.shell`/`.content`'s own height
 * plumbing (see PrototypeFrame.module.scss's own comment) is unchanged —
 * only the banner element itself is gone. */
export default function PrototypeFrame({ children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
