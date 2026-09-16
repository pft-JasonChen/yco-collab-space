import styles from './pricing-components-more-plan-link.module.scss';
import useHolidayStyles from './pricing-hooks-use-holiday-styles.jsx';
import { getTranslationFunction } from './pricing-adapters.jsx';
import { LinkWithLocale as LinkWithLocale } from './pricing-adapters.jsx';
import { useGA as useGA } from './pricing-adapters.jsx';
import TabsKey from './pricing-tabs-key.jsx';
import { groupType } from './pricing-adapters.jsx';

export default function MorePlanLink(props) {
  const { planType = TabsKey.subscription, handleModalClose } = props;
  const { t } = getTranslationFunction();
  const { getMorePlanLinkStyles, getMorePlanLinkIconSrc } = useHolidayStyles();
  const { moreEvent } = useGA();

  const planTypeToProductGroup = (planType) => {
    if (planType === TabsKey.subscription) return groupType.ENH_SUB_TKN;
    return groupType.ENH_PAYS_TKN;
  };

  return (
    <LinkWithLocale
      href="/pricing"
      className={styles.morePlan}
      onClick={() => {
        moreEvent(planTypeToProductGroup(planType));
        handleModalClose();
      }}
    >
      <div className={styles.morePlansText} style={getMorePlanLinkStyles()}>
        {t('pricing.modal.show.more')}
      </div>
      <img src={getMorePlanLinkIconSrc()} className={styles.butArrow} />
    </LinkWithLocale>
  );
}
