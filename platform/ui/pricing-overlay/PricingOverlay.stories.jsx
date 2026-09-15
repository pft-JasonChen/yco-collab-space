import { useEffect, useState } from 'react';
import PricingOverlay from './PricingOverlay.jsx';

const TABS = [
  { key: 'plus', label: 'Plus', tone: 'plus' },
  { key: 'pro', label: 'Pro', tone: 'pro' },
];

const PLANS = [
  { key: 'monthly', name: 'Monthly', price: 'NT$390', savePercent: null },
  { key: 'yearly', name: 'Yearly', note: 'Billed once a year', price: 'NT$299', originalPrice: 'NT$390', savePercent: '23%' },
];

const PACKS = [
  { key: 'pack-10', name: '+10 GB', note: 'Total 15 GB', price: 'NT$30' },
  { key: 'pack-100', name: '+100 GB', note: 'Total 105 GB', price: 'NT$90' },
];

const FEATURES = {
  title: 'Everything in Pro',
  items: [
    'No watermark on exports',
    '4K and original-resolution downloads',
    '2,000 credits each month',
    'Batch processing',
    '100 GB of storage',
  ],
};

function OverlayStory(args) {
  const [opened, setOpened] = useState(args.opened);
  const [tab, setTab] = useState(args.activeTabKey);
  const [plan, setPlan] = useState(args.selectedPlanKey);
  useEffect(() => setOpened(args.opened), [args.opened]);
  useEffect(() => setTab(args.activeTabKey), [args.activeTabKey]);
  return (
    <div style={{ minHeight: 480 }}>
      <button type="button" onClick={() => setOpened(true)}>Open pricing</button>
      <PricingOverlay
        {...args}
        opened={opened}
        activeTabKey={tab}
        onTabChange={setTab}
        selectedPlanKey={plan}
        onSelectPlan={setPlan}
        onClose={() => setOpened(false)}
        onCheckout={() => setOpened(false)}
      />
    </div>
  );
}

const noControl = { table: { disable: true } };

const meta = {
  title: 'UI/Pricing Overlay',
  component: PricingOverlay,
  tags: ['autodocs'],
  render: (args) => <OverlayStory {...args} />,
  argTypes: {
    opened: { control: 'boolean' },
    title: { control: 'text' },
    activeTabKey: { control: 'inline-radio', options: ['plus', 'pro'] },
    checkoutDisabled: { control: 'boolean' },
    tabs: noControl,
    plans: noControl,
    features: noControl,
    summary: noControl,
    aside: noControl,
    secondaryAction: noControl,
    leadingAction: noControl,
    labels: noControl,
    onClose: noControl,
    onTabChange: noControl,
    onSelectPlan: noControl,
    onCheckout: noControl,
  },
  args: {
    opened: true,
    title: 'Choose your plan',
    tabs: TABS,
    activeTabKey: 'pro',
    plans: PLANS,
    selectedPlanKey: 'yearly',
    features: FEATURES,
    checkoutDisabled: false,
    labels: { checkout: 'Subscribe' },
  },
};

export default meta;

// RD's two-column subscription overlay: benefits left, offer switcher and plan
// cards right, checkout beneath.
export const Subscription = {};

// The single-offer pill RD shows instead of a switcher when only one tier
// applies to the user.
export const SingleOffer = {
  args: { tabs: [{ key: 'pro', label: 'Pro', tone: 'pro' }], activeTabKey: 'pro' },
};

// Cloud Storage's capacity path: the same overlay with packs instead of tiers,
// a back control in the leading slot and the resulting total on each card.
export const CapacityPacks = {
  args: {
    title: 'Add storage',
    tabs: null,
    plans: PACKS,
    selectedPlanKey: 'pack-100',
    features: { title: 'Storage packs', items: ['Stacks on your current plan', 'Cancel any time'] },
    labels: { checkout: 'Buy now' },
    summary: 'You have 5 GB. After this purchase: 105 GB.',
  },
};
