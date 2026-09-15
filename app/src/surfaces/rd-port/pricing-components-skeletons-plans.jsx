import styles from './pricing-components-skeletons-plans.module.scss';
import _range from 'lodash/range';

export default function PlansSkeleton() {
  return _range(0, 3).map((i) => (
    <div
      key={`rightBlockSkeleton-${i}`}
      className={`${styles.pricingItemSkeleton} shimmer-skeleton`}
    />
  ));
}
