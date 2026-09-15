import { useEffect, useState } from 'react';
import ConfirmDialog from './ConfirmDialog.jsx';

function DialogStory(args) {
  const [opened, setOpened] = useState(args.opened);
  useEffect(() => setOpened(args.opened), [args.opened]);
  return (
    <div style={{ minHeight: 320 }}>
      <button type="button" onClick={() => setOpened(true)}>
        Open dialog
      </button>
      <ConfirmDialog
        {...args}
        opened={opened}
        onConfirm={() => setOpened(false)}
        onCancel={() => setOpened(false)}
      />
    </div>
  );
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Confirm Dialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  render: (args) => <DialogStory {...args} />,
  argTypes: {
    opened: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    tone: {
      control: 'inline-radio',
      options: ['brand', 'destructive'],
      description: 'Colour of the confirm action. Destructive for anything that removes data.',
    },
    closeLabel: noControl,
    onConfirm: noControl,
    onCancel: noControl,
  },
  args: {
    opened: true,
    title: 'Move to Trash?',
    description: 'This item stays in Trash for 30 days. You can restore it any time before then.',
    confirmLabel: 'Move to Trash',
    cancelLabel: 'Cancel',
    tone: 'destructive',
  },
};

export default meta;

// Cloud Storage's delete confirmation: recoverable wording, destructive confirm,
// and the plain-text cancel RD uses so the safe choice is not a competing pill.
export const MoveToTrash = {};

// The same dialog in its non-destructive tone, for a confirmation that is not
// removing anything.
export const Neutral = {
  args: {
    title: 'Leave this folder?',
    description: 'Your selection will be cleared.',
    confirmLabel: 'Leave',
    tone: 'brand',
  },
};
