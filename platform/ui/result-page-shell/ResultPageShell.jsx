import NavigationHeader from '../navigation-header/index.js';
import { defaultToolFamilies } from './defaultToolFamilies.js';
import styles from './ResultPageShell.module.scss';

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  home: 'YouCam Online Editor home',
  account: 'Account',
  toolFamilies: 'Tool families',
  toolList: 'YCO tools',
};

/* Figma's own Divider component (node 198:248): a 1px --stroke-weak line that
   fills its parent's width — here that parent is the 80px icon column, not the
   112px rail (the rail's 20/12px left/right gutters come from .toolMenuScroller's
   own padding, matching NavigationSide's Padding: 20/12/20/20 in Figma). */
function Divider() {
  return <div className={styles.divider} role="separator" aria-hidden="true" />;
}

export function ToolFamilyMenu({
  labels: labelOverrides = {},
  items = defaultToolFamilies,
  activeId = 'ai-video',
  onSelect,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const homeItems = items.filter((item) => item.id === 'home');
  const restItems = items.filter((item) => item.id !== 'home');
  const hasDivider = homeItems.length > 0 && restItems.length > 0;

  const renderItem = (item) => {
    const active = item.id === activeId;
    return (
      <div className={styles.menuItem} key={item.id}>
        <button
          className={active ? styles.menuButtonActive : styles.menuButton}
          data-testid={active ? `tool-family-${item.id}` : undefined}
          type="button"
          aria-current={active ? 'page' : undefined}
          aria-disabled={!onSelect}
          disabled={!onSelect}
          onClick={onSelect ? () => onSelect(item.id) : undefined}
        >
          <span className={styles.menuIcon} aria-hidden="true">
            {item.image ? <img src={item.image} alt="" /> : <span className={styles.glyph}>{item.glyph}</span>}
          </span>
          {item.id === 'home' ? <span className={styles.visuallyHidden}>{item.label}</span> : <span>{item.label}</span>}
        </button>
      </div>
    );
  };

  return (
    <aside
      className={styles.toolMenu}
      data-testid="tool-family-menu"
      data-surface-zone="tool-navigation"
      data-component-role="tool-rail"
      aria-label={labels.toolFamilies}
    >
      <nav className={styles.toolMenuScroller} aria-label={labels.toolList}>
        {homeItems.map(renderItem)}
        {hasDivider ? <Divider /> : null}
        {restItems.length > 0 ? <div className={styles.menuGroup}>{restItems.map(renderItem)}</div> : null}
        {hasDivider ? <Divider /> : null}
      </nav>
    </aside>
  );
}

export default function ResultPageShell({
  labels: labelOverrides = {},
  title,
  showInfo = true,
  activeToolId = 'ai-video',
  toolItems = defaultToolFamilies,
  onToolSelect,
  onInfo,
  onAccount,
  onBrand,
  creditBalance = 436,
  showCredits = true,
  onCredits,
  /** Which NavigationHeader userType to render (2026-09-14: NavigationHeader
   * merged with what used to be this shell's own separate ProductHeader — see
   * NavigationHeader.jsx's own top comment — so there's one header now, not a
   * desktop/mobile pair). 'pro' is the default since ResultPageShell has no
   * real subscription-tier data of its own and 'pro' is the one tier with no
   * upsell button, the most neutral choice for a generic in-tool header. */
  userType = 'pro',
  children,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <div className={styles.shell}>
      <NavigationHeader
        userType={userType}
        showFeatureName
        featureNameText={title}
        showFeatureInfo={showInfo}
        onInfo={onInfo}
        creditBalance={creditBalance}
        showCredits={showCredits}
        onCredits={onCredits}
        onAccount={onAccount}
        onBrand={onBrand}
      />
      <div className={styles.shellBody}>
        <ToolFamilyMenu labels={labels} items={toolItems} activeId={activeToolId} onSelect={onToolSelect} />
        <main className={styles.shellContent}>{children}</main>
      </div>
    </div>
  );
}
