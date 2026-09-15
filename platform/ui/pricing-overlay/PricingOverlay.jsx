import { useId } from 'react';
import { Modal } from '../confirm-dialog/index.js';
import styles from './PricingOverlay.module.scss';
import closeIcon from '../../../design-library/assets/icon/yco-home-gallery/images__icon_close.svg';

const defaultLabels = {
  close: 'Close',
  checkout: 'Subscribe',
  perMonth: '/mo',
  save: 'Save {percent}',
};

/**
 * Plan switcher, ported from RD's common/pricing-modal/components/plan-tabs.
 *
 * RD reads its active-tab appearance from a JS style table keyed by holiday
 * theme; the default entry is a hard-coded gradient. Here the active state is a
 * class, so the gradient is expressed in tokens and is visible to the raw-colour
 * policy. `tone` selects which of RD's two default gradients applies.
 */
export function PlanTabs({ tabs, activeKey, onChange, className }) {
  if (!tabs?.length) return null;

  // RD renders a single static pill instead of a switcher when only one offer
  // applies to the user, rather than a one-tab tab bar.
  if (tabs.length === 1) {
    const [only] = tabs;
    return (
      <div
        className={only.tone === 'pro' ? styles.orangeText : styles.blueText}
        data-component-role="plan-tabs"
        data-single="true"
      >
        {only.label}
      </div>
    );
  }

  return (
    <div
      className={[styles.planTabs, className].filter(Boolean).join(' ')}
      role="tablist"
      data-component-role="plan-tabs"
    >
      {tabs.map((tab) => {
        const selected = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={[styles.tab, selected ? styles.tabActive : null].filter(Boolean).join(' ')}
            data-tone={tab.tone ?? 'plus'}
            data-tab-key={tab.key}
            onClick={() => onChange?.(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Selectable offer cards, ported from RD's plan-list.
 *
 * RD derives every displayed value from its pricing SKU model — currency
 * lookup, cycle division, holiday promotion discount. None of that can live in
 * a shared presentational component, and a prototype must not carry a commerce
 * engine at all, so the already-resolved display strings arrive as props.
 */
export function PlanList({ plans, selectedKey, onSelect, labels = {} }) {
  const copy = { ...defaultLabels, ...labels };

  return (
    <div className={styles.planList} data-component-role="plan-list">
      {plans.map((plan) => {
        const selected = plan.key === selectedKey;
        return (
          <button
            key={plan.key}
            type="button"
            className={styles.planWrapper}
            data-selected={String(selected)}
            data-plan-key={plan.key}
            aria-pressed={selected}
            onClick={() => onSelect?.(plan.key)}
          >
            <span className={styles.leftContainer}>
              <span className={styles.planName}>{plan.name}</span>
              {plan.note && <span className={styles.planNote}>{plan.note}</span>}
            </span>

            <span
              className={[styles.priceWrapper, plan.originalPrice ? styles.discountPriceWrapper : null]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.price}>
                {plan.price}
                {plan.perCycle !== false && <span className={styles.perMonth}>{copy.perMonth}</span>}
              </span>
              {plan.originalPrice && (
                <span className={styles.priceLineThrough}>{plan.originalPrice}</span>
              )}
            </span>

            {plan.savePercent && (
              <span className={styles.savePercentWrapper}>
                <span className={styles.savePercent}>
                  {copy.save.replace('{percent}', plan.savePercent)}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Benefit list, ported from RD's feature-list.
 */
export function FeatureList({ title, items, className }) {
  return (
    <div className={[styles.featureBox, className].filter(Boolean).join(' ')} data-component-role="feature-list">
      {title && <p className={styles.featureTitle}>{title}</p>}
      <ul className={styles.featureItems}>
        {items.map((item) => (
          <li key={item} className={styles.boxItem}>
            <span className={styles.featureTick} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The subscription overlay, ported from RD's common/pricing-modal.
 *
 * RD's two-column composition is kept: benefits on the left, the offer switcher
 * and plan cards on the right, with the checkout action beneath them. The
 * seasonal themes, currency service, countdown, skeletons and real checkout are
 * not ported — see this component's component.yaml.
 *
 * `secondaryAction` is the slot Cloud Storage uses for its Expand storage only
 * entry, matching RD's own MorePlanLink position beneath the checkout button.
 *
 * @param {object} props
 * @param {boolean} props.opened
 * @param {string} props.title
 * @param {() => void} props.onClose
 * @param {{key: string, label: string, tone?: 'plus'|'pro'}[]} [props.tabs]
 * @param {string} [props.activeTabKey]
 * @param {(key: string) => void} [props.onTabChange]
 * @param {{key: string, name: string, price: string, note?: string,
 *          originalPrice?: string, savePercent?: string, perCycle?: boolean}[]} props.plans
 * @param {string} [props.selectedPlanKey]
 * @param {(key: string) => void} [props.onSelectPlan]
 * @param {{title?: string, items: string[]}} [props.features]
 * @param {React.ReactNode} [props.summary]  amount-due / proration block
 * @param {() => void} [props.onCheckout]
 * @param {boolean} [props.checkoutDisabled]
 * @param {React.ReactNode} [props.secondaryAction]
 * @param {React.ReactNode} [props.aside]  extra left-column content, e.g. current usage
 * @param {React.ReactNode} [props.leadingAction]  top-left slot, e.g. a back control
 */
export default function PricingOverlay({
  opened,
  title,
  onClose,
  tabs,
  activeTabKey,
  onTabChange,
  plans = [],
  selectedPlanKey,
  onSelectPlan,
  features,
  summary,
  onCheckout,
  checkoutDisabled = false,
  secondaryAction,
  aside,
  leadingAction,
  labels = {},
}) {
  const titleId = useId();
  const copy = { ...defaultLabels, ...labels };

  return (
    <Modal
      opened={opened}
      handleClose={onClose}
      showModalScaleTransition
      modalClassName={styles.modal}
      ariaLabelledBy={titleId}
    >
      <div className={styles.container} data-component-role="pricing-overlay">
        <div className={styles.featuresBlock}>
          {aside}
          {features && <FeatureList title={features.title} items={features.items} />}
        </div>

        <div className={styles.rightBlock}>
          <div className={styles.rightHeader}>
            {leadingAction}
            <h2 className={styles.planTitle} id={titleId}>
              {title}
            </h2>
          </div>

          <PlanTabs tabs={tabs} activeKey={activeTabKey} onChange={onTabChange} />

          <PlanList
            plans={plans}
            selectedKey={selectedPlanKey}
            onSelect={onSelectPlan}
            labels={copy}
          />

          {summary && <div className={styles.summary}>{summary}</div>}

          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={styles.checkoutButton}
              onClick={onCheckout}
              disabled={checkoutDisabled || !selectedPlanKey}
              data-testid="pricing-checkout"
            >
              {copy.checkout}
            </button>
            {secondaryAction}
          </div>
        </div>

        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={copy.close}
          data-testid="pricing-close"
        >
          <img src={closeIcon} alt="" />
        </button>
      </div>
    </Modal>
  );
}
