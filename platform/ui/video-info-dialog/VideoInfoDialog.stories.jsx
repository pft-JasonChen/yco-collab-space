import { useState } from 'react';
import samplePoster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import sampleVideo from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
import Button from '../button/index.js';
import VideoInfoDialog from './VideoInfoDialog.jsx';

function DialogStory(args) {
  const [opened, setOpened] = useState(true);
  return <><Button onClick={() => setOpened(true)}>Open video details</Button><VideoInfoDialog {...args} opened={opened} onClose={() => setOpened(false)} /></>;
}

const meta = {
  title: 'UI/Video Info Dialog',
  component: VideoInfoDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => <DialogStory {...args} />,
  args: {
    title: 'Video Expansion',
    date: '2026-09-01 19:33:54',
    videoUrl: sampleVideo,
    posterUrl: samplePoster,
    sources: [{ id: 'source', url: samplePoster, alt: 'Original source' }],
    metadata: [
      { label: 'Resolution', value: '1920 × 1080' },
      { label: 'Video Length', value: '30s' },
    ],
    nextActions: [
      { id: 'enhancer', label: 'Video Enhancer' },
      { id: 'expansion', label: 'Video Expansion', onSelect: () => {} },
    ],
    onLike: () => {},
    onDislike: () => {},
    onDownload: () => {},
    onRetry: () => {},
  },
};

export default meta;
export const Open = {};
