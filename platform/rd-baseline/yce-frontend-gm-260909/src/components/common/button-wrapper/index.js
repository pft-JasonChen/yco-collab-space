import styles from './index.module.scss';
import variantStyles from './button.module.css';
import browserUtils from '@/utils/browserUtils';
import { useEffect, useState } from 'react';
import _isFunction from 'lodash/isFunction';
import { disabledVariants } from './types/buttonWrapperTypes';
import LinkWithLocale from '@/components/utils/link-with-locale';

export default function ButtonWrapper(props) {
  const [touching, setTouching] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(browserUtils.isTouchDevice());
  }, []);

  const {
    hideHoverEffect = false,
    className,
    hoverClass = 'hover-opacity',
    touchClass = 'touch-opacity',
    children,
    gaClass = null,
    disabled = false,
    disabledVariant = disabledVariants.DEFAULT,
    onTouchStart = () => {},
    onTouchEnd = () => {},
    href = null,
    variant,
    tone,
    size = 'medium',
    leadingIcon,
    trailingIcon,
    isLoading = false,
    ...otherProps
  } = props;

  const isVariantMode = Boolean(variant && tone);

  if (isVariantMode) {
    const classes = [
      variantStyles.ycoButton,
      variantStyles[`variant_${variant}`],
      variantStyles[`tone_${tone}`],
      variantStyles[`size_${size}`],
      isLoading && variantStyles.isLoading,
      gaClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        className={classes}
        disabled={disabled || isLoading}
        {...otherProps}
      >
        {leadingIcon && (
          <span className={variantStyles.buttonIcon}>{leadingIcon}</span>
        )}
        <span className={variantStyles.label}>{children}</span>
        {trailingIcon && (
          <span className={variantStyles.buttonIcon}>{trailingIcon}</span>
        )}
      </button>
    );
  }

  const getHoverClass = () => {
    if (isTouchDevice || hideHoverEffect) {
      return '';
    } else {
      return !disabled && hoverClass;
    }
  };

  const setTouchingIfNecessary = (v) => {
    if (!browserUtils.isTouchDevice() || hideHoverEffect) {
      return;
    }
    setTouching(v);
  };

  const getTouchClass = () => {
    if (!hideHoverEffect) {
      return !disabled && touchClass;
    }
    return '';
  };

  const handleTouchStart = () => {
    setTouchingIfNecessary(true);
    _isFunction(onTouchStart) && onTouchStart();
  };

  const handleTouchEnd = () => {
    setTouchingIfNecessary(false);
    _isFunction(onTouchEnd) && onTouchEnd();
  };

  if (href) {
    return (
      <button
        className={`${styles.noButtonStyles}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        {...otherProps}
      >
        <LinkWithLocale
          className={`${styles.button} ${className} ${getHoverClass()} ${
            touching ? getTouchClass() : ''
          } ${gaClass ? gaClass : ''} ${
            disabled ? styles[disabledVariant] : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled}
          href={href}
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          {children}
        </LinkWithLocale>
      </button>
    );
  }

  return (
    <button
      className={`${styles.button} ${className} ${getHoverClass()} ${
        touching ? getTouchClass() : ''
      } ${gaClass ? gaClass : ''} ${disabled ? styles[disabledVariant] : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      {...otherProps}
    >
      {children}
    </button>
  );
}
