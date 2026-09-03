import styles from './index.module.scss';

export default function CreditBadge(props) {
  const { displayCredit, creditStyle, containerStyle } = props;

  return (
    <div className={styles.creditBadge} style={containerStyle}>
      <img
        className={styles.coinIcon}
        src="/assets/images/header/icon_credit.svg"
        alt=""
      />
      <span className={styles.costDesc} style={creditStyle}>
        {displayCredit}
      </span>
    </div>
  );
}
