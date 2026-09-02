import Button from './Button.jsx';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 5 7 7-7 7" />
  </svg>
);

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Generate',
    variant: 'primary',
    tone: 'brand',
    size: 'medium',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    tone: { control: 'select', options: ['brand', 'neutral', 'destructive', 'inverse', 'warning', 'success'] },
    size: { control: 'select', options: ['tiny', 'small', 'medium', 'large'] },
  },
};

export default meta;

export const Primary = {};
export const Secondary = { args: { variant: 'secondary', children: 'Cancel' } };
export const Tertiary = { args: { variant: 'tertiary', children: 'Learn more' } };
export const Disabled = { args: { disabled: true } };
export const Loading = { args: { isLoading: true, children: 'Generating' } };
export const WithIcon = { args: { trailingIcon: <ArrowIcon />, children: 'Next' } };
