import styles from './Logo.module.scss';
import assetMap from './rd-assets.js';
import { LinkWithLocale as LinkWithLocale } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { LogoMap } from './adapters.jsx';
import { useUserStatus as useUserStatus } from './adapters.jsx';

export default function Logo({ isResultPage, isMd, headerMenuOpened }) {
  const { locale } = getTranslationFunction();
  const { isLoginUser } = useUserStatus();

  const dtSrc = assetMap[`/assets/images/logo/logo_YC_OnlineEditor_d_${LogoMap[locale]}_dt.svg`];
  const mbSrc = assetMap[`/assets/images/logo/logo_YC_OnlineEditor_d_${LogoMap[locale]}_mb.svg`];

  const getLogoStyles = () => {
    if (headerMenuOpened && isMd) {
      return styles.logoMobile;
    }
    return styles.logo;
  };

  return (
    <LinkWithLocale
      id="yce-link-home"
      href={isLoginUser ? '/home' : '/'}
      className={styles.logoContainer}
      target={isResultPage ? '_blank' : ''}
      rel={isResultPage ? 'noopener noreferrer' : ''}
    >
      <img
        className={styles.symbol}
        src={assetMap['/assets/images/logo/logo_symbol.svg']}
        alt="YCE Icon"
        draggable={false}
      />
      <picture>
        <source media="(max-width: 768px)" srcSet={mbSrc} />
        <img
          className={getLogoStyles()}
          src={dtSrc}
          alt="YCE Logo"
          draggable={false}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = isMd
              ? assetMap['/assets/images/logo/logo_YC_OnlineEditor_d_ENU_mb.svg']
              : assetMap['/assets/images/logo/logo_YC_OnlineEditor_d_ENU_dt.svg'];
          }}
        />
      </picture>
    </LinkWithLocale>
  );
}
