import styles from './index.module.scss';
import { useMemo, useRef } from 'react';
import useWindowDevice from '@/hooks/use-window-device';
import { getTranslationFunction } from '@/i18n';
import gtmElementIdUtils from '@/utils/gtmElementIdUtils';
import DragScrollWrapper from '@/components/common/drag-scroll-wrapper';
import CropOptions from '../../../data/crop-options';
import _get from 'lodash/get';

export default function Ratio(props) {
  const { settingState, setSettingState, settingsRef } = props;
  const { cropOption } = settingState;
  const dragRef = useRef(null);
  const { t } = getTranslationFunction();

  const handleClick = (cropOption) => {
    if (dragRef.current.moved) return;
    setSettingState((ps) => ({ ...ps, cropOption }));
  };

  const getOptionText = (option) => {
    if (option.text) {
      return t(`crop.options.${option.text}`);
    } else {
      return `${option.w}:${option.h}`;
    }
  };

  return (
    <>
      <div ref={settingsRef} className={`${styles.settings} hidden-scrollbar`}>
        <DragScrollWrapper
          ref={dragRef}
          wrapperClass={styles.options}
          enableDrag={{ x: true, y: true }}
        >
          {CropOptions.map((option, idx) => (
            <div key={idx} className={styles.outerWrapper}>
              <div
                id={gtmElementIdUtils.getRatioElementID(option)}
                className={`${styles.option} ${
                  cropOption === idx ? styles.optionActive : ''
                }`}
                onClick={() => handleClick(idx)}
              >
                <div className={styles.imageWrapper}>
                  <CropOptionImage
                    option={option}
                    isActive={cropOption === idx}
                  />
                </div>
                <div className={styles.text}>{getOptionText(option)}</div>
              </div>
            </div>
          ))}
        </DragScrollWrapper>
      </div>
    </>
  );
}

const CropOptionImage = (props) => {
  const { option, isActive } = props;
  const { isDesktop } = useWindowDevice();

  const imgSrc = useMemo(() => {
    if (!option.src) {
      return null;
    } else if (isActive && isDesktop) {
      return _get(option, 'activeSrc.desktop');
    } else if (isActive) {
      return _get(option, 'activeSrc.mobile');
    } else {
      return _get(option, 'src');
    }
  }, [option, isActive, isDesktop]);

  const shouldApplyRectangle = option.key !== 'thumbnail';

  return (
    <div className={styles.padding} style={{ padding: option.padding }}>
      <div
        className={`${shouldApplyRectangle ? styles.rectangle : ''} ${
          isActive && shouldApplyRectangle ? styles.rectangleActive : ''
        }`}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            className={styles.cropImage}
            alt=""
            draggable={false}
          />
        )}
      </div>
    </div>
  );
};
