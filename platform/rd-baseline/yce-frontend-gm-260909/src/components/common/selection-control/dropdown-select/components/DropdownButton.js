import styles from './DropdownButton.module.scss';
import { dropDownSelectTypes } from '../../utils/selectionControlTypes';
import ModelIcon from './ModelIcon';

const DefaultButton = ({ item, variant, onClick, triggerProps }) => (
  <div
    className={`${styles.menuButton} ${styles[variant]}`}
    onClick={onClick}
    {...triggerProps}
  >
    <div className={styles.currentSelectText}>{item.text}</div>
    <img
      className={styles.iconDown}
      src="/assets/images/icon_down_4prompt.svg"
      alt=""
    />
  </div>
);

const CurrencyButton = ({ item, variant, onClick, triggerProps }) => (
  <div
    className={`${styles.menuButton} ${styles[variant]}`}
    onClick={onClick}
    {...triggerProps}
  >
    <img
      src="/assets/images/currency/currency.png"
      alt=""
      className={`${styles.currentSelectIcon} ${styles[variant]}`}
    />

    <div className={`${styles.currentSelectText} ${styles[variant]}`}>
      {item.text}
    </div>
  </div>
);

const AiModelButton = ({ item, variant, onClick, isActive, triggerProps }) => (
  <div
    className={`${styles.menuButton} ${styles[variant]}`}
    onClick={onClick}
    {...triggerProps}
  >
    <div className={styles.menuContentForTextToImageAIModel}>
      <ModelIcon
        src={item.icon}
        className={`${styles.currentSelectIcon} ${styles[variant]}`}
      />
      <div>
        <div className={`${styles.currentSelectText} ${styles[variant]}`}>
          {item.text}
          {item.discountPercentage > 0 && (
            <span className={styles.discountTag}>
              {item.discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>
    </div>
    <img
      src="/assets/images/txt2Img/ico_c_arraow.png"
      alt=""
      className={`${styles.arrowIcon} ${styles[variant]}`}
      data-isactive={isActive}
    />
  </div>
);

// Same two-line trigger as the AI-model button minus the avatar — the enhance
// modes have no artwork, only a name and a one-line description.
const EnhanceModeButton = ({
  item,
  variant,
  onClick,
  isActive,
  triggerProps,
}) => (
  <div
    className={`${styles.menuButton} ${styles[variant]}`}
    onClick={onClick}
    {...triggerProps}
  >
    <div className={styles.stackedText}>
      <div className={`${styles.currentSelectText} ${styles[variant]}`}>
        {item.text}
      </div>
      {!!item.desc && (
        <div className={`${styles.currentSelectDesc} ${styles[variant]}`}>
          {item.desc}
        </div>
      )}
    </div>
    <img
      src="/assets/images/txt2Img/ico_c_arraow.png"
      alt=""
      className={`${styles.arrowIcon} ${styles[variant]}`}
      data-isactive={isActive}
    />
  </div>
);

const DISPLAY_MAP = {
  [dropDownSelectTypes.DEFAULT]: DefaultButton,
  [dropDownSelectTypes.CURRENCY]: CurrencyButton,
  [dropDownSelectTypes.TEXT_TO_IMAGE_AI_MODEL]: AiModelButton,
  [dropDownSelectTypes.ENHANCE_MODE]: EnhanceModeButton,
};

/**
 * The trigger button component for the dropdown menu (Dynamic Display Component).
 * Automatically resolves and renders the corresponding button style based on the provided `uiType`.
 *
 * @param {Object} props - The component props.
 * @param {string} props.uiType - Determines the button's style type (should be a value from `dropDownSelectTypes`).
 * @param {Object} props.item - The currently selected item data.
 * @param {string} props.item.text - The text to display on the button.
 * @param {string} [props.item.icon] - The image path for the button's icon (required for AI or Currency variants).
 * @param {string|number} [props.item.model] - The unique identifier bound to the DOM `id` attribute.
 * @param {number} [props.item.discountPercentage=0] - The discount percentage to display (if > 0, shows a discount badge).
 * @param {string} [props.variant='DEFAULT'] - The variant string used to apply specific CSS classes.
 * @param {function(React.MouseEvent<HTMLDivElement>): void} props.onClick - Callback function executed when the button is clicked.
 * @param {boolean} [props.isActive=false] - Indicates whether the dropdown is open (used for visual effects like arrow rotation).
 * @returns {JSX.Element} The dynamically resolved UI button component.
 */
export const DropdownButton = ({ uiType, ...props }) => {
  const TargetButton = DISPLAY_MAP[uiType] || DefaultButton;
  return <TargetButton {...props} />;
};
