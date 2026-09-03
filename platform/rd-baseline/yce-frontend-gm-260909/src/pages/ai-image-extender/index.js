import { getCMSStaticProps } from '@/preprocess';
import seoUtils from '@/utils/seoUtils';
import { cmsTypes } from '@/utils/cmsTypes';
import { moduleTypes } from '@/utils/moduleTypes';
import Layout from '@/components/common/Layout.ssg';
import AiImageExtenderPage from '@/components/home/ai-image-extender-page';
import _get from 'lodash/get';

export default function AiImageExtender(props) {
  const { publicDomain, cmsContent, cmsFeatureBanner, cmsUseCaseMenu } = props;
  const locale = _get(props, 'locale', 'en-us');
  const pageMeta = seoUtils.getPageMeta({
    locale,
    url: publicDomain,
    pathname: 'ai-image-extender',
    cmsContent,
  });

  return (
    <>
      <Layout pageMeta={pageMeta} cmsContent={cmsContent}>
        <AiImageExtenderPage
          cmsContent={cmsContent}
          cmsFeatureBanner={cmsFeatureBanner}
          cmsUseCaseMenu={cmsUseCaseMenu}
        />
      </Layout>
    </>
  );
}

const getStaticProps = (props) =>
  getCMSStaticProps(props, [
    cmsTypes[moduleTypes.outPaint],
    cmsTypes[moduleTypes.banner],
    cmsTypes[moduleTypes.useCaseMenu],
  ]);

export { getStaticProps };
