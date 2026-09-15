import styles from './ToolPageLayout.module.scss';

export default function ToolPageLayout({
  panel,
  result,
  footer,
  panelHeader = null,
  className = '',
  panelClassName = '',
  panelContentClassName = '',
  resultClassName = '',
}) {
  return (
    <div className={`${styles.layout} ${className}`} data-component-role="tool-page-layout">
      <aside className={`${styles.panel} ${panelClassName}`} data-testid="settings-inspector" data-surface-zone="settings-inspector" data-component-role="settings-inspector video-settings">
        {panelHeader}
        {/* Reference (2026-09-15, requested live — "如果panel的settings內容多餘
            裝置高度才是fixed at the bottom，如果沒有就跟著settings的最後一個
            項目", node 14877-145015): footer now lives INSIDE the same
            scrollable panelContent as a sticky (not a separate always-
            bottom flex sibling) — position:sticky already does exactly this
            rule natively: it sits right after the settings' last item when
            everything fits, and only sticks to the scroll container's own
            bottom edge once content is actually tall enough to scroll. No
            height measurement needed. */}
        <div className={`${styles.panelContent} ${panelContentClassName}`}>
          {panel}
          {footer ? <div className={styles.footer} data-surface-zone="primary-action">{footer}</div> : null}
        </div>
      </aside>
      <section className={`${styles.result} ${resultClassName}`} data-surface-zone="result-column">{result}</section>
    </div>
  );
}
