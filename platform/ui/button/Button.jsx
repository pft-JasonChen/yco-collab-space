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
  children,
  variant = buttonVariants.PRIMARY,
  tone = buttonTones.BRAND,
  size = buttonSizes.MEDIUM,
  leadingIcon = null,
  trailingIcon = null,
  isLoading = false,
  disabled = false,
  className = '',
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
      {leadingIcon ? <span className={styles.buttonIcon}>{leadingIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {trailingIcon ? <span className={styles.buttonIcon}>{trailingIcon}</span> : null}
    </button>
  );
}

export { buttonSizes, buttonTones, buttonVariants };
