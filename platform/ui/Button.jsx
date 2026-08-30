import styles from './Button.module.scss';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      className={styles.button + ' ' + styles[variant]}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
