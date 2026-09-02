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
      <aside className={`${styles.panel} ${panelClassName}`} data-testid="settings-inspector" data-component-role="settings-inspector video-settings">
        {panelHeader}
        <div className={`${styles.panelContent} ${panelContentClassName}`}>{panel}</div>
        {footer}
      </aside>
      <section className={`${styles.result} ${resultClassName}`}>{result}</section>
    </div>
  );
}
