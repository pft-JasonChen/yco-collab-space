import { useEffect, useState } from 'react';
import CategoryRail from './CategoryRail.jsx';

// RD's own rail order and icomoon glyph names, with the items a consumer would
// resolve from CMS sections standing in as fixed entries. Navigation is the
// consumer's job, so nothing here routes.
const ITEMS = [
  { key: 'home', label: 'Home', iconName: 'ic-home' },
  { key: 'ai-agent', label: 'AI Agent', iconName: 'ic-ai-agent', isNew: true },
  { key: 'photo-editing', label: 'AI Photo Editing', iconName: 'ic-photo-editing' },
  { key: 'ai-image', label: 'AI Image', iconName: 'ic-ai-image' },
  { key: 'ai-portrait', label: 'AI Portrait', iconName: 'ic-user-sparkle' },
  { key: 'ai-video', label: 'AI Video Editing', iconName: 'ic-ai-video' },
  { key: 'basic-editing', label: 'Basic Editing', iconName: 'ic-sliders-horizontal' },
  { key: 'batch-editing', label: 'Batch Editing', iconName: 'ic-layers' },
  { key: 'gallery', label: 'My Gallery', iconName: 'ic-image' },
  { key: 'video-template', label: 'Video Template', iconName: 'ic-videos', dividerBefore: true },
  { key: 'image-template', label: 'Image Template', iconName: 'ic-images' },
  { key: 'api', label: 'API', iconName: 'ic-api-b', external: true, dividerBefore: true },
];

function RailStory(args) {
  const [activeKey, setActiveKey] = useState(args.activeKey);
  useEffect(() => setActiveKey(args.activeKey), [args.activeKey]);
  return (
    <div style={{ height: 520, display: 'flex' }}>
      <CategoryRail {...args} activeKey={activeKey} onSelect={setActiveKey} />
    </div>
  );
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Category Rail',
  component: CategoryRail,
  tags: ['autodocs'],
  render: (args) => <RailStory {...args} />,
  argTypes: {
    activeKey: { control: 'text', description: 'Selected item key. The rail is controlled; the consumer owns navigation.' },
    compact: { control: 'boolean', description: "RD's <=992px icon-over-label treatment, also reachable by narrowing the viewport." },
    ariaLabel: { control: 'text' },
    newLabel: { control: 'text', description: 'Text of the NEW badge.' },
    items: noControl,
    onSelect: noControl,
    leading: noControl,
    className: noControl,
  },
  args: { items: ITEMS, activeKey: 'gallery', compact: false, ariaLabel: 'Categories' },
};

export default meta;

// The rail as Cloud Storage uses it: My Gallery selected, dividers before the
// template group and the external API row.
export const GallerySelected = {};

// RD's narrow treatment: the icon moves above the label and the rail halves.
export const Compact = { args: { compact: true } };

// The gradient row is RD's Contest entry. It is an item flag rather than a
// hard-coded key so the shared component carries no consumer's taxonomy.
export const GradientItem = {
  args: {
    activeKey: 'home',
    items: [...ITEMS.slice(0, 3), { key: 'contest', label: 'Contest', iconName: 'ic-user-sparkle', gradient: true }],
  },
};
