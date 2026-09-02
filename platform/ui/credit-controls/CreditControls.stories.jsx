import { CreditBadge, CreditControl, GenerateActionBar } from './CreditControls.jsx';

const meta = {
  title: 'UI/Credit Controls',
  component: CreditControl,
  tags: ['autodocs'],
};

export default meta;
export const HeaderBalance = { args: { balance: 436 } };
export const Generate = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} onClick={() => {}} /></div> };
export const GenerateDisabled = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} disabled /></div> };
export const GenerateLoading = { render: () => <div style={{ width: 400 }}><GenerateActionBar cost={10} isLoading /></div> };
export const CompactBadge = { render: () => <CreditBadge value={10} /> };
