import logoSymbol from '../../../design-library/assets/logo/yco-online-editor/logo-symbol.svg';
import desktopLogo from '../../../design-library/assets/logo/yco-online-editor/logo-en-desktop.svg';
import chevronDownIcon from '../../../design-library/assets/icon/yco-navigation-header/chevron-down.svg';
import externalLinkIcon from '../../../design-library/assets/icon/yco-navigation-header/external-link.svg';
import wandIcon from '../../../design-library/assets/icon/yco-navigation-header/wand-start-editing.svg';
import crownIcon from '../../../design-library/assets/icon/yco-navigation-header/crown.svg';
import avatarPhotoCircle from '../../../design-library/assets/icon/yco-navigation-header/avatar-photo-circle.svg';
import hamburgerIcon from '../../../design-library/assets/icon/yco-navigation-header/hamburger.svg';
import mobilePromoIcon from '../../../design-library/assets/icon/yco-navigation-header/mobile-promo-icon.svg';
import mobileWandIcon from '../../../design-library/assets/icon/yco-navigation-header/mobile-wand-icon.svg';
import mobileCrownIcon from '../../../design-library/assets/icon/yco-navigation-header/mobile-crown-icon.svg';
import mobileUserDarkIcon from '../../../design-library/assets/icon/yco-navigation-header/mobile-user-dark.svg';
import infoIcon from '../../../design-library/assets/icon/yco-result-page-shell/info.svg';
import { CreditControl } from '../credit-controls/index.js';
import styles from './NavigationHeader.module.scss';

/** Figma NavigationHeader (node 12338:242779, file JXNIQPJT9I9qFrgtiaCn4i) — the
 * marketing-site top bar (youcam.com/online-editor style pages). Merged
 * (2026-09-14, explicit request) with what used to be a second, separate
 * component (ResultPageShell's own ProductHeader) once it became clear the
 * "marketing site vs. in-tool page" split wasn't a real distinction to begin
 * with — there's one header, not two. ResultPageShell now renders this
 * component directly at every width instead of swapping to its own header at
 * desktop sizes; the showFeatureName/featureNameText/showFeatureInfo/
 * creditBalance/showCredits/onInfo/onCredits props below exist for that
 * in-tool-page usage specifically. Non-login is the only userType with the
 * Product/Use Case/Pricing/API nav — every logged-in state (Free/Plus/Pro)
 * replaces it with an optional feature name instead, per the Figma frames
 * sampled for each. */
const defaultNavItems = [
  { id: 'product', label: 'Product', hasChevron: true },
  { id: 'use-case', label: 'Use Case', hasChevron: true },
  { id: 'pricing', label: 'Pricing' },
  { id: 'api', label: 'API', external: true },
];

const defaultLabels = {
  home: 'YouCam Online Editor home',
  menu: 'Open menu',
  account: 'Account',
  startEditing: 'Start Editing',
  loginSignup: 'Log In / Sign Up',
  signup: 'Sign Up',
  subscribe: 'Subscribe',
  upgrade: 'Upgrade',
};

function NavItems({ items, onSelect, labels }) {
  return (
    <nav className={styles.navItems} aria-label={labels.home}>
      {items.map((item) => (
        <button
          key={item.id}
          className={styles.navItem}
          type="button"
          onClick={onSelect ? () => onSelect(item.id) : undefined}
          disabled={!onSelect}
        >
          <span>{item.label}</span>
          {item.hasChevron ? <img src={chevronDownIcon} alt="" aria-hidden="true" /> : null}
          {item.external ? <img className={styles.externalIcon} src={externalLinkIcon} alt="" aria-hidden="true" /> : null}
        </button>
      ))}
    </nav>
  );
}

function PricingPill({ label, discountLabel, onClick }) {
  return (
    <button className={styles.pricingPill} type="button" onClick={onClick} disabled={!onClick}>
      <span>{label}</span>
      <span className={styles.pricingPillDivider} aria-hidden="true" />
      <span>{discountLabel}</span>
    </button>
  );
}

function Avatar({ src, onClick, label }) {
  return (
    <button className={styles.avatar} type="button" onClick={onClick} disabled={!onClick} aria-label={label}>
      <img className={styles.avatarBase} src={avatarPhotoCircle} alt="" aria-hidden="true" />
      {src ? (
        <img className={styles.avatarPhoto} src={src} alt="" aria-hidden="true" />
      ) : (
        <span className={styles.avatarGlyph} aria-hidden="true">&#xe92b;</span>
      )}
    </button>
  );
}

