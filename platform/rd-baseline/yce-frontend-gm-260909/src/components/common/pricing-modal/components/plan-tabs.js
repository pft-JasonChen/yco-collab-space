import styles from './plan-tabs.module.scss';
import { useMemo } from 'react';
import useHolidayStyles from '../hooks/use-holiday-styles';
import { getTranslationFunction } from '@/i18n';
import TabsKey from '../tabs-key';

const Tabs = [
  {
    key: TabsKey.plus,
    title: 'pricing.modal.plus',
  },
  {
    key: TabsKey.pro,
    title: 'pricing.modal.pro',
  },
];

export default function PlanTabs(props) {
  const {
    planType,
    onlyShowPayAsYouGo,
    onlyShowPro,
    handleSetPlanType,
    isProUser,
    isPlusUser,
    isHolidayMode = false,
    isDebugMode = false,
  } = props;
  const { t, locale } = getTranslationFunction();
  const { getPlanTabPaysStyles, getPlanTabsStyles, getPlanTabStyles } =
    useHolidayStyles();

  const tabClass = useMemo(() => {
    let baseClass = !isHolidayMode ? styles.tab : styles.holidayTab;
    if (['de', 'fr', 'ja', 'pt', 'it'].includes(locale)) {
      baseClass += ` ${styles.smallTab}`;
    }
    return baseClass;
  }, [locale]);

  const isProTab = useMemo(() => {
    return planType === TabsKey.pro;
  }, [planType]);

  if (isDebugMode) return null;
  if (onlyShowPayAsYouGo || isProUser) {
    return (
      <div className={styles.blueText} style={getPlanTabPaysStyles()}>
        {t('pricing.credit.plan.2.title.upper')}
      </div>
    );
  } else if (isPlusUser || onlyShowPro) {
    return (
      <div className={styles.orangeText} style={getPlanTabPaysStyles()}>
        {t('pricing.modal.pro')}
      </div>
    );
  } else {
    return (
      <div className={styles.planTabs} style={getPlanTabsStyles()}>
        {Tabs.map((tab, idx) => (
          <div
            key={`tab-${idx}`}
            className={tabClass}
            style={getPlanTabStyles(planType === tab.key, isProTab)}
            onClick={() => handleSetPlanType(tab.key)}
          >
            {t(tab.title)}
          </div>
        ))}
      </div>
    );
  }
}
