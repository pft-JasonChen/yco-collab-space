import { useEffect, useRef, useState } from 'react';
import styles from './VideoResultsSurface.module.scss';

const defaultTabs = [
  { id: 'edit', label: 'Edit' },
  { id: 'history', label: 'History' },
];

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  tabs: 'Video result views',
  processing: 'Generation in progress',
  filter: 'Filter history',
};

export function ResultTabs({ tabs = defaultTabs, value = 'edit', onChange, processing = false, labels: labelOverrides = {} }) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <div className={styles.tabs} role="tablist" aria-label={labels.tabs} data-component-role="edit-history-tabs">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            className={active ? styles.activeTab : styles.tab}
            data-testid={`${tab.id}-tab`}
            data-surface-zone={tab.id === 'edit' ? 'video-status' : 'history-results'}
            data-component-role={tab.id === 'history' ? 'history-filter history-list history-card processing-feedback video-detail-dialog next-action' : undefined}
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
          >
            <span data-surface-zone={tab.id === 'history' ? 'video-detail-dialog' : undefined}>{tab.label}</span>
            {processing && tab.id === 'history' ? <span className={styles.taskDot} aria-label={labels.processing} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function HistoryFilter({ value = 'all', options = [{ value: 'all', label: 'All' }], onChange, labels: labelOverrides = {} }) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [opened, setOpened] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!opened) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpened(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [opened]);

  return (
    <div className={styles.filter} ref={rootRef} data-component-role="history-filter">
      <button type="button" aria-expanded={opened} onClick={() => setOpened((current) => !current)}>
        <span>{selected?.label ?? 'All'}</span><span className={styles.chevron} aria-hidden="true" />
      </button>
      {opened ? (
        <ul role="listbox" aria-label={labels.filter}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                className={option.value === value ? styles.selectedOption : undefined}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => { onChange?.(option.value); setOpened(false); }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function VideoResultsSurface({
  labels: labelOverrides = {},
  activeTab = 'edit',
  onTabChange,
  processing = false,
  editContent,
  historyContent,
  filterValue = 'all',
  filterOptions,
  onFilterChange,
  /** Feature-page title, shown once directly under the tab bar — mobile-only
   * (see .mobileTitle in the module.scss): at >=900px ToolPageLayout keeps the
   * settings panel beside this surface and the page title already lives in
   * ResultPageShell's own header, so repeating it here would be redundant.
   * Below that, ToolPageLayout stacks panel below this surface with no room
   * left for a page-level heading of its own, so this is the one place a
   * title can sit between the tabs and whichever content is active — matching
   * a supplied reference of the real production mobile layout (tabs, then
   * title, then the settings form). */
  title = null,
  className = '',
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const isHistory = activeTab === 'history';
  return (
    <div className={`${styles.surface} ${className}`} data-component-role="video-results-surface">
      <div className={styles.toolbar}>
        <ResultTabs labels={labels} value={activeTab} onChange={onTabChange} processing={processing} />
        {isHistory ? <HistoryFilter labels={labels} value={filterValue} options={filterOptions} onChange={onFilterChange} /> : null}
      </div>
      {title ? <h2 className={styles.mobileTitle}>{title}</h2> : null}
      {/* Stable hook for a consumer to make this a flex container from the
          outside — needed wherever a descendant relies on height:100% through
          here, since a flex ITEM's grown size (this div, via .editContent/
          .historyContent's own `flex:1`) doesn't count as "definite" for a
          plain block child's percentage height. Not made flex by default here
          because most consumers don't need it and it'd affect this file's own
          layout assumptions for every existing usage. */}
      <div className={isHistory ? styles.historyContent : styles.editContent} data-component-role="results-content">
        {isHistory ? historyContent : editContent}
      </div>
    </div>
  );
}
