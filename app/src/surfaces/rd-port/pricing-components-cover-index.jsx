import styles from './pricing-components-cover-general.module.scss';
import { useWindowDevice as useWindowDevice } from './pricing-adapters.jsx';
import { useCheckHolidayProduct as useCheckHolidayProduct } from './pricing-adapters.jsx';
import { useHolidayType as useHolidayType } from './pricing-adapters.jsx';
import { HolidayTypes } from './pricing-adapters.jsx';
import { getCoverImageSrc } from './pricing-config-cover-config.jsx';

export default function Cover() {
  const { holidayType } = useHolidayType();
  const { isHolidayMode } = useCheckHolidayProduct();
  const { isMobile } = useWindowDevice();

  const effectiveType = isHolidayMode ? holidayType : HolidayTypes.default;
  const src = getCoverImageSrc(effectiveType, isMobile);

  return <img className={styles.coverImage} src={src} />;
}