export default function NavigationHeader({
  /** 'non-login' shows the marketing nav; 'free'/'plus'/'pro' show the logged-in
   * (upsell + account) treatment instead — Figma never combines the two. */
  userType = 'non-login',
  navItems = defaultNavItems,
  /** Non-login only — turns the plain "Pricing" nav item into a discount pill. */
  holidayPricing = false,
  holidayDiscountLabel = '30%off',
  /** Plus/Pro only — whether the feature-name block (replacing the marketing
   * nav once a tool page is open) shows at all. Matches Figma's own component
   * property, which is a plain boolean, not free text. */
  showFeatureName = false,
  /** The label shown when showFeatureName is true. Figma's sampled frames only
   * ever showed one example ("Image to Video"), so that's the default here too
   * — override via this prop (not a Control) for a different tool page. */
  featureNameText = 'Image to Video',
  /** Independently toggles the (i) info icon inside the feature-name block. */
  showFeatureInfo = true,
  /** From the merged-in ProductHeader (2026-09-14): the credit-balance pill
   * shown alongside Avatar once a tool page is open. Not part of the original
   * marketing-header Figma frames — only relevant when showFeatureName's own
   * in-tool-page context applies, gated the same way (!isNonLogin). */
  creditBalance = 436,
  showCredits = true,
  /** Custom avatar photo; falls back to Figma's placeholder illustration. */
  avatarSrc = null,
  labels: labelOverrides = {},
  onNavItemClick,
  onStartEditing,
  onLoginSignup,
  onSubscribe,
  onUpgrade,
  onAccount,
  onMenuToggle,
  onBrand,
  /** From the merged-in ProductHeader (2026-09-14): click handler for the (i)
   * info icon next to featureNameText. */
  onInfo,
  /** From the merged-in ProductHeader (2026-09-14): click handler for the
   * credit-balance pill. */
  onCredits,
  /** Mobile-only gradient icon button shown for every logged-in tier, Pro
   * included (Figma's Pro/Devices=03_Mobile frame still carries it, unlike Pro
   * Desktop which drops the upgrade button entirely) — its exact purpose per
   * tier wasn't labelled in Figma, so it's exposed as one generic handler
   * rather than guessed apart into per-tier semantics. */
  onPromoAction,
  className = '',
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const isNonLogin = userType === 'non-login';

  return (
    <header
      className={`${styles.header} ${className}`}
      data-testid="navigation-header"
      data-surface-zone="navigation"
      data-component-role="site-header"
      data-user-type={userType}
    >
      {/* ----- Desktop / tablet row (Figma Devices=01_Desktop / 02_Tablet) -----
          Figma's Plus/Pro frames (e.g. node 12338:242929) don't nest featureName
          inside the logo group — it's a third sibling next to Logo/Right, which
          is what keeps it visually centered regardless of how wide the logo or
          the actions group happen to be. A first draft nested it inside .left
          (right after the brand button), which a screenshot caught: it
          reads left-aligned, following the logo, rather than centered. .hasCenter
          switches this row to the same 3-column-grid-with-two-equal-1fr-outer-
          tracks technique ResultPageShell's ProductHeader already uses for its
          own centered title, rather than inventing a second approach. */}
      <div className={`${styles.row} ${!isNonLogin && showFeatureName ? styles.hasCenter : ''}`} data-role="wide-row">
        <div className={styles.left}>
          <button className={styles.brand} type="button" onClick={onBrand} disabled={!onBrand} aria-label={labels.home}>
            <img className={styles.logoSymbol} src={logoSymbol} alt="" aria-hidden="true" />
            <img className={styles.wordmark} src={desktopLogo} alt="YouCam Online Editor" />
          </button>
          {isNonLogin ? (
            <NavItems items={navItems.filter((i) => i.id !== 'pricing' || !holidayPricing)} onSelect={onNavItemClick} labels={labels} />
          ) : null}
          {isNonLogin && holidayPricing ? (
            <PricingPill label="Pricing" discountLabel={holidayDiscountLabel} onClick={onNavItemClick ? () => onNavItemClick('pricing') : undefined} />
          ) : null}
        </div>
        {!isNonLogin && showFeatureName ? (
          <div className={styles.featureName}>
            <span>{featureNameText}</span>
            {showFeatureInfo ? (
              <button
                type="button"
                className={styles.featureInfoButton}
                data-testid="feature-name-info"
                onClick={onInfo}
                disabled={!onInfo}
                aria-label={`About ${featureNameText}`}
              >
                <img src={infoIcon} alt="" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={styles.right}>
          {isNonLogin ? (
            <>
              <button className={styles.startEditingButton} type="button" onClick={onStartEditing} disabled={!onStartEditing}>
                <img src={wandIcon} alt="" aria-hidden="true" />
                <span>{labels.startEditing}</span>
              </button>
              <button className={styles.startEditingIconButton} type="button" onClick={onStartEditing} disabled={!onStartEditing} aria-label={labels.startEditing}>
                <img src={wandIcon} alt="" aria-hidden="true" />
              </button>
              <button className={styles.primaryPill} type="button" onClick={onLoginSignup} disabled={!onLoginSignup}>
                {labels.loginSignup}
              </button>
              <button className={`${styles.primaryPill} ${styles.compactPill}`} type="button" onClick={onLoginSignup} disabled={!onLoginSignup}>
                {labels.signup}
              </button>
            </>
          ) : null}
          {userType === 'free' ? (
            <button className={styles.upsellButton} type="button" onClick={onSubscribe} disabled={!onSubscribe}>
              <img src={crownIcon} alt="" aria-hidden="true" />
              <span>{labels.subscribe}</span>
            </button>
          ) : null}
          {userType === 'plus' ? (
            <button className={styles.upsellButton} type="button" onClick={onUpgrade} disabled={!onUpgrade}>
              <img src={crownIcon} alt="" aria-hidden="true" />
              <span>{labels.upgrade}</span>
            </button>
          ) : null}
          {!isNonLogin && showCredits ? <CreditControl balance={creditBalance} onClick={onCredits} /> : null}
          {!isNonLogin ? <Avatar src={avatarSrc} onClick={onAccount} label={labels.account} /> : null}
        </div>
      </div>

      {/* ----- Mobile row (Figma Devices=03_Mobile ≤768px) ----- */}
      <div className={styles.row} data-role="mobile-row">
        <div className={styles.left}>
          {/* Present for every userType, not just non-login — Figma's Free/Plus
              /Pro mobile frames (e.g. node 12338:242919) also carry this menu
              icon to the left of the logo symbol, same as non-login's own
              frame; an earlier pass misread it as a non-login-only element. */}
          <button className={styles.menuButton} type="button" onClick={onMenuToggle} disabled={!onMenuToggle} aria-label={labels.menu}>
            <img src={hamburgerIcon} alt="" aria-hidden="true" />
          </button>
          <button className={styles.brand} type="button" onClick={onBrand} disabled={!onBrand} aria-label={labels.home}>
            <img className={styles.logoSymbol} src={logoSymbol} alt="" aria-hidden="true" />
          </button>
        </div>
        <div className={styles.right}>
          {isNonLogin ? (
            <>
              <button className={styles.mobileIconButtonPromo} type="button" onClick={onSubscribe} disabled={!onSubscribe} aria-label={labels.subscribe}>
                <img src={mobilePromoIcon} alt="" aria-hidden="true" />
              </button>
              <button className={styles.mobileIconButtonOutline} type="button" onClick={onStartEditing} disabled={!onStartEditing} aria-label={labels.startEditing}>
                <img src={mobileWandIcon} alt="" aria-hidden="true" />
              </button>
              <button className={`${styles.primaryPill} ${styles.compactPill}`} type="button" onClick={onLoginSignup} disabled={!onLoginSignup}>
                {labels.signup}
              </button>
            </>
          ) : (
            <>
              {/* Not part of the original marketing-header Figma frames — added
                  with the ProductHeader merge (2026-09-14) so the credit
                  balance stays visible once NavigationHeader also covers
                  ResultPageShell's in-tool mobile header, closing the gap an
                  earlier pass had flagged (mobile had no credits slot at all).
                  No mobile-specific reference exists for this exact
                  combination, so this reuses CreditControl's own responsive
                  behavior (it already drops its "+" icon under 768px) rather
                  than inventing a new compact variant. */}
              {showCredits ? <CreditControl balance={creditBalance} onClick={onCredits} /> : null}
              <button
                className={styles.mobileIconButtonPromo}
                type="button"
                onClick={onPromoAction}
                disabled={!onPromoAction}
                aria-label={userType === 'plus' ? labels.upgrade : labels.subscribe}
              >
                <img src={mobileCrownIcon} alt="" aria-hidden="true" />
              </button>
              <button className={styles.mobileIconButtonDark} type="button" onClick={onAccount} disabled={!onAccount} aria-label={labels.account}>
                <img src={mobileUserDarkIcon} alt="" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
