import { CreditBadge, CreditControl, GenerateActionBar } from './CreditControls.jsx';

const meta = {
  title: 'UI/Credit Controls',
  component: CreditControl,
  tags: ['autodocs'],
  // Same fix as platform/ui/button/Button.stories.jsx: this repo's react-docgen
  // only extracts Description/Type from PropTypes/TS, neither of which this
  // component uses (plain JS), so those are set explicitly below instead of left
  // as "unknown" — and args need an explicit default (not just Button.jsx's own
  // destructuring default) or the Controls widget shows a "Set X" placeholder
  // instead of a live control.
  args: {
    balance: 436,
    showAdd: true,
    className: '',
  },
  argTypes: {
    balance: {
      control: 'number',
      description: 'Credit balance shown next to the icon.',
      table: { type: { summary: 'number' } },
    },
    showAdd: {
      control: 'boolean',
      description: 'Shows the add-credit (+) icon.',
      table: { type: { summary: 'boolean' } },
    },
    // Integration-facing escape hatch for consuming code's own layout tweaks —
    // not a design decision, so hidden from the Controls table (same convention
    // as Button's own `className`).
    className: {
      control: 'text',
      description: "Extra class name(s) appended for a consuming component's own layout tweaks.",
      table: { disable: true, type: { summary: 'string' } },
    },
  },
};

export default meta;
export const HeaderBalance = { args: { balance: 436 } };
export const Generate = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} onClick={() => {}} /></div> };
export const GenerateDisabled = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} disabled /></div> };
export const GenerateLoading = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} isLoading /></div> };
// Names are generic ("GenerateTwoLine...", not e.g. "EnhanceVideoTwoLine") on
// purpose — this two-line + responsive-padding composition isn't specific to
// any one feature's copy, other Generate-style actions will reuse it too.
export const GenerateTwoLine = {
  render: () => <div style={{ width: 400 }}><GenerateActionBar label="Generate" subtitle="3 seconds for 12 Credits" cost={null} onClick={() => {}} /></div>,
};
export const GenerateTwoLineWithCredits = {
  render: () => <div style={{ width: 400 }}><GenerateActionBar label="Generate" subtitle="Full HD without watermark" cost={4} onClick={() => {}} /></div>,
};
export const CompactBadge = { render: () => <CreditBadge value={10} /> };
