import EmptyImage from './EmptyImage.jsx';

const TYPES = [
  'general',
  'video',
  'edt',
  't2i',
  'i2v',
  't2v',
  'face-swap-photo',
  'face-swap-video',
  'upload-drag',
  'voice-microphone',
];

const meta = {
  title: 'UI/Empty Image',
  component: EmptyImage,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: TYPES,
      description: 'Which empty-state illustration to render (Figma node 13023:12548).',
      table: { type: { summary: TYPES.map((t) => `'${t}'`).join(' | ') } },
    },
    background: {
      control: 'radio',
      options: ['base', 'sunken'],
      description:
        'The page surface this sits on — "base" (white --background-base) renders the grey-fill artwork, "sunken" (--background-sunken/alternate) renders the white-fill artwork, so it never blends into its own background. Ignored by types with only one Figma-specified fill (t2v, face-swap-photo, face-swap-video, upload-drag).',
      table: { type: { summary: "'base' | 'sunken'" } },
    },
  },
  args: { type: 'video', background: 'sunken' },
};

export default meta;

export const Video = {};

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {['base', 'sunken'].map((background) => (
        <div key={background}>
          <p style={{ font: 'var(--font-size-small)/1.4 sans-serif', margin: '0 0 8px' }}>
            background: {background} ({background === 'base' ? 'white page' : 'grey page'})
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              padding: 16,
              background: background === 'base' ? 'var(--background-base)' : 'var(--background-sunken)',
            }}
          >
            {TYPES.map((type) => (
              <div key={type} style={{ textAlign: 'center' }}>
                <EmptyImage type={type} background={background} />
                <div style={{ fontSize: 12, marginTop: 4 }}>{type}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
