import samplePoster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import sampleVideo from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
import VideoHistory from './VideoHistory.jsx';

const successItem = {
  id: 'success',
  title: 'Video Expansion',
  tags: ['Video Expansion', '16:9'],
  date: '09-01 19:33',
  videoUrl: sampleVideo,
  posterUrl: samplePoster,
  primaryActionLabel: 'Video Enhancer',
};

const meta = {
  title: 'UI/Video History',
  component: VideoHistory,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ minHeight: 720, paddingTop: 20, background: 'var(--background-sunken)' }}><Story /></div>],
};

export default meta;

export const Completed = { args: { items: [successItem], onOpen: () => {} } };
export const ProcessingAndFailed = {
  args: {
    items: [
      { id: 'processing', status: 'processing', title: 'Video Expansion' },
      { id: 'failed', status: 'failed', title: 'Video Expansion', failureDescription: 'Please try again.' },
    ],
    onRetry: () => {},
  },
};
