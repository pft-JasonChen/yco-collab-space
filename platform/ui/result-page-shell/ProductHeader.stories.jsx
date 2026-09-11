import { ProductHeader } from './ResultPageShell.jsx';

// Same docgen limitation as Button/Credit Controls/Ratio: this repo's react-docgen
// only extracts Description/Type from PropTypes/TS, neither of which this plain-JS
// component uses, so those are set explicitly below instead of left as "unknown".
const meta = {
  title: 'UI/Result Page Shell/Header',
  component: ProductHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Video Expansion',
    showInfo: true,
    creditBalance: 436,
    showCredits: true,
    onInfo: () => {},
    onAccount: () => {},
    onBrand: () => {},
    onCredits: () => {},
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Page/tool title shown centered in the header.',
      table: { type: { summary: 'string' } },
    },
    showInfo: {
      control: 'boolean',
      description: 'Shows the small info-circle button next to the title.',
      table: { type: { summary: 'boolean' } },
    },
    creditBalance: {
      control: 'number',
      description: 'Credit balance shown in the header’s CreditControl.',
      table: { type: { summary: 'number' } },
    },
    showCredits: {
      control: 'boolean',
      description: 'Shows the credit balance control in the header.',
      table: { type: { summary: 'boolean' } },
    },
    labels: {
      control: 'object',
      description: 'Overrides for the header’s accessible label strings (home/account/etc.) — every user-facing string is a prop so RD can hand them straight to its own t().',
      table: { type: { summary: 'object' } },
    },
    onInfo: { table: { disable: true } },
    onAccount: { table: { disable: true } },
    onBrand: { table: { disable: true } },
    onCredits: { table: { disable: true } },
  },
};

export default meta;

export const Default = {};
export const WithoutInfo = { args: { showInfo: false } };
export const WithoutCredits = { args: { showCredits: false } };
export const InertActions = {
  args: { onInfo: undefined, onAccount: undefined, onBrand: undefined, onCredits: undefined },
};
