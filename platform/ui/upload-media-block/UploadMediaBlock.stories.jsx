import samplePoster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import sampleVideo from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
import UploadMediaBlock from './UploadMediaBlock.jsx';

const meta = {
  title: 'UI/Upload Media Block',
  component: UploadMediaBlock,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 368 }}><h2 style={{ fontSize: 16 }}>Video</h2><Story /></div>],
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
    actionSlot: <button type="button" aria-label="Feature action">✂</button>,
  },
};

export const Empty = { args: { onUpload: () => {} } };
