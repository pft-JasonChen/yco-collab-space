import { useState } from 'react';
import poster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import VideoTimeline from './VideoTimeline.jsx';

function TimelineStory(args) {
  const [currentTime, setCurrentTime] = useState(args.currentTime);
  const [playing, setPlaying] = useState(false);
  return <VideoTimeline {...args} currentTime={currentTime} isPlaying={playing} onSeek={setCurrentTime} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />;
}

const meta = {
  title: 'UI/Video Timeline',
  component: VideoTimeline,
  tags: ['autodocs'],
  render: (args) => <TimelineStory {...args} />,
  args: { posterUrl: poster, duration: 42, startTime: 5, endTime: 35, currentTime: 12 },
};

export default meta;
export const SelectedSegment = {};
export const SynchronizedCanvasPlayback = { args: { synchronized: true } };
export const CapturedFrameInput = { args: { posterUrl: undefined, frameUrls: Array.from({ length: 10 }, () => poster) } };
