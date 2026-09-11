import { ToolFamilyMenu } from './ResultPageShell.jsx';
import { defaultToolFamilies } from './defaultToolFamilies.js';

const meta = {
  title: 'UI/Result Page Shell/Sidebar',
  component: ToolFamilyMenu,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items: defaultToolFamilies,
    activeId: 'ai-video',
    onSelect: () => {},
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Tool family entries to render, in order. Each item is `{ id, label, image? , glyph? }` — `image` renders an `<img>` (used for Home/AI Agent), `glyph` renders an icon-font character (used for the rest).',
      table: { type: { summary: '{ id, label, image?, glyph? }[]' } },
    },
    activeId: {
      control: 'text',
      description: 'id of the currently active tool family — renders with the active blue highlight and `aria-current="page"`.',
      table: { type: { summary: 'string' } },
    },
    onSelect: { table: { disable: true } },
  },
};

export default meta;

export const Default = {};

export const AIPhotoEditingActive = { args: { activeId: 'ai-photo-editing' } };

export const HomeActive = { args: { activeId: 'home' } };

export const Inert = { args: { onSelect: undefined } };
