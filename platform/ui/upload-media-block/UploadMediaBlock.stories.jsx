import samplePoster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import sampleVideo from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
// Only this story imports the shared icon font, to demo actionSlot with a real
// glyph (icon-ic-scissors) instead of a placeholder emoji — UploadMediaBlock
// itself doesn't render any icon-font glyphs, so it doesn't need this import.
import '../../../design-library/assets/font/yco-interface-icons.style.css';
import UploadMediaBlock from './UploadMediaBlock.jsx';

// Figma "UploadArea" (node 4515:64125 / 10525:145816) is a family of upload
// layouts sharing one behaviour: width follows its container, height follows a
// fixed aspect ratio (368/136 for most types) — so it grows/shrinks as the
// container resizes, never a hardcoded pixel height. `type` switches between
// the shapes; `showToggle`/`errorMessage`/`showHint` are independent of `type`.
const meta = {
  title: 'UI/Upload Media Block',
  component: UploadMediaBlock,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 368 }}><h2 style={{ fontSize: 16 }}>Video</h2><Story /></div>],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'startEnd', 'multiple', 'template'],
      description: 'Which upload layout to render.',
      table: { type: { summary: "'single' | 'startEnd' | 'multiple' | 'template'" } },
    },
    showToggle: {
      control: 'boolean',
      description: 'Shows the "Start & End Frame" ON/OFF toggle in the block\'s own header row.',
      table: { type: { summary: 'boolean' } },
    },
    toggleOn: { control: 'boolean', table: { type: { summary: 'boolean' } } },
    errorMessage: {
      control: 'text',
      description: 'Renders an inline error row (icon + message) below the upload area, for any type.',
      table: { type: { summary: 'string' } },
    },
    showHint: { control: 'boolean', table: { type: { summary: 'boolean' } } },
    hintText: { control: 'text', table: { type: { summary: 'string' } } },
    // Media props aren't given interactive controls — there's no useful way to
    // "type in" an image/video URL from the Controls panel, so each meaningful
    // combination gets its own story (VideoUploaded, StartAndEndFilled,
    // MultipleImages, Template…) instead.
    imageUrl: { table: { disable: true } },
    videoUrl: { table: { disable: true } },
    startFrame: { table: { disable: true } },
    endFrame: { table: { disable: true } },
    images: { table: { disable: true } },
    templateImageUrl: { table: { disable: true } },
  },
};

export default meta;

export const VideoUploaded = {
  args: {
    imageUrl: samplePoster,
    videoUrl: sampleVideo,
    videoDuration: 30,
    onRemove: () => {},
    onReplace: () => {},
  },
};

export const VideoUploadedWithFeatureAction = {
  args: {
    ...VideoUploaded.args,
    actionSlot: (
      <button type="button" aria-label="Trim">
        <i className="icon-ic-scissors" aria-hidden="true" />
      </button>
    ),
  },
};

export const Empty = { args: { onUpload: () => {} } };

export const WithToggleAndHint = {
  args: {
    ...VideoUploaded.args,
    showToggle: true,
    toggleOn: false,
    onToggleChange: () => {},
    showHint: true,
  },
};

export const WithError = {
  args: {
    ...VideoUploaded.args,
    showToggle: true,
    toggleOn: true,
    onToggleChange: () => {},
    errorMessage: 'Please upload a video between 3 to 10 seconds.',
  },
};

export const StartAndEndEmpty = {
  args: {
    type: 'startEnd',
    showToggle: true,
    toggleOn: true,
    onToggleChange: () => {},
    onStartFrameUpload: () => {},
    onEndFrameUpload: () => {},
  },
};

export const StartAndEndFilled = {
  args: {
    type: 'startEnd',
    showToggle: true,
    toggleOn: true,
    onToggleChange: () => {},
    startFrame: { imageUrl: samplePoster, typeLabel: 'Person' },
    endFrame: { imageUrl: samplePoster, typeLabel: 'Pet' },
    onStartFrameReplace: () => {},
    onStartFrameCrop: () => {},
    onStartFrameRemove: () => {},
    onEndFrameReplace: () => {},
    onEndFrameCrop: () => {},
    onEndFrameRemove: () => {},
  },
};

export const MultipleImages = {
  args: {
    type: 'multiple',
    showToggle: true,
    toggleOn: true,
    onToggleChange: () => {},
    images: [
      { id: '1', url: samplePoster, label: 'Image1', aspectRatio: '142 / 80' },
      { id: '2', url: samplePoster, label: 'Image2', aspectRatio: '60 / 80' },
      { id: '3', url: samplePoster, label: 'Image3', aspectRatio: '26 / 80' },
      { id: '4', url: samplePoster, label: 'Image4', aspectRatio: '53 / 80' },
    ],
    maxImages: 6,
    onImageRemove: () => {},
    onImageAdd: () => {},
  },
};

export const Template = {
  args: {
    type: 'template',
    templateImageUrl: samplePoster,
    templateName: 'L’Ora del Tè al Tramonto',
    onTemplateChange: () => {},
  },
};
