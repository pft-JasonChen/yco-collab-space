import { useState } from 'react';
import DataTable, {
  TableActionsCell,
  TableCell,
  TableIconButton,
  TableMediaCell,
  TableRow,
} from './DataTable.jsx';
import thumbnail from '../../../design-library/assets/image/yco-home-cms/Image_extender_8d7102ec86.jpg';
import downloadIcon from '../../../design-library/assets/icon/yco-home-gallery/images__icon_download_w.svg';
import trashIcon from '../../../design-library/assets/icon/yco-home-gallery/images__account__btn_trash_w.svg';

const noControl = { table: { disable: true } };

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'size', label: 'Size', width: '96px', narrowHidden: true },
  { key: 'modified', label: 'Modified', width: '160px', narrowHidden: true },
  { key: 'actions', label: '', srLabel: 'Actions', width: '112px', align: 'end' },
];

const ROWS = [
  { id: 'a', name: 'Summer campaign hero', secondary: 'Campaign', type: 'Image', size: '4.2 MB', modified: 'Sep 14, 2026' },
  { id: 'b', name: 'Product scene reshape', secondary: 'Reshape', type: 'Image', size: '2.8 MB', modified: 'Sep 12, 2026' },
  { id: 'c', name: 'Autumn lookbook cut', secondary: 'Lookbook', type: 'Video', size: '18.6 MB', modified: 'Sep 9, 2026' },
];

const meta = {
  title: 'UI/Data Table',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    columns: { ...noControl },
    selectable: { control: 'boolean', description: 'Renders the leading checkbox column on the header and every row.' },
    allSelected: { ...noControl },
    onToggleAll: { ...noControl },
    labels: { ...noControl },
    children: { ...noControl },
    className: { ...noControl },
    testId: { ...noControl },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The guideline table from Figma Guideline_YCO_2025 (node 14892:36402). A CSS grid rather than a `<table>`: the columns stay aligned between header and rows while each cell carries arbitrary content, and table semantics come from explicit roles. Columns marked `narrowHidden` drop out of the track list below 768px.',
      },
    },
  },
};

export default meta;

function Table({ selectable }) {
  const [selection, setSelection] = useState([]);
  const allSelected = selection.length === ROWS.length;

  return (
    <DataTable
      columns={COLUMNS}
      selectable={selectable}
      allSelected={allSelected}
      onToggleAll={() => setSelection(allSelected ? [] : ROWS.map((row) => row.id))}
      labels={{ selectAll: 'Select all' }}
    >
      {ROWS.map((row) => (
        <TableRow
          key={row.id}
          selectable={selectable}
          selected={selection.includes(row.id)}
          selectLabel={`Select ${row.name}`}
          onToggleSelect={() =>
            setSelection((current) =>
              current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id],
            )
          }
        >
          <TableMediaCell thumbnail={thumbnail} primary={row.name} secondary={row.secondary} />
          <TableCell>{row.type}</TableCell>
          <TableCell data-narrow-hidden="true">{row.size}</TableCell>
          <TableCell data-narrow-hidden="true">{row.modified}</TableCell>
          <TableActionsCell>
            <TableIconButton icon={downloadIcon} label="Download" />
            <TableIconButton icon={trashIcon} label="Delete" tone="destructive" />
          </TableActionsCell>
        </TableRow>
      ))}
    </DataTable>
  );
}

export const Default = {
  args: { selectable: false },
  render: (args) => <Table selectable={args.selectable} />,
};

export const Selectable = {
  args: { selectable: true },
  render: (args) => <Table selectable={args.selectable} />,
};
