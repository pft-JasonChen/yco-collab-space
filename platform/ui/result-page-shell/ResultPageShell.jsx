import desktopLogo from '../../../design-library/assets/logo/yco-online-editor/logo-en-desktop.svg';
import mobileLogo from '../../../design-library/assets/logo/yco-online-editor/logo-en-mobile.svg';
import logoSymbol from '../../../design-library/assets/logo/yco-online-editor/logo-symbol.svg';
import profileIcon from '../../../design-library/assets/icon/yco-result-page-shell/profile.svg';
import infoIcon from '../../../design-library/assets/icon/yco-result-page-shell/info.svg';
import { CreditControl } from '../credit-controls/index.js';
import { defaultToolFamilies } from './defaultToolFamilies.js';
import styles from './ResultPageShell.module.scss';

/** Every user-facing string is a prop so RD can hand them straight to its own t(). */
const defaultLabels = {
  home: 'YouCam Online Editor home',
  account: 'Account',
  toolFamilies: 'Tool families',
  toolList: 'YCO tools',
};

export function ProductHeader({
  labels: labelOverrides = {},
  title,
  showInfo = true,
  onInfo,
  onAccount,
  onBrand,
  creditBalance = 436,
  showCredits = true,
  onCredits,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <header
      className={styles.productHeader}
      data-testid="production-header"
      data-surface-zone="navigation"
      data-component-role="navigation-header"
    >
      <button
        className={styles.brand}
        type="button"
        onClick={onBrand}
        disabled={!onBrand}
        aria-label={labels.home}
      >
        <img className={styles.logoSymbol} src={logoSymbol} alt="" aria-hidden="true" />
        <picture>
          <source media="(max-width: 768px)" srcSet={mobileLogo} />
          <img className={styles.wordmark} src={desktopLogo} alt="YouCam Online Editor" />
        </picture>
      </button>
      <div className={styles.titleGroup}>
        <h1>{title}</h1>
        {showInfo ? (
          <button data-testid="product-title-info" type="button" onClick={onInfo} disabled={!onInfo} aria-label={`About ${title}`}>
            <img src={infoIcon} alt="" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={styles.headerActions}>
        {showCredits ? <CreditControl balance={creditBalance} onClick={onCredits} /> : null}
        <button
          className={styles.account}
          type="button"
          onClick={onAccount}
          disabled={!onAccount}
          aria-label={labels.account}
        >
          <img src={profileIcon} alt="" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

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
  children,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <div className={styles.shell}>
      <ProductHeader labels={labels} title={title} showInfo={showInfo} onInfo={onInfo} onAccount={onAccount} onBrand={onBrand} creditBalance={creditBalance} showCredits={showCredits} onCredits={onCredits} />
      <div className={styles.shellBody}>
        <ToolFamilyMenu labels={labels} items={toolItems} activeId={activeToolId} onSelect={onToolSelect} />
        <main className={styles.shellContent}>{children}</main>
      </div>
    </div>
  );
}
