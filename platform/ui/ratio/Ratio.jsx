import { ratioTitleTypes, ratioTypes } from './ratioTypes.js';
import styles from './Ratio.module.scss';

const noop = () => {};
const emptyRatioList = [];
const defaultRatio = { w: 16, h: 9 };


function optionLabel(item) {
  if (item?.w && item?.h) return `${item.w}:${item.h}`;
  return item?.name || item?.name_key || item?.id || '';
}

function isSameRatio(option, ratio) {
  if (!option || !ratio) return false;
  if (option.w == null && option.id != null) return option.id === ratio.id;
  return option.w === ratio.w && option.h === ratio.h;
}

export default function Ratio({
  ratioList = emptyRatioList,
  ratio = defaultRatio,
  setRatio = noop,
  title = 'Aspect ratio',
  extraFunction = noop,
  variant = ratioTypes.GERY_V2,
  titleVariant = ratioTitleTypes.GERY,
  disabled = false,
  getOptionTestId,
  optionLabelTestId,
}) {
  const tabsLengthClass = ratioList.length <= 2 ? styles.twoOrLess : styles.moreThanTwo;

  const handleClick = (item) => {
    const nextRatio = {
      w: item.w,
      h: item.h,
      id: item.id,
      name_key: item.name_key,
      ratioId: item.name_key || item.ratioId || item.id,
    };
    setRatio(nextRatio);
    extraFunction(item);
  };

  return (
    <section className={styles.container}>
      <h2 className={`${styles.title} ${styles[titleVariant]}`}>{title}</h2>
      <div className={`${styles.content} ${styles[variant]} ${tabsLengthClass}`}>
        {ratioList.map((item) => {
          const active = isSameRatio(item, ratio);
          const label = optionLabel(item);
          return (
            <button
              className={`${styles.ratioContainer} ${active ? styles.ratioContainerActive : ''} ${styles[variant]}`}
              data-testid={getOptionTestId?.(item)}
              key={item.id || label}
              type="button"
              aria-label={label}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => handleClick(item)}
            >
              <span className={`${styles.ratioWrapper} ${styles[variant]}`} aria-hidden="true">
                <span className={styles.ratioPadding} style={{ padding: item.padding }}>
                  <span className={`${styles.ratioBorder} ${active ? styles.ratioBorderActive : ''} ${styles[variant]}`} />
                </span>
              </span>
              <span className={styles.ratioText} data-testid={optionLabelTestId}>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { ratioTitleTypes, ratioTypes };
