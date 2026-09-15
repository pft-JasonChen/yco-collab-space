import { useState } from 'react';
import SelectionToolbar, { SelectAllHeader } from './SelectionToolbar.jsx';

function Bar(args) {
  const [editing, setEditing] = useState(args.isEditing);
  const [all, setAll] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <SelectAllHeader
        isEditing={editing}
        isSelectAll={all}
        onToggleSelectAll={() => setAll((v) => !v)}
      >
        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-weak)' }}>
          Results are kept for 30 days.
        </span>
      </SelectAllHeader>
      <SelectionToolbar
        {...args}
        isEditing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
      />
    </div>
  );
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Selection Toolbar',
  component: SelectionToolbar,
  tags: ['autodocs'],
  render: (args) => <Bar {...args} />,
  argTypes: {
    isEditing: { control: 'boolean', description: 'Selection mode. The story keeps its own state so the toggle works.' },
    compact: { control: 'boolean', description: "RD's narrow treatment: delete and download become icon-only." },
    selectDisabled: { control: 'boolean' },
    deleteDisabled: { control: 'boolean', description: 'RD disables delete until something is selected.' },
    downloadDisabled: { control: 'boolean' },
    hideDelete: { control: 'boolean', description: 'For tabs with no delete API.' },
    onToggleEditing: noControl,
    onDelete: noControl,
    onDownload: noControl,
    labels: noControl,
  },
  args: {
    isEditing: false,
    compact: false,
    selectDisabled: false,
    deleteDisabled: false,
    downloadDisabled: false,
    hideDelete: false,
    onDownload: () => {},
  },
};

export default meta;

// Out of selection mode: the tip row on the left, a single Select pill on the right.
export const Browsing = {};

// Selection mode: the left side becomes select-all, the right gains delete and download.
export const Selecting = { args: { isEditing: true } };

// RD disables delete while nothing is selected, so the destructive action is
// never the first thing reachable on entering selection mode.
export const NothingSelected = { args: { isEditing: true, deleteDisabled: true, downloadDisabled: true } };

// Narrow treatment: delete and download collapse to icons.
export const Compact = { args: { isEditing: true, compact: true } };
