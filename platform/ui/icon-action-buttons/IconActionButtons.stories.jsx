import { useState } from 'react';
import IconActionButtons, { defaultDetailActions, defaultResultActions } from './IconActionButtons.jsx';

// Each story uses its own result id so the shared reaction store keeps them isolated.
function ActionsStory({ label, ...args }) {
  const [log, setLog] = useState('No action selected');

  return (
    <div style={{ display: 'grid', gap: '1rem', padding: '2rem 2rem 4rem' }}>
      <IconActionButtons
        {...args}
        handlers={{
          like: () => setLog('Like selected'),
          dislike: () => setLog('Dislike selected'),
          edit: () => setLog('Edit selected'),
          download: () => setLog('Download selected'),
        }}
      />
      <p aria-live="polite">{log}</p>
    </div>
  );
}

const meta = {
  title: 'UI/Icon Action Buttons',
  component: IconActionButtons,
  tags: ['autodocs'],
  render: (args) => <ActionsStory {...args} />,
  args: {
    videoId: 'story-result',
    actions: defaultResultActions,
  },
};

export default meta;

export const ResultCardActions = {};

export const DetailDialogActions = {
  args: { videoId: 'story-detail', actions: defaultDetailActions },
};

export const Centered = {
  args: { videoId: 'story-centered', centered: true },
};
