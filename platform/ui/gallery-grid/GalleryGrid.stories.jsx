import GalleryGrid from './GalleryGrid.jsx';
import { bucketRatio } from './aspectRatio.js';
import landscape from '../../../design-library/assets/image/yco-home-cms/Image_extender_8d7102ec86.jpg';
import portrait from '../../../design-library/assets/image/yco-home-cms/Hairstyle_acd130fe1d.jpg';
import square from '../../../design-library/assets/image/yco-home-cms/Reshape.jpg';
import wide from '../../../design-library/assets/image/yco-home-cms/Batch_photo_enhancer_212cff64d7.jpg';
import tall from '../../../design-library/assets/image/yco-home-cms/Clothes_fb3707e78a.jpg';
import colorize from '../../../design-library/assets/image/yco-home-cms/YCE_web_relayout_sign_in_index_AI_Colorize_e764ff2f92.jpg';

// Metadata ratios only: the story does not rely on off-DOM measurement, so the
// layout is deterministic in a snapshot. A real surface passes `getMedia` and
// lets useMediaRatios resolve the true ratio.
const items = [
  { id: 'a', src: landscape, width: 16, height: 9, name: 'Storefront expanded' },
  { id: 'b', src: portrait, width: 3, height: 4, name: 'Hairstyle retouch' },
  { id: 'c', src: square, width: 1, height: 1, name: 'Reshape pass' },
  { id: 'd', src: wide, width: 2, height: 1, name: 'Batch enhance' },
  { id: 'e', src: tall, width: 9, height: 16, name: 'Outfit swap' },
  { id: 'f', src: colorize, width: 4, height: 3, name: 'AI colorize' },
];

function Cell({ item, ratio }) {
  return (
    <div
      style={{
        aspectRatio: ratio,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--fill-weak)',
      }}
    >
      <img
        src={item.src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Gallery Grid',
  component: GalleryGrid,
  tags: ['autodocs'],
  argTypes: {
    rowHeight: {
      control: { type: 'range', min: 120, max: 320, step: 10 },
      description:
        'Base justified row height in pixels. Each cell is laid out at rowHeight * ratio and grows to fill the row, capped so a row can never exceed 240px tall.',
      table: { type: { summary: 'number' } },
    },
    layout: {
      control: 'inline-radio',
      options: ['auto', 'justified', 'masonry'],
      description:
        'auto measures the grid’s own width and switches to the 2-column masonry at or below 768px. The explicit values force one mode, which is what a fixed-width story needs.',
      table: { type: { summary: "'auto' | 'justified' | 'masonry'" } },
    },
    items: noControl,
    getKey: noControl,
    getRatio: noControl,
    getMedia: noControl,
    renderCell: noControl,
    normalizeRatio: noControl,
    onErroredSrc: noControl,
    className: noControl,
  },
  args: {
    items,
    rowHeight: 200,
    layout: 'auto',
    getKey: (item) => item.id,
    renderCell: (item, index, ratio) => <Cell item={item} ratio={ratio} />,
  },
};

export default meta;

// The justified row is the desktop default: mixed ratios share a row, the row
// grows up from the 200px base, and the trailing .afterSeat keeps the last
// incomplete row left-aligned at base size instead of stretching one portrait
// cell across the full width.
export const Justified = {
  args: { layout: 'justified' },
};

// Narrow layout. Forced rather than produced by a narrow viewport, because the
// component measures its own box: a 375px wrapper here is exactly what a real
// phone gives it, and a @media-based hook would have ignored that wrapper and
// kept rendering the desktop rows.
export const Masonry = {
  args: { layout: 'masonry' },
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};

// Video surfaces snap every clip into 4:3 / 1:1 / 3:4 so rows read as tidy
// bands; cells are object-fit: cover, so the media crops center into the
// bucketed box. Image surfaces omit normalizeRatio and keep the true ratio.
export const BucketedForVideo = {
  args: { layout: 'justified', normalizeRatio: (ratio) => bucketRatio(ratio) },
};
