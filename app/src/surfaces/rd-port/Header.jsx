// Route-specific composition of common/headers/index.js (containerScroll,
// container, Logo, buttonsContainer) and header-buttons/header-buttons.js.
// Only the authenticated home/gallery branches are active in this fixture.
import styles from './Header.module.scss';
import Logo from './Logo.jsx';
import GeneralPricing from './GeneralPricing.jsx';
import ColorButton from './ColorButton.jsx';
import { useRouter, useWindowDevice } from './adapters.jsx';
export default function Header({ onPricing }) {
  const { isMd, isSmallMobile } = useWindowDevice();
  const { pathname } = useRouter();
  const isHomePage = pathname === '/home';
  return (
    <div className={styles.containerScroll} id="yce-header-container">
      <div className={styles.container}>
        <Logo isResultPage={false} isMd={isMd} headerMenuOpened={false} />
        <div className={styles.buttonsContainer}>
          {!isSmallMobile && (isHomePage || isMd) && <GeneralPricing isActiveModule={() => false} handleButtonClick={onPricing} isHomePage={isHomePage} isResultPage={false} isMd={isMd} isSubscribe />}
          <ColorButton type="member" url="/account" hideText disabled={false} showRedDotState={[]} newTab={false} touchClass="touch-with-border-03ade2-20" hoverClass="hover-with-border-03ade2-20" />
        </div>
      </div>
    </div>
  );
}
