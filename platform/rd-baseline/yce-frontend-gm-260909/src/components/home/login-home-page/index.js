import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useWindowWidth from '@/hooks/use-window-width';
import useCMSContent from '@/hooks/use-cms-content';
import useHandleFile from '../components/hooks/use-handle-file';
import strapiUtils from '@/components/strapi/strapiUtils';
import moduleTypeUtils, { moduleTypes, sodTypes } from '@/utils/moduleTypes';
import { getTranslationFunction } from '@/i18n';
import { cmsTypes } from '@/utils/cmsTypes';
import Layout from '@/components/home/components/layout';
import Strapi from '@/components/strapi';
import GridModuleSection from '@/components/strapi/components/gridmodulesection';
import Headers from '@/components/common/headers';
import SSGHeader from '@/components/common/headers/ssg-header';
import Footer from '@/components/common/footer';
import FilePicker from '../components/file-picker';
import WebBookmarkHint from '../components/web-bookmark-hint';
import {
  setSuccessDialog,
  resetCrossPageState,
} from '@/store/actions/uiAction';
import useGetTheAppButtons from '@/hooks/use-get-the-app-buttons';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import useGA from '@/components/hooks/use-ga';
import useNewestCMS from '@/components/hooks/use-newest-cms';
import useUserStatus from '@/hooks/use-user-status';
import routerUtils from '@/utils/routerUtils';
import { useRouter } from 'next/router';
import { initModuleType } from '@/store/actions/infoAction';

const MODULE_TYPE = moduleTypes.home;

export default function LoginHomePage(props) {
  const {
    cmsFeatureBanner,
    cmsUseCaseMenu,
    cmsGridModule,
    homepageLayoutConfig = null,
  } = props;
  const { cmsContent, isLoaded } = useCMSContent({
    content: props.cmsContent,
    type: cmsTypes[MODULE_TYPE],
  });

  const { isLoaded: appsButtonsLoaded } = useGetTheAppButtons({
    content: cmsContent,
    moduleType: cmsTypes[MODULE_TYPE],
  });
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const router = useRouter();
  const { t, locale } = getTranslationFunction();
  const { featureBannerJson } = useNewestCMS(locale);
  const dispatch = useDispatch();
  const ui = useSelector((state) => state.ui);
  const user = useSelector((state) => state.user);
  const { width } = useWindowWidth();
  const { gaFunctionImpression } = useGA();
  const { isGuest, isLoginUser } = useUserStatus();

  const functionKey = _get(
    cmsContent,
    'attributes.topBanner.buttonLeft.buttonLink',
    '/photo-enhance'
  );

  const pageKeyOrFunctionKeyToModuleType = functionKey
    ? moduleTypeUtils.pageKeyOrFunctionKeyToModuleType(functionKey)
    : moduleTypes.enhance;

  const pageKeyOrFunctionKeyToSodType = functionKey
    ? moduleTypeUtils.pageKeyOrFunctionKeyToSodType(functionKey)
    : sodTypes.remove;

  const { handleInputClick, handleInputFileChange, dropMethods } =
    useHandleFile({
      containerRef,
      moduleType: moduleTypes.enhance, //pageKeyOrFunctionKeyToModuleType,
      sodType: null, //pageKeyOrFunctionKeyToSodType,
    });

  useEffect(() => {
    gaFunctionImpression(MODULE_TYPE);
    setIsMounted(true);
    dispatch(initModuleType(router.pathname));
  }, []);

  useEffect(() => {
    if (!user.checked || !ui.crossPageState) return;
    handleCrossPageStateFromOtherPage();
  }, [user.checked, ui.crossPageState]);

  const handleCrossPageStateFromOtherPage = () => {
    const activeKey = extractCrossPageStateParams();
    if (!activeKey) return;
    const type = toSuccessDialogType(activeKey);
    dispatch(
      setSuccessDialog({
        show: true,
        type,
        originalType: activeKey,
      })
    );
    dispatch(resetCrossPageState());
  };

  const extractCrossPageStateParams = () => {
    const { crossPageState } = ui;
    if (crossPageState?.verified) {
      return 'verified';
    } else if (crossPageState?.passwordChanged) {
      return 'passwordChanged';
    } else if (crossPageState?.forceShowSignInSuccess) {
      return 'forceShowSignInSuccess';
    } else {
      return '';
    }
  };

  const toSuccessDialogType = (type = '') => {
    switch (type) {
      case 'verified':
        return type;
      case 'passwordChanged':
        return 'password.changed';
      case 'forceShowSignInSuccess':
        return 'log.in';
      default:
        return '';
    }
  };

  const toCMSArray = useCallback(() => {
    if (!isLoaded || !cmsContent) {
      return [];
    }
    const gridSections = _get(cmsGridModule, 'attributes.sections');

    if (_isEmpty(gridSections)) {
      return strapiUtils.sectionCombine({
        cmsFeatureBanner: featureBannerJson
          ? featureBannerJson
          : cmsFeatureBanner,
        cmsContent,
        combineTopBanner: true,
        cmsGridModule,
      });
    }

    // `/home` is the login-home route, so its static markup must not depend on
    // the client-only account state (see YCO260721P0007). The standalone
    // feature banner no longer gates on account state (it's always shown on
    // this route), so it's safe to include it here alongside gridModule.
    return strapiUtils.sectionCombine({
      cmsFeatureBanner: featureBannerJson
        ? featureBannerJson
        : cmsFeatureBanner,
      cmsGridModule,
    });
  }, [
    cmsContent,
    isLoaded,
    cmsFeatureBanner,
    cmsGridModule,
    featureBannerJson,
  ]);

  const ctaText = useMemo(() => {
    const buttonLeftTitle = _get(
      cmsContent,
      'attributes.topBanner.buttonLeft.buttonTitle',
      null
    );
    return buttonLeftTitle || t('webtry.home.try.enhance');
  }, [cmsContent]);

  const getFilePickerComponent = () => {
    return {
      dropMethods,
      component: (
        <FilePicker
          fromHomePage={true}
          {...dropMethods}
          handleInputClick={handleInputClick}
          handleInputFileChange={handleInputFileChange}
          buttonText={ctaText}
        />
      ),
    };
  };

  useEffect(() => {
    if (!isGuest) return;
    if (isGuest) {
      routerUtils.replace(router, isLoginUser ? '/home' : '/');
    }
  }, [isGuest]);

  return (
    <Layout>
      {isMounted ? (
        <Headers cmsUseCaseMenu={cmsUseCaseMenu} />
      ) : (
        <SSGHeader locale={locale} />
      )}
      <div ref={containerRef}>
        {toCMSArray().map((s, i) => (
          <div className={`strapiContainer`} key={`home-strapi-sec${i}`}>
            {s.__component === 'gridModule' ? (
              <GridModuleSection
                content={s.attributes}
                layoutVer="1_30_0"
                homepageLayoutConfig={homepageLayoutConfig}
              />
            ) : (
              <Strapi
                content={s}
                width={width}
                productPage="home"
                getFilePickerComponent={getFilePickerComponent}
                homepageLayoutConfig={homepageLayoutConfig}
              />
            )}
          </div>
        ))}
      </div>
      {isMounted && <WebBookmarkHint />}
      <Footer />
    </Layout>
  );
}
