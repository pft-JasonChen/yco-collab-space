import { useState } from 'react';
import VideoResultsSurface from './VideoResultsSurface.jsx';

function Story(args) {
  const [tab, setTab] = useState(args.activeTab);
  const [filter, setFilter] = useState('all');
  return <div style={{ height: 720 }}><VideoResultsSurface {...args} activeTab={tab} onTabChange={setTab} filterValue={filter} onFilterChange={setFilter} /></div>;
}

const meta = {
  title: 'UI/Video Results Surface',
  component: VideoResultsSurface,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => <Story {...args} />,
  args: {
    activeTab: 'edit',
    editContent: <div style={{ display: 'grid', height: '100%', placeItems: 'center', background: 'white', borderRadius: 20 }}>Edit canvas</div>,
    historyContent: <div style={{ padding: 24 }}>History cards</div>,
    filterOptions: [{ value: 'all', label: 'All' }, { value: 'video-expansion', label: 'Video Expansion' }],
  },
};

export default meta;
export const Default = {};
export const History = { args: { activeTab: 'history' } };
