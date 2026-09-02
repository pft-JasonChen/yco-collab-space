import { useState } from 'react';
import Ratio, { ratioTypes } from './Ratio.jsx';

const options = [
  { id: '16-9', w: 16, h: 9, padding: '11.375px 7px' },
  { id: '9-16', w: 9, h: 16, padding: '7px 11.375px' },
  { id: '4-3', w: 4, h: 3, padding: '9.5px 7px' },
  { id: '3-4', w: 3, h: 4, padding: '7px 9.5px' },
  { id: '1-1', w: 1, h: 1, padding: '7px' },
];

function ControlledRatio(args) {
  const [ratio, setRatio] = useState(args.ratio);
  return <Ratio {...args} ratio={ratio} setRatio={setRatio} />;
}

const meta = {
  title: 'UI/Ratio',
  component: Ratio,
  tags: ['autodocs'],
  render: (args) => <ControlledRatio {...args} />,
  args: {
    ratioList: options,
    ratio: { w: 16, h: 9 },
    title: 'Aspect ratio',
  },
};

export default meta;

export const FiveRatios = {};
export const Disabled = { args: { disabled: true } };
export const TwoOptions = { args: { ratioList: options.slice(0, 2) } };
export const ImageExtender = { args: { variant: ratioTypes.IMAGE_EXTENDER } };
