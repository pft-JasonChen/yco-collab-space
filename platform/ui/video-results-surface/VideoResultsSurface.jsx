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
      <div className={isHistory ? styles.historyContent : styles.editContent}>
        {isHistory ? historyContent : editContent}
      </div>
    </div>
  );
}
