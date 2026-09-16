import styles from './Tab.module.scss';
import { getTranslationFunction } from './adapters.jsx';
import { forwardRef } from 'react';

const Tab = forwardRef(
  ({ tabKey, label, isActive, onClick, showRedDot }, ref) => {
    const { t } = getTranslationFunction();

    return (
      <div
        ref={ref}
        className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
        onClick={() => onClick(tabKey)}
      >
        {t(label)}
        {showRedDot && <span className={styles.redDot} />}
      </div>
    );
  }
);

Tab.displayName = 'Tab';
export default Tab;

