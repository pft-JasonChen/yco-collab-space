import styles from './module-name.module.scss';
import { useSelector } from 'react-redux';
import { moduleTypes } from '@/utils/moduleTypes';
import useWindowDevice from '@/hooks/use-window-device';
import routerUtils from '@/utils/routerUtils';
import ButtonWrapper from '@/components/common/button-wrapper';
import { getTranslationFunction } from '@/i18n';
import { useRouter } from 'next/router';
import InfoPopup from '@/components/result-page/video-object-remover/components/info-popup';
import useModuleName from '@/components/common/module-name/use-module-name';

export default function ModuleName() {
  const { t, locale } = getTranslationFunction();
  const router = useRouter();
  const { isDesktop } = useWindowDevice();
  const {
    canShowModuleName,
    moduleName,
    moduleType,
    autoOpen,
    handleAutoOpenClose,
  } = useModuleName();

  if (!canShowModuleName) return null;

  return (
    <>
      <div
        className={`${styles.container} ${
          !isDesktop && moduleType === moduleTypes.imageConverter
            ? styles.padding
            : ''
        }`}
      >
        <div>{moduleName}</div>
        {moduleType === moduleTypes.videoObjRemover && (
          <InfoPopup
            autoOpen={autoOpen}
            onAutoOpenClose={handleAutoOpenClose}
          />
        )}
      </div>
      <div>
        {!isDesktop && moduleType === moduleTypes.imageConverter && (
          <ButtonWrapper
            className={`${styles.batch} ${
              locale === 'de' ? styles.deBatch : ''
            }`}
            hoverClass="hover-with-border-15171f"
            touchClass="touch-with-border-15171f"
            onClick={() => routerUtils.push(router, '/image-converter/batch')}
          >
            {t('result.button.batch')}
          </ButtonWrapper>
        )}
      </div>
    </>
  );
}
