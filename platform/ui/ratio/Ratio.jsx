import styles from './Ratio.module.scss';

const noop = () => {};
const emptyRatioList = [];
const defaultRatio = { w: 16, h: 9 };

const ratioTypes = {
  DEFAULT: 'default',
  GERY: 'gery',
  GERY_V2: 'gery_v2',
  IMAGE_EXTENDER: 'image_extender',
};

const ratioTitleTypes = {
  DEFAULT: 'default',
  GERY: 'gery',
};

function optionLabel(item) {
  if (item?.w && item?.h) return `${item.w}:${item.h}`;
  return item?.name || item?.name_key || item?.id || '';
}

function isSameRatio(option, ratio) {
  if (!option || !ratio) return false;
  if (option.w == null && option.id != null) return option.id === ratio.id;
  return option.w === ratio.w && option.h === ratio.h;
}

// The icon inside each option is a plain rectangle sized to the option's own
// w:h so it visually reads as that ratio, scaled to fill its box on whichever
// axis is shorter (same idea as `object-fit: contain`) rather than a
// per-ratio hand-picked padding value.
function shapeStyle(item) {
  const w = Number(item?.w) || 1;
  const h = Number(item?.h) || 1;
  return h > w ? { width: `${(w / h) * 100}%`, height: '100%' } : { width: '100%', height: `${(h / w) * 100}%` };
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
                <span className={styles.ratioShape}>
                  <span
                    className={`${styles.ratioBorder} ${active ? styles.ratioBorderActive : ''} ${styles[variant]}`}
                    style={shapeStyle(item)}
                  />
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
