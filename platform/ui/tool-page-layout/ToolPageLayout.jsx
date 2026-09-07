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
        <div className={`${styles.panelContent} ${panelContentClassName}`}>{panel}</div>
        {footer ? <div className={styles.footer} data-surface-zone="primary-action">{footer}</div> : null}
      </aside>
      <section className={`${styles.result} ${resultClassName}`} data-surface-zone="result-column">{result}</section>
    </div>
  );
}
