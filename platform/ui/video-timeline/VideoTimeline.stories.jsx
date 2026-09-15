import { useEffect, useState } from 'react';
import poster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import VideoTimeline from './VideoTimeline.jsx';

function TimelineStory(args) {
  const [currentTime, setCurrentTime] = useState(args.currentTime);
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState(args.startTime);
  const [endTime, setEndTime] = useState(args.endTime);
  // Reported live ("為什麼我調control上面數值的時候都沒有跟著動"): these three
  // start as local state (seeded once from args on mount) so dragging a
  // handle can update them interactively — but useState's initial value is
  // only read on mount, so a later Controls edit to startTime/endTime/
  // currentTime was silently ignored, since the render below always used
  // the local state, never the incoming arg again. Re-sync local state
  // whenever the Controls-driven arg actually changes.
  useEffect(() => setCurrentTime(args.currentTime), [args.currentTime]);
  useEffect(() => setStartTime(args.startTime), [args.startTime]);
  useEffect(() => setEndTime(args.endTime), [args.endTime]);
  return (
    <VideoTimeline
      {...args}
      currentTime={currentTime}
      startTime={startTime}
      endTime={endTime}
      isPlaying={playing}
      onSeek={setCurrentTime}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onTrimStartChange={setStartTime}
      onTrimEndChange={setEndTime}
    />
  );
}

// Same "not actually editable there" cleanup this pilot has applied
// elsewhere (UploadMediaBlock, NavigationHeader): handler props and the
// story-managed state (isPlaying/currentTime/startTime/endTime all live in
// TimelineStory's own useState above, so a Control here would silently do
// nothing) are pulled out of the Controls table via table:{disable:true}
// rather than left showing "unknown"/"Set object" for props react-docgen
// can't infer a real type for on this plain-JS component.
const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Video Timeline',
  component: VideoTimeline,
  tags: ['autodocs'],
  render: (args) => <TimelineStory {...args} />,
  argTypes: {
    posterUrl: { control: 'text', description: 'Poster frame shown before real frames are captured.', table: { type: { summary: 'string' } } },
    duration: { control: 'number', description: "Clip's full length in seconds — the filmstrip and trim-range overlay are both measured against this.", table: { type: { summary: 'number' } } },
    currentTime: noControl,
    startTime: { control: 'number', description: 'Selected trim-range start, in seconds.', table: { type: { summary: 'number' } } },
    endTime: { control: 'number', description: 'Selected trim-range end, in seconds.', table: { type: { summary: 'number' } } },
    minimumSeconds: { control: 'number', description: 'Shortest trim-range the handles can drag down to.', table: { type: { summary: 'number' } } },
    maximumSeconds: { control: 'number', description: 'Longest trim-range a handle drag can grow to.', table: { type: { summary: 'number' } } },
    showKeyframe: { control: 'boolean', description: "Figma's own \"Show Keyframe\" property — a diamond marker over the filmstrip flagging an edited point (used on the video object-removal flow). Does not affect filmstrip visibility.", table: { type: { summary: 'boolean' } } },
    showTrimHandles: { control: 'boolean', description: "Figma's own \"Show trim-range\" property — toggles the draggable left/right handles, range outline and dimmed overlay.", table: { type: { summary: 'boolean' } } },
    showLeftLabel: { control: 'boolean', description: 'Left slot above the track — hintText when set (--text-strong), else the elapsed-within-selection time (--text-weaker).', table: { type: { summary: 'boolean' } } },
    hintText: { control: 'text', description: 'e.g. "Select 5-30 seconds" — shown in the left slot instead of a time value when set. Only visible when showLeftLabel is true.', table: { type: { summary: 'string' } } },
    showRightLabel: { control: 'boolean', description: "Right slot above the track — the selected range's total duration (--text-weaker).", table: { type: { summary: 'boolean' } } },
    isPlaying: noControl,
    frameUrls: noControl,
    frameStrategy: noControl,
    labels: noControl,
    className: noControl,
    onSeek: noControl,
    onPlay: noControl,
    onPause: noControl,
    onTrimStartChange: noControl,
    onTrimEndChange: noControl,
  },
  args: { posterUrl: poster, duration: 42, startTime: 5, endTime: 35, currentTime: 12, showKeyframe: true, showTrimHandles: true, showLeftLabel: true, showRightLabel: true },
};

export default meta;
// Collapsed from 3 stories to 1 (2026-09-14, requested — "我分不出來這三個有
//什麼不同"): SynchronizedCanvasPlayback only toggled the invisible
// data-synchronized attribute, and CapturedFrameInput used the same poster
// image repeated across frameUrls, so it rendered pixel-identical to the
// posterUrl fallback here — neither demonstrated a visually different state,
// same "no dedicated story for something Controls already covers, or that
// doesn't render differently at all" cleanup applied elsewhere this pilot.
// `synchronized`/`data-synchronized` itself is now gone entirely, not just
// this story (2026-09-14, requested — "這如果沒作用要不要拿掉"): it had zero
// consumers anywhere (no CSS selector, no test) after that story removal
// made its only visible effect moot, so removing the story alone left dead
// weight in the component's own prop list. `thumbnailCount` is gone too
// (2026-09-14, requested — "這固定式10不用設定"): Figma's own filmstrip is
// always exactly 10 thumbnails, not something that varies per consumer.
export const Default = {};
// Left slot in hint mode (--text-strong) instead of its time-value fallback
// (--text-weaker) — matches Figma's "Max selected length: 10s" example
// (jb5SgyshmuPse0L7IFm0QO node 14893:252673), the VideoTrimModal precedent
// this prop is meant to also cover for a future consumer.
export const WithHint = { args: { hintText: 'Select 5-30 seconds' } };
