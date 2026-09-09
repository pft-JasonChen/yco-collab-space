import Button from './Button.jsx';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 5 7 7-7 7" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// leadingIcon/trailingIcon take a real icon element in Button.jsx, but the
// Controls panel only wants a boolean toggle. `argTypes.mapping` used to do the
// boolean->element conversion, but that made the Docs page's summary table treat
// the arg as unset (it reads the *mapped* value, which is `undefined` for
// false, and shows "Set boolean" instead of the real false default) even though
// the per-story Controls panel handled it fine. Resolving the boolean ourselves
// in `render` (below) keeps the raw arg a plain boolean everywhere Storybook
// looks at it, and still passes dedicated stories' real elements straight
// through unchanged.
function resolveIcon(value, Icon) {
  return typeof value === 'boolean' ? (value ? <Icon /> : undefined) : value;
}

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Generate',
    variant: 'primary',
    tone: 'brand',
    size: 'medium',
    leadingIcon: false,
    trailingIcon: false,
    disabled: false,
    isLoading: false,
    className: '',
  },
  argTypes: {
    // Descriptions are set explicitly below rather than left to docgen: this repo's
    // react-docgen only extracts prop descriptions from PropTypes/TS types, neither
    // of which Button.jsx uses (plain JS, no new runtime dependency added just to
    // populate this column) — plain comments in front of destructured params (see
    // Button.jsx) aren't picked up by it either.
    //
    // Not labelled "Type" on purpose — Button.jsx already has an unrelated native
    // `type` prop (HTML button/submit/reset), and giving this one the same displayed
    // label made the Controls table show two different rows both saying "type"/
    // "Type". `variant` is also the industry-standard name for this exact concept
    // (MUI, shadcn/ui, Radix, Primer all call it `variant`), so there's no reason to
    // rename the display label away from the prop key here.
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
      description: 'Visual hierarchy (Figma "Type").',
      table: { type: { summary: "'primary' | 'secondary' | 'tertiary'" } },
    },
    tone: {
      name: 'Tone',
      control: 'select',
      options: ['brand', 'neutral', 'destructive', 'inverse'],
      description: 'Colour role.',
      table: { type: { summary: "'brand' | 'neutral' | 'destructive' | 'inverse'" } },
    },
    size: {
      name: 'Size',
      control: 'select',
      options: ['tiny', 'small', 'medium', 'large'],
      description: 'Height/padding/type-scale step.',
      table: { type: { summary: "'tiny' | 'small' | 'medium' | 'large'" } },
    },
    disabled: {
      name: 'Disabled state',
      control: 'boolean',
      description: 'Disables the button (also forced true while `isLoading`).',
      table: { type: { summary: 'boolean' } },
    },
    isLoading: {
      name: 'Loading state',
      control: 'boolean',
      description: 'Shows a spinner in the trailing-icon slot and forces the button disabled/`aria-busy`.',
      table: { type: { summary: 'boolean' } },
    },
    // Integration-facing escape hatches for consuming code (e.g. Credit Controls'
    // own layout tweaks, or native <form> submit/reset behaviour) — not a design
    // decision, so hidden from the Controls table rather than left cluttering it.
    className: {
      control: 'text',
      description: "Extra class name(s) appended for a consuming component's own layout tweaks (e.g. full width).",
      table: { disable: true, type: { summary: 'string' } },
    },
    type: {
      description: 'Native HTML button behaviour inside a `<form>`; unrelated to `variant`.',
      table: { disable: true, type: { summary: "'button' | 'submit' | 'reset'" } },
    },
    leadingIcon: {
      name: 'Icon left',
      control: 'boolean',
      description: 'Icon rendered before the label.',
      table: { type: { summary: 'boolean' } },
    },
    trailingIcon: {
      name: 'Icon right',
      control: 'boolean',
      description: 'Icon rendered after the label; replaced by the loading spinner while `isLoading` is true.',
      table: { type: { summary: 'boolean' } },
    },
  },
  render: ({ leadingIcon, trailingIcon, ...args }) => (
    <Button
      {...args}
      leadingIcon={resolveIcon(leadingIcon, PlusIcon)}
      trailingIcon={resolveIcon(trailingIcon, ArrowIcon)}
    />
  ),
};

export default meta;

// Type/Tone/Size/Disabled/Loading/icons are exposed only through the Controls panel
// (see argTypes above) — switch them there instead of looking for "Secondary"/
// "Tertiary" stories in the sidebar. Disabled/Loading/icon stories stay separate
// because they carry their own Playwright/axe assertions in
// tools/design-library/run-storybook-checks.mjs, keyed by story id.
//
// Hover/Press/Focus have no dedicated story: hovering/clicking/tabbing to any story
// in the canvas already triggers the real :hover/:active/:focus-visible CSS — no
// story is needed just to look at that. storybook-addon-pseudo-states stays
// installed (harmless) for if a visual-regression tool (e.g. Chromatic) is ever
// added, since that's the only case where forcing these states into a fixed,
// snapshot-able story earns its keep; this repo has no such tool today, so we don't
// carry the extra sidebar entries for it.
export const Primary = {};
export const Disabled = { args: { disabled: true } };
export const Loading = { args: { isLoading: true, children: 'Generating' } };
export const TrailingIcon = { args: { trailingIcon: <ArrowIcon />, children: 'Next' } };
export const LeadingIcon = { args: { leadingIcon: <PlusIcon />, children: 'Add' } };
