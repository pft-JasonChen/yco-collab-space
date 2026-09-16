import CellActions from './CellActions.jsx';
import cover from '../../../design-library/assets/image/yco-home-cms/Image_extender_8d7102ec86.jpg';

export default {
  title: 'UI/CellActions',
  component: CellActions,
};

const MENU = [
  { key: 'open', label: 'Open', icon: 'edit', onSelect: () => {}, groupLabel: 'Open' },
  { key: 'continue', label: 'Continue in editor', icon: 'edit', onSelect: () => {} },
  { key: 'rename', label: 'Rename', onSelect: () => {}, groupLabel: 'Organise', dividerBefore: true },
  { key: 'move', label: 'Move to folder', onSelect: () => {} },
  { key: 'duplicate', label: 'Duplicate', onSelect: () => {} },
  { key: 'trash', label: 'Move to Trash', icon: 'delete', onSelect: () => {}, danger: true, dividerBefore: true },
];

/** Over a real thumbnail, which is the only place this component is legible or not. */
function OnPhoto({ children }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 320,
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundImage: `url(${cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div style={{ position: 'absolute', right: 8, bottom: 8 }}>{children}</div>
    </div>
  );
}

export const DownloadAndMore = {
  render: () => (
    <div style={{ padding: 24, minHeight: 420 }}>
      <OnPhoto>
        <CellActions onDownload={() => {}} menuItems={MENU} testId="cell-more" menuTestId="cell-menu" />
      </OnPhoto>
    </div>
  ),
};

export const DownloadOnly = {
  render: () => (
    <div style={{ padding: 24 }}>
      <OnPhoto>
        <CellActions onDownload={() => {}} />
      </OnPhoto>
    </div>
  ),
};
