import MyGalleryPage from '@/components/my-gallery-page';
import Layout from '@/components/common/Layout';
import { getCMSStaticProps } from '@/preprocess';
import { cmsTypes } from '@/utils/cmsTypes';
import { moduleTypes } from '@/utils/moduleTypes';
import _get from 'lodash/get';
import seoUtils from '@/utils/seoUtils';
import { getTranslationFunction } from '@/i18n';

export default function Gallery(props) {
  const { publicDomain, cmsContent, cmsGridModule, cmsUseCaseMenu, isReady } =
    props;
  const _pageMeta = {
    title: 'YouCam Enhance | Best AI Photo Enhancer to Upgrade Any Photo',
    description:
      'Best online AI photo enhancer to sharpen, unblur, and upscale images instantly in 2023.',
    url: `${publicDomain}`,
    path: `account/gallery`,
    locale: props?.locale || 'en-us',
  };

  const locale = _get(props, 'locale', 'en-us');
  const { t } = getTranslationFunction(locale);
  const pageMeta = seoUtils.getPageMeta({
    locale,
    url: publicDomain,
    pathname: _pageMeta.path,
    cmsContent: props.cmsContent,
    seoDefault: {
      title: t('seo.default.gallery.title'),
      description: t('seo.default.gallery.description'),
    },
  });

  return (
    <>
      <Layout pageMeta={pageMeta} isReady={isReady}>
        <MyGalleryPage
          cmsGridModule={cmsGridModule}
          cmsUseCaseMenu={cmsUseCaseMenu}
        />
      </Layout>
    </>
  );
}

const getStaticProps = (props) =>
  getCMSStaticProps(props, [
    cmsTypes[moduleTypes.gridModule],
    cmsTypes[moduleTypes.useCaseMenu],
  ]);

export { getStaticProps };
