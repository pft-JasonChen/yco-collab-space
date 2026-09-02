import { useState } from 'react';
import sampleVideo from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
import samplePoster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import Button from '../button/index.js';
import VideoTrimModal from './VideoTrimModal.jsx';

function TrimModalStory(args) {
  const [opened, setOpened] = useState(true);
  const [selection, setSelection] = useState('No segment confirmed');

  return (
    <div>
      <Button onClick={() => setOpened(true)}>Open trim dialog</Button>
      <p aria-live="polite">{selection}</p>
      <VideoTrimModal
        {...args}
        opened={opened}
        onCancel={() => setOpened(false)}
        onConfirm={(range) => {
          setSelection(`Selected ${Math.round(range.start)}–${Math.round(range.end)} seconds`);
          setOpened(false);
        }}
      />
    </div>
  );
}

const meta = {
  title: 'UI/Video Trim Modal',
  component: VideoTrimModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => <TrimModalStory {...args} />,
  args: {
    videoUrl: sampleVideo,
    fallbackThumbnailUrl: samplePoster,
    durationOverride: 48,
    minimumSeconds: 5,
    maximumSeconds: 30,
    labels: {
      title: 'Trim video',
      maxLength: 'Select 5–30 seconds',
      cancel: 'Cancel',
      confirm: 'Use Video',
    },
  },
};

export default meta;

export const ThirtySecondLimit = {};
