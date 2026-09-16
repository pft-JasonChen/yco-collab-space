import { useState } from 'react';
import GalleryCell from './GalleryCell.jsx';
import cover from '../../../design-library/assets/image/yco-home-cms/Image_extender_8d7102ec86.jpg';
import clip from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
import poster from '../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';

const noControl = { table: { disable: true } };

// A stand-in for the real overflow/download row a surface passes in. Kept inside
// the story rather than the component: the cell owns the slot's placement and
// reveal, never its contents.
function Actions() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--fill-overlay-strong)',
        color: 'var(--text-inverse-strong)',
        fontWeight: 'var(--font-weight-strong)',
      }}
    >
      ⋯
    </span>
  );
}

const meta = {
  title: 'UI/Gallery Cell',
  component: GalleryCell,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
  argTypes: {
    aspectRatio: {
      control: 'text',
      description: 'CSS aspect-ratio. GalleryGrid passes the measured numeric ratio; a caller can pass "16 / 9".',
      table: { type: { summary: 'number | string' } },
    },
    isVideo: { control: 'boolean', description: 'Enables the play icon, duration pill and hover playback.' },
    duration: { control: 'text', description: 'Formatted length shown bottom-left. Video only.' },
    isEditing: { control: 'boolean', description: 'Selection mode: shows the checkbox and hides the actions slot.' },
    isSelected: { control: 'boolean', description: 'Checkbox state. Only rendered while isEditing.' },
    loading: { control: 'boolean', description: 'Shimmer placeholder held at the aspect box while the true ratio is still being measured.' },
    compact: { control: 'boolean', description: 'Tighter 12px corner for narrow layouts, and actions revealed without hover. Passed alongside GalleryGrid’s masonry layout.' },
    clickable: { control: 'boolean', description: 'Pointer cursor on the cell.' },
    thumbnail: noControl,
    alt: noControl,
    videoSrc: noControl,
    playIconSrc: noControl,
    actions: noControl,
    badge: noControl,
    domId: noControl,
    className: noControl,
    onClick: noControl,
  },
  args: {
    aspectRatio: 16 / 9,
    thumbnail: cover,
    alt: 'Storefront expanded',
    isVideo: false,
    isEditing: false,
    isSelected: false,
    loading: false,
    compact: false,
    clickable: true,
    actions: <Actions />,
  },
};

export default meta;

// Image result: true ratio, cover crop, actions revealed on hover.
export const Image = {};

// Video result: play icon over the cover, duration pill bottom-left, and the
// clip mounted only while hovered so an idle grid stays cheap.
export const Video = {
  args: { isVideo: true, thumbnail: poster, videoSrc: clip, duration: '00:12', aspectRatio: 16 / 9 },
};

// Selection mode. The checkbox replaces the actions slot rather than sitting
// beside it, so a cell never shows both at once.
export const Selected = {
  args: { isEditing: true, isSelected: true },
};

// Held while GalleryGrid's off-DOM measurement resolves the real ratio. The box
// keeps its size so the row does not reflow when the media appears.
export const Loading = {
  args: { loading: true, aspectRatio: 3 / 4 },
};

/**
 * Cloud Storage's selection treatment: the box sits top-left and appears on
 * hover, and it is a real control, so selecting is the first click rather than
 * a mode switch followed by a click. RD's own default (top-right, selection
 * mode only, decorative span) is unchanged and still covered by `Selected`.
 */
export const HoverSelectTopLeft = {
  render: () => {
    function Demo() {
      const [picked, setPicked] = useState([]);
      const toggle = (id) =>
        setPicked((current) =>
          current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
        );
      return (
        <div style={{ display: 'flex', gap: 12, padding: 24, background: '#fff' }}>
          {['a', 'b'].map((id) => (
            <div key={id} style={{ width: 200 }}>
              <GalleryCell
                aspectRatio={1.5}
                thumbnail={cover}
                alt={`Sample ${id}`}
                checkboxPosition="top-left"
                checkboxOnHover
                isSelected={picked.includes(id)}
                onToggleSelect={() => toggle(id)}
                selectLabel="Select item"
                domId={`hover-select-${id}`}
              />
            </div>
          ))}
        </div>
      );
    }
    return <Demo />;
  },
};
