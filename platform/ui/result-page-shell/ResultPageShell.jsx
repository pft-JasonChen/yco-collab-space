import desktopLogo from '../../../design-library/assets/logo/yco-online-editor/logo-en-desktop.svg';
import mobileLogo from '../../../design-library/assets/logo/yco-online-editor/logo-en-mobile.svg';
import logoSymbol from '../../../design-library/assets/logo/yco-online-editor/logo-symbol.svg';
import profileIcon from '../../../design-library/assets/icon/yco-result-page-shell/profile.svg';
import infoIcon from '../../../design-library/assets/icon/yco-result-page-shell/info.svg';
import homeIcon from '../../../design-library/assets/icon/yco-result-page-shell/home.svg';
import agentIcon from '../../../design-library/assets/icon/yco-result-page-shell/ai-agent.svg';
import { CreditControl } from '../credit-controls/index.js';
import styles from './ResultPageShell.module.scss';

const defaultToolFamilies = [
  { id: 'home', label: 'Home', image: homeIcon },
  { id: 'ai-agent', label: 'AI Agent', image: agentIcon },
  { id: 'ai-photo-editing', label: 'AI Photo Editing', glyph: '\ue904' },
  { id: 'basic-editing', label: 'Basic Editing', glyph: '\ue922' },
  { id: 'ai-video', label: 'AI Video', glyph: '\ue918' },
  { id: 'ai-image', label: 'AI Image', glyph: '\ue917' },
  { id: 'ai-portrait', label: 'AI Portrait', glyph: '\ue91c' },
  { id: 'batch-editing', label: 'Batch Editing', glyph: '\ue900' },
  { id: 'template', label: 'Template', glyph: '\ue907' },
];

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

export function ToolFamilyMenu({
  labels: labelOverrides = {},
  items = defaultToolFamilies,
  activeId = 'ai-video',
  onSelect,
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  return (
    <aside
      className={styles.toolMenu}
      data-testid="tool-family-menu"
      data-surface-zone="tool-navigation"
      data-component-role="tool-rail"
      aria-label={labels.toolFamilies}
    >
      <nav className={styles.toolMenuScroller} aria-label={labels.toolList}>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div className={item.id === 'home' ? styles.homeItem : styles.menuItem} key={item.id}>
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
        })}
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

export { defaultToolFamilies };
