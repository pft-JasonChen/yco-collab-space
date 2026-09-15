import 'swiper/css';
import 'swiper/css/grid';
import styles from '../index.module.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import useWindowDevice from '@/hooks/use-window-device';
import { getTranslationFunction } from '@/i18n';
import Card from '../components/cardsV2';
import HomeCategory from '../components/homeCategory';
import LoginBanner from '../components/loginBanner';
import LoadingSkeleton from '@/components/home/components/loading-skeleton';
import categoryNameUtils from '../utils/category-name-utils';
import { getMobileSettings } from '../utils/swiper-config';
import { getValidCards, isLinkValid } from '../utils/grid-module-utils';
import CategoryBasket from '../components/categoryBasket';
import _isEmpty from 'lodash/isEmpty';
import _get from 'lodash/get';
import dynamic from 'next/dynamic';

const RecentUsedFeatures = dynamic(
  () => import('../components/recentUsedFeatures'),
  { ssr: false }
);

/**
 * Layout for layoutVer === '1_30_0'.
 * Shows a side HomeCategory panel + a vertically-stacked list of card grids.
 */
export default function Layout1300({
  filteredSections,
  loginBanner,
  tabHot,
  tabNew,
  onSelect,
  onScrollToTop,
  homepageLayoutConfig,
  recentUsedFeaturesSection,
  sectionsLoaded,
  skipLoadingSkeleton = true,
}) {
  const { isMeasured, isMd, is1200, is1920, isMobileDevice, orientation } =
    useWindowDevice();
  const { t } = getTranslationFunction();
  const isMobileLayout = isMeasured && isMd;

  const getCategoryName = (categoryName) => {
    const i18nKey = categoryNameUtils.getCategoryNameMappingKey(categoryName);
    return i18nKey ? t(i18nKey) : categoryName;
  };

  if (!skipLoadingSkeleton && !sectionsLoaded) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      id="YCE-gridmodulesection-container"
      className={`${styles.scrollContainer} hidden-scrollbar ${styles.outerContainer}`}
      data-layout-measured={isMeasured ? 'true' : 'false'}
    >
      {!isMobileLayout && (
        <div className={styles.homeCategoryVisibility}>
          <HomeCategory
            sections={filteredSections}
            getCategoryName={getCategoryName}
            onSectionSelect={(v) => onSelect('section', v)}
            scrollToTop={onScrollToTop}
            isMobileLandscape={isMobileDevice && orientation === 'landscape'}
          />
        </div>
      )}
      <div
        id="YCE-gridmodulesection-right-category-container"
        className={styles.rightContentContainer}
        data-mobile-landscape={isMobileDevice && orientation === 'landscape'}
      >
        {/* <LoginBanner
          banner={loginBanner}
          handleActionButton={(link) => {
            window.location.href = link;
          }}
        /> */}

        {/* CategoryBasket: AI Photo | AI Video */}
        <CategoryBasket
          filteredSections={filteredSections}
          homepageLayoutConfig={homepageLayoutConfig}
          tabHot={tabHot}
          tabNew={tabNew}
        />

        {/* RecentUsedFeatures: Recently Used Features */}
        <RecentUsedFeatures
          section={recentUsedFeaturesSection}
          initialized={sectionsLoaded}
          getCategoryName={getCategoryName}
        />

        <div className={styles.gridModuleContainer} data-layoutver={'1_25_0'}>
          {filteredSections.map((section, index) => {
            if (section?.gridModule && _isEmpty(section.gridModule)) return;
            return (
              <div
                id={`yce-gridmodule-section-${section.id}`}
                data-id={section.id}
                key={`gridmodule-section-${index}`}
                className={styles.scroll}
              >
                <div className={styles.rightCategoryName}>
                  {getCategoryName(section.categoryName)}
                </div>
                <div className={styles.swiperContainer}>
                  {/* Desktop: plain CSS grid */}
                  {!isMobileLayout &&
                    (() => {
                      const valid = getValidCards(section.gridModule);
                      return (
                        <div
                          className={`${styles.swiper} ${styles.rightContentSwiper}`}
                        >
                          {valid
                            .filter((card) => {
                              const mapLink = _get(card, 'mapLink');
                              const link = _get(card, 'link');
                              return !(mapLink && !isLinkValid(link));
                            })
                            .map((card) => (
                              <div
                                key={`gridmodule-card-${card.id}`}
                                className={styles.rightCardContainer}
                              >
                                <Card
                                  card={card}
                                  tabHot={tabHot}
                                  tabNew={tabNew}
                                  isHomePage={!!homepageLayoutConfig}
                                />
                              </div>
                            ))}
                        </div>
                      );
                    })()}
                  {/* Mobile: Swiper */}
                  {isMobileLayout &&
                    (() => {
                      const valid = getValidCards(section.gridModule);
                      const mobileSettings = getMobileSettings(valid.length);
                      return (
                        <Swiper {...mobileSettings} className={styles.swiper}>
                          {valid.map((card) => (
                            <SwiperSlide key={`gridmodule-card-${card.id}`}>
                              <div className={styles.cardContainer}>
                                <Card
                                  card={card}
                                  tabHot={tabHot}
                                  tabNew={tabNew}
                                  isHomePage={!!homepageLayoutConfig}
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      );
                    })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
