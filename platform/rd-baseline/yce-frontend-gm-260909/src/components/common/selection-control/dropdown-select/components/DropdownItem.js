import styles from './DropdownItem.module.scss';
import { dropDownSelectTypes } from '../../utils/selectionControlTypes';
import ModelIcon from './ModelIcon';

const DefaultItem = ({ item, onSelect, optionProps }) => (
  <div className={styles.menuItem} onClick={onSelect} {...optionProps}>
    {item.name}
  </div>
);

const AiModelItem = ({
  item,
  variant,
  isSelected,
  onSelect,
  showTag,
  optionProps,
}) => (
  <div className={styles.menuItemContainer} onClick={onSelect} {...optionProps}>
    <div className={styles.menuItemWrapper}>
      <div className={`${styles.menuItem} ${styles[variant]}`}>
        <ModelIcon
          src={item.icon}
          className={`${styles.currentSelectIcon} ${styles[variant]}`}
        />
        <div className={styles.menuItemContentForTextToImageAIModel}>
          <div className={styles.modelName}>
            {item.name}
            {item.discountPercentage > 0 && (
              <span className={styles.discountTag}>
                {item.discountPercentage}% OFF
              </span>
            )}
          </div>
          <div className={styles.description}>{item.description}</div>
          {showTag && item.tags?.[0]?.tag_label && (
            <div className={styles.modelTag}>{item.tags[0].tag_label}</div>
          )}
        </div>
      </div>

      {isSelected && (
        <img
          src="/assets/images/pricing/circletick.svg"
          alt=""
          className={`${styles.checkIcon} ${styles[variant]}`}
        />
      )}
    </div>
  </div>
);

// Name + description + check mark on the active mode (P1-S2), no avatar.
const EnhanceModeItem = ({
  item,
  variant,
  isSelected,
  onSelect,
  optionProps,
}) => (
  <div
    className={`${styles.menuItemContainer} ${styles[variant]}`}
    data-selected={!!isSelected}
    onClick={onSelect}
    {...optionProps}
  >
    <div className={styles.menuItemWrapper}>
      <div className={`${styles.menuItem} ${styles[variant]}`}>
        <div className={styles.menuItemContentForTextToImageAIModel}>
          <div className={styles.modelName}>{item.name}</div>
          <div className={styles.description}>{item.description}</div>
        </div>
      </div>
      {isSelected && (
        <img
          src="/assets/images/pricing/circletick.svg"
          alt=""
          className={`${styles.checkIcon} ${styles[variant]}`}
        />
      )}
    </div>
  </div>
);

const DISPLAY_MAP = {
  [dropDownSelectTypes.DEFAULT]: DefaultItem,
  [dropDownSelectTypes.TEXT_TO_IMAGE_AI_MODEL]: AiModelItem,
  [dropDownSelectTypes.ENHANCE_MODE]: EnhanceModeItem,
};

/**
 * The individual option item component for the dropdown list (Dynamic Display Component).
 * Automatically resolves and renders the corresponding item style based on the provided `uiType`.
 *
 * @param {Object} props - The component props.
 * @param {string} props.uiType - Determines the item's style type (should be a value from `dropDownSelectTypes`).
 * @param {Object} props.item - The data for this specific dropdown option. Can be a string for default items or an object for complex variants.
 * @param {string} [props.item.name] - The name/title to display (required for AI model variant).
 * @param {string} [props.item.description] - The description text (required for AI model variant).
 * @param {Array<{tag: string, tag_key: string, tag_label: string}>} [props.item.tags] - MSR tags (`tag` identifier, `tag_key` i18n key, `tag_label` resolved by msrUtils); only `tags[0].tag_label` is rendered.
 * @param {boolean} [props.showTag=false] - Opt-in: render the MSR tag under the description.
 * @param {string} [props.item.icon] - The image path for the item's icon (required for AI model variant).
 * @param {number} [props.item.discountPercentage=0] - The discount percentage to display (if > 0, shows a discount badge).
 * @param {string} [props.variant='DEFAULT'] - The variant string used to apply specific CSS classes.
 * @param {boolean} [props.isSelected=false] - Indicates whether this item is currently selected (used to show a checkmark icon).
 * @param {function(React.MouseEvent<HTMLDivElement>): void} props.onSelect - Callback function executed when the item is clicked to select it.
 * @returns {JSX.Element} The dynamically resolved UI item component.
 */
export const DropdownItem = ({ uiType, ...props }) => {
  const TargetItem = DISPLAY_MAP[uiType] || DefaultItem;
  return <TargetItem {...props} />;
};
