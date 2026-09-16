import { getCMSStaticProps } from '@/preprocess';
import seoUtils from '@/utils/seoUtils';
import { cmsTypes } from '@/utils/cmsTypes';
import { moduleTypes } from '@/utils/moduleTypes';
import { appSettingsTypes } from '@/utils/msr/appSettingsTypes';
import Layout from '@/components/common/Layout.ssg';
import LoginHomePage from '@/components/home/login-home-page';
import _get from 'lodash/get';

export default function Home(props) {
  const {
    publicDomain,
    cmsContent,
    cmsFeatureBanner,
    cmsUseCaseMenu,
    cmsGridModule,
    homepageLayoutConfig = null,
  } = props;
  const locale = _get(props, 'locale', 'en-us');
  const pageMeta = seoUtils.getPageMeta({
    locale,
    url: publicDomain,
    pathname: 'home',
    cmsContent,
    staticJsonLD: seoUtils.getJsonLDWebSiteAtHome(),
  });

  return (
    <>
      <Layout pageMeta={pageMeta} cmsContent={cmsContent}>
        <LoginHomePage
          cmsContent={cmsContent}
          cmsFeatureBanner={cmsFeatureBanner}
          cmsGridModule={cmsGridModule}
          cmsUseCaseMenu={cmsUseCaseMenu}
          homepageLayoutConfig={homepageLayoutConfig}
        />
      </Layout>
    </>
  );
}

const getStaticProps = async (props) => {
  const result = await getCMSStaticProps(
    props,
    [
      cmsTypes[moduleTypes.home],
      cmsTypes[moduleTypes.banner],
      cmsTypes[moduleTypes.gridModule],
      cmsTypes[moduleTypes.useCaseMenu],
    ],
    { appSettingTypes: [appSettingsTypes.yco_login_homepage_layout_config] }
  );

  const homepageLayoutConfig =
    result.props.initialAppSettings?.[
      appSettingsTypes.yco_login_homepage_layout_config
    ]?.data ?? null;

  return {
    ...result,
    props: {
      ...result.props,
      homepageLayoutConfig,
    },
  };
};

export { getStaticProps };
