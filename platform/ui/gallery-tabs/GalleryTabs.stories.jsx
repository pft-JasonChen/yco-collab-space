import { useEffect, useState } from 'react';
import GalleryTabs from './GalleryTabs.jsx';

// The five Cloud Storage buckets plus RD's own tool-named set, so the story
// shows both the short row and a row long enough to actually need dragging.
const STORAGE_TABS = [
  { key: 'projects', label: 'Projects' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos', showRedDot: true },
  { key: 'uploads', label: 'Uploads' },
  { key: 'trash', label: 'Trash' },
];

const RD_TABS = [
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos', showRedDot: true },
  { key: 'image-generator', label: 'AI Image Generator' },
  { key: 'ai-tools', label: 'AI Tools', showRedDot: true },
  { key: 'ai-agent', label: 'AI Agent' },
];

function TabsStory(args) {
  const [activeKey, setActiveKey] = useState(args.activeKey);
  useEffect(() => setActiveKey(args.activeKey), [args.activeKey]);
  return <GalleryTabs {...args} activeKey={activeKey} onTabChange={setActiveKey} />;
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Gallery Tabs',
  component: GalleryTabs,
  tags: ['autodocs'],
  render: (args) => <TabsStory {...args} />,
  argTypes: {
    activeKey: {
      control: 'text',
      description: 'Key of the selected tab. The row is controlled; the consumer owns selection.',
      table: { type: { summary: 'string' } },
    },
    ariaLabel: { control: 'text', description: 'Accessible name for the tab row.' },
    tabs: noControl,
    onTabChange: noControl,
    className: noControl,
  },
  args: { tabs: STORAGE_TABS, activeKey: 'images', ariaLabel: 'Gallery sections' },
};

export default meta;

// Cloud Storage's five fixed buckets. A new tool joins a family in the level-two
// filter rather than adding a tab here, so this row does not grow.
export const StorageSections = {};

// RD's own tool-named row, kept as a story because it is the longer set and the
// one that demonstrates the red dot on more than one tab.
export const ToolFamilies = {
  args: { tabs: RD_TABS, activeKey: 'photos' },
};

// Narrow container: the row overflows and becomes drag-scrollable, with RD's
// own first-child padding reset flush to the edge.
export const Overflowing = {
  args: { tabs: RD_TABS, activeKey: 'image-generator' },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};
