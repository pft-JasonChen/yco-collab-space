import NavigationHeader from './NavigationHeader.jsx';

/** userType/holidayPricing/showFeatureName/showFeatureInfo all live in
 * Storybook Controls (per feedback) rather than one dedicated story per
 * combination — the sidebar only needs to carry the one axis Controls
 * genuinely can't express: an actual container width, since the responsive
 * breakpoints are driven by a CSS container query on .header (see
 * NavigationHeader.module.scss), not a prop. So there are exactly 3 stories,
 * one per Figma device band, and every other variation is a control inside
 * whichever one you're looking at.
 *
 * Handler (onXxx) and object/text-override props (navItems,
 * holidayDiscountLabel, avatarSrc, featureNameText, labels, className) are
 * pulled out of the Controls table via `table:{disable:true}` — same
 * convention as UploadMediaBlock's stories — since a "Set object" button, an
 * always-empty `{}` editor, or a dash under Control isn't something you'd
 * actually edit there; they still work as normal props, just via args/props
 * rather than a Controls widget. featureName itself was a free-text control
 * until a screenshot pointed out Figma's own component property for it is a
 * plain boolean, not text — showFeatureName/showFeatureInfo now match that. */
const noControl = { table: { disable: true } };

export default {
  title: 'UI/Navigation Header',
  component: NavigationHeader,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    userType: { control: 'select', options: ['non-login', 'free', 'plus', 'pro'] },
    holidayPricing: { control: 'boolean' },
    /* Only meaningful for free/plus/pro (Figma never shows it for non-login) —
       `if` hides the row entirely rather than just leaving it inert, since a
       control that does nothing for the current userType is exactly the kind
       of Controls-table noise this component's cleanup has been removing. */
    showFeatureName: { control: 'boolean', if: { arg: 'userType', neq: 'non-login' } },
    showFeatureInfo: { control: 'boolean', if: { arg: 'userType', neq: 'non-login' } },
    /* From the ProductHeader merge (2026-09-14) — same in-tool-page-only
       gating as showFeatureName/showFeatureInfo above, since credits are a
       ResultPageShell concept, not part of the original marketing-header
       Figma frames. */
    creditBalance: { control: 'number', if: { arg: 'userType', neq: 'non-login' } },
    showCredits: { control: 'boolean', if: { arg: 'userType', neq: 'non-login' } },
    navItems: noControl,
    holidayDiscountLabel: noControl,
    featureNameText: noControl,
    avatarSrc: noControl,
    labels: noControl,
    className: noControl,
    onNavItemClick: noControl,
    onStartEditing: noControl,
    onLoginSignup: noControl,
    onSubscribe: noControl,
    onUpgrade: noControl,
    onAccount: noControl,
    onMenuToggle: noControl,
    onBrand: noControl,
    onPromoAction: noControl,
    onInfo: noControl,
    onCredits: noControl,
  },
  args: {
    userType: 'non-login',
    holidayPricing: false,
    showFeatureName: false,
    showFeatureInfo: true,
    creditBalance: 436,
    showCredits: true,
    onNavItemClick: () => {},
    onStartEditing: () => {},
    onLoginSignup: () => {},
    onSubscribe: () => {},
    onUpgrade: () => {},
    onAccount: () => {},
    onMenuToggle: () => {},
    onBrand: () => {},
    onPromoAction: () => {},
    onInfo: () => {},
    onCredits: () => {},
  },
};

/* Story names match Figma's own devices property values verbatim (its variant
   dropdown literally reads "01_Desktop (>= 1200px)" / "02_Tablet (769px -
   1199px)" / "03_Mobile (<= 768px)") rather than a paraphrase, so the story
   list reads as the same three options Figma's own component picker shows. */
export const Desktop = {
  name: '01_Desktop (>= 1200px)',
};

export const Tablet = {
  name: '02_Tablet (769px - 1199px)',
  decorators: [
    (Story) => (
      <div style={{ width: 900, border: '1px solid var(--stroke-weak)' }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile = {
  name: '03_Mobile (<= 768px)',
  decorators: [
    (Story) => (
      <div style={{ width: 375, border: '1px solid var(--stroke-weak)' }}>
        <Story />
      </div>
    ),
  ],
};
