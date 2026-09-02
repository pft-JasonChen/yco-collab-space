import { useState } from 'react';
import ResultPageShell from './ResultPageShell.jsx';

function InteractiveShell(args) {
  const [activeToolId, setActiveToolId] = useState(args.activeToolId);
  return (
    <ResultPageShell {...args} activeToolId={activeToolId} onToolSelect={setActiveToolId}>
      <div style={{ minHeight: '720px', padding: '32px', background: 'var(--background-sunken)' }}>
        <div style={{ minHeight: '560px', borderRadius: 'var(--corner-radius-20)', background: 'var(--background-base)' }} />
      </div>
    </ResultPageShell>
  );
}

const meta = {
  title: 'UI/Result Page Shell',
  component: ResultPageShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => <InteractiveShell {...args} />,
  args: {
    title: 'Video Expansion',
    activeToolId: 'ai-video',
  },
};

export default meta;

export const VideoTool = {};
export const InertNavigation = {
  render: (args) => (
    <ResultPageShell {...args}>
      <div style={{ minHeight: '720px', background: 'var(--background-sunken)' }} />
    </ResultPageShell>
  ),
};

export const WithoutTitleInfo = { args: { showInfo: false } };
