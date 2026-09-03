import styles from './logo.module.scss';
import LinkWithLocale from '@/components/utils/link-with-locale';
import { getTranslationFunction } from '@/i18n';
import { LogoMap } from '@/components/common/footer/utils/link-utils';
import useUserStatus from '@/hooks/use-user-status';

export default function Logo({ isResultPage, isMd, headerMenuOpened }) {
  const { locale } = getTranslationFunction();
  const { isLoginUser } = useUserStatus();

  const dtSrc = `/assets/images/logo/logo_YC_OnlineEditor_d_${LogoMap[locale]}_dt.svg`;
  const mbSrc = `/assets/images/logo/logo_YC_OnlineEditor_d_${LogoMap[locale]}_mb.svg`;

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
        src={'/assets/images/logo/logo_symbol.svg'}
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
              ? '/assets/images/logo/logo_YC_OnlineEditor_d_ENU_mb.svg'
              : '/assets/images/logo/logo_YC_OnlineEditor_d_ENU_dt.svg';
          }}
        />
      </picture>
    </LinkWithLocale>
  );
}
