import styles from './Button.module.css';

const buttonVariants = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
};

const buttonTones = {
  BRAND: 'brand',
  NEUTRAL: 'neutral',
  DESTRUCTIVE: 'destructive',
  INVERSE: 'inverse',
  WARNING: 'warning',
  SUCCESS: 'success',
};

const buttonSizes = {
  TINY: 'tiny',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

export default function Button({
  /** Button label content. */
  children,
  /** Visual hierarchy (Figma "Type"). */
  variant = buttonVariants.PRIMARY,
  /** Colour role. */
  tone = buttonTones.BRAND,
  /** Height/padding/type-scale step. */
  size = buttonSizes.MEDIUM,
  /** Icon rendered before the label. */
  leadingIcon = null,
  /** Icon rendered after the label; replaced by the loading spinner while `isLoading` is true. */
  trailingIcon = null,
  /** Shows a spinner in the trailing-icon slot and forces the button disabled/`aria-busy`. */
  isLoading = false,
  /** Disables the button (also forced true while `isLoading`). */
  disabled = false,
  /** Extra class name(s) appended for a consuming component's own layout tweaks (e.g. full width). */
  className = '',
  /** Native HTML button behaviour inside a `<form>`; unrelated to `variant`. */
  type = 'button',
  ...buttonProps
}) {
  const classes = [
    styles.ycoButton,
    styles[`variant_${variant}`],
    styles[`tone_${tone}`],
    styles[`size_${size}`],
    isLoading && styles.isLoading,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...buttonProps}
    >
      {leadingIcon && <span className={styles.buttonIcon}>{leadingIcon}</span>}
      <span className={styles.label}>{children}</span>
      {isLoading ? (
        <span className={styles.buttonIcon}>
          <span className={styles.spinner} aria-hidden="true" />
        </span>
      ) : (
        trailingIcon && <span className={styles.buttonIcon}>{trailingIcon}</span>
      )}
    </button>
  );
}

export { buttonSizes, buttonTones, buttonVariants };
