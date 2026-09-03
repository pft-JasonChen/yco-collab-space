import styles from './index.module.scss';
import { getTranslationFunction } from '@/i18n';
import gtmElementIdUtils from '@/utils/gtmElementIdUtils';
import { ratioTitleTypes, ratioTypes } from './utils/ratioTypes';
import ratioUtils from './utils/ratioUtils';
import { useMemo } from 'react';
import _size from 'lodash/size';

export default function Ratio(props) {
  const {
    ratioList = [],
    ratio = { w: 16, h: 9 },
    setRatio = () => {},
    title,
    titleLabel = 'text.to.image.settings.advance.settings.aspect.ratio',
    extraFunction = () => {},
    variant = ratioTypes.DEFAULT,
    titleVariant = ratioTitleTypes.DEFAULT,
  } = props;

  const { t } = getTranslationFunction();

  const isActive = (item) => ratioUtils.isSameRatio(item, ratio);

  const handleClick = (item) => {
    setRatio({
      w: item.w,
      h: item.h,
      id: item.id,
      name_key: item.name_key,
      ratioId: item.name_key || item.ratioId,
    });
    extraFunction?.(item);
  };

  // 新增tabs長度的styles
  // 只分兩總類 <=2 和 >2
  const tabsLengthClass = useMemo(() => {
    if (_size(ratioList) <= 2) {
      return styles.twoOrLess;
    } else {
      return styles.moreThanTwo;
    }
  }, [ratioList]);

  return (
    <div className={styles.container}>
      <div className={`${styles.title} ${styles[titleVariant]}`}>
        {title || t(titleLabel)}
      </div>
      <div
        className={`${styles.content} ${styles[variant]} ${tabsLengthClass} `}
      >
        {ratioList.map((item, idx) => {
          const isActiveItem = isActive(item);

          return (
            <div
              key={idx}
              id={gtmElementIdUtils.getRatioElementID({ w: item.w, h: item.h })}
              className={`${styles.ratioContainer} ${
                isActiveItem ? styles.ratioContainerActive : ''
              } ${styles[variant]}`}
              onClick={() => handleClick(item)}
            >
              <div className={`${styles.ratioWrapper} ${styles[variant]}`}>
                <div
                  className={styles.ratioPadding}
                  style={{ padding: item.padding }}
                >
                  <div
                    className={`${styles.ratioBorder} ${
                      isActiveItem ? styles.ratioBorderActive : ''
                    } ${styles[variant]}`}
                  />
                </div>
              </div>
              <div className={styles.ratioText}>
                {item?.w && item?.h
                  ? `${item.w}:${item.h}`
                  : item.name || item.name_key}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
