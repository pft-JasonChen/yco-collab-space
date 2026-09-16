import { useState } from 'react';
import DropdownSelect from './DropdownSelect.jsx';

export default {
  title: 'UI/DropdownSelect',
  component: DropdownSelect,
};

const SORT_ITEMS = [
  { key: 'modified', label: 'Date Modified' },
  { key: 'created', label: 'Date Created' },
  { key: 'name', label: 'Alphabetical' },
  { key: 'size', label: 'File size', dividerBefore: true },
];

function Controlled({ items, ...rest }) {
  const [key, setKey] = useState(items[0].key);
  return <DropdownSelect items={items} selectedKey={key} onSelect={setKey} {...rest} />;
}

export const ValuePicker = {
  render: () => (
    <div style={{ padding: 24, minHeight: 320 }}>
      <Controlled items={SORT_ITEMS} label="Sort" ariaLabel="Sort files by" />
    </div>
  ),
};

export const Open = {
  render: () => (
    <div style={{ padding: 24, minHeight: 320 }}>
      <Controlled items={SORT_ITEMS} label="Sort" ariaLabel="Sort files by" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector('[data-component-role="dropdown-select"] button')?.click();
  },
};

const MENU_ITEMS = [
  { key: 'open', label: 'Open', groupLabel: 'Open' },
  { key: 'continue', label: 'Continue in editor' },
  { key: 'rename', label: 'Rename', groupLabel: 'Organise', dividerBefore: true },
  { key: 'move', label: 'Move to folder…' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: 'download', label: 'Download', groupLabel: 'Get', dividerBefore: true },
  { key: 'trash', label: 'Move to Trash', dividerBefore: true, destructive: true },
];

export const ActionMenu = {
  render: () => (
    <div style={{ padding: 24, minHeight: 420 }}>
      <DropdownSelect
        items={MENU_ITEMS}
        mode="menu"
        variant="plain"
        ariaLabel="More actions"
        align="end"
        trigger={<span aria-hidden="true">⋯</span>}
        onSelect={() => {}}
      />
    </div>
  ),
};

export const CreateMenu = {
  render: () => (
    <div style={{ padding: 24, minHeight: 320 }}>
      <DropdownSelect
        items={[
          { key: 'file', label: 'File Upload…' },
          { key: 'folder-upload', label: 'Folder Upload…' },
          { key: 'new-folder', label: 'New Folder', dividerBefore: true },
        ]}
        mode="menu"
        variant="primary"
        align="end"
        trigger={<span>New +</span>}
        onSelect={() => {}}
      />
    </div>
  ),
};

/**
 * One menu, two independent radio groups — the sort field and the order. RD has
 * no equivalent: each of its menus picks a single value.
 */
export const TwoGroups = {
  render: () => {
    function Demo() {
      const [field, setField] = useState('modified');
      const [order, setOrder] = useState('desc');
      const ORDERS = ['desc', 'asc'];
      return (
        <div style={{ padding: 24, minHeight: 420 }}>
          <DropdownSelect
            items={[
              { key: 'modified', label: 'Date modified', groupLabel: 'Sort by' },
              { key: 'created', label: 'Date created' },
              { key: 'desc', label: 'Newest first', groupLabel: 'Order', dividerBefore: true },
              { key: 'asc', label: 'Oldest first' },
            ]}
            selectedKeys={[field, order]}
            onSelect={(key) => (ORDERS.includes(key) ? setOrder(key) : setField(key))}
            label="Sort"
            ariaLabel="Sort files by"
            align="end"
          />
        </div>
      );
    }
    return <Demo />;
  },
};

