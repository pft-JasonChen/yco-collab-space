import { useMemo, useRef } from 'react';
import { segmentedControlTypes } from '../../tab-control/utils/tabsTypes';
import styles from './index.module.scss';
import { getTranslationFunction } from '@/i18n';
import _size from 'lodash/size';
import { useSegmentedAutoCols } from './hooks/use-segmented-auto-cols';
import useSegmentedMaxTabWidth from './hooks/use-segmented-max-tab-width';

/**
 * Segmented control component for switching between different tabs.
 * @param {Array} tabs - Array of tab objects with 'key' and 'label'.
 * @param {string} currentTab - The key of the currently active tab.
 * @param {Function} setCurrentTab - Function to update the current tab state.
 * @param {Function} handleTabClick - Function to handle tab click events.
 * @param {string} variant - The style variant of the segmented control ('default' | 'template' | 'black').
 * @param {Function} getValue - Function to extract the tab's value (default: tab.key).
 * @param {Object} customContainerStyle - Custom styles for the container.
 */
const SegmentedControl = ({
  tabs = [],
  currentTab,
  setCurrentTab = () => {},
  handleTabClick = () => {},
  variant = segmentedControlTypes.DEFAULT, // 'default' | 'template' | 'black'
  renderCustomLabel = null,
  customContainerStyle = {},
  getValue = (tab) => tab.key,
  customTabContainerStyle,
  customTabStyle,
  autoTruncate = false,
  equalWidth = false, // Force all tabs to equal width (typically used with BLACK / BLUE_UNDERLINE variants)
  autoCols = false, // Auto 2/3 column layout (typically used with BLUE_ROUNDED_FIXED_WIDTH variant)
}) => {
  const containerRef = useRef(null);
  const tabContainerRef = useRef(null);

  const { t } = getTranslationFunction();

  const canShowTabs = useMemo(() => {
    return !!_size(tabs);
  }, [tabs]);

  // 新增tabs長度的styles
  // 只分兩總類 <=2 和 >2
  // 目前只for variant === 'blue_rounded_fixed_width'使用
  // 其他樣式scss中都沒有使用到這個class
  // const tabsLengthClass = useMemo(() => {
  //   if (_size(tabs) <= 2) {
  //     return styles.twoOrLess;
  //   } else {
  //     return styles.moreThanTwo;
  //   }
  // }, [tabs]);

  const { colsClass, enabled } = useSegmentedAutoCols({
    enabled: autoCols,
    containerRefExternal: containerRef,
    tabContainerRefExternal: tabContainerRef,
  });

  const equalWidthEnabled = !autoTruncate && equalWidth;

  useSegmentedMaxTabWidth({
    enabled: equalWidthEnabled,
    tabContainerRefExternal: tabContainerRef,
    deps: [tabs, t, variant], // tabs/語系/variant 變動時重算
  });

  if (!canShowTabs) return null;
  return (
    <div
      className={`${styles.container} ${styles[variant]}`}
      style={customContainerStyle}
      ref={containerRef}
    >
      <div
        className={`${styles.tabContainer} ${enabled ? colsClass : ''}`}
        ref={tabContainerRef}
        style={customTabContainerStyle}
      >
        {tabs.map((tab) => {
          const value = getValue(tab); // 用 getValue 抽取 tab 的唯一值
          const isActive = value === currentTab;

          return (
            <div
              key={value}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''} ${
                autoTruncate ? 'text-flex-50' : ''
              }`}
              onClick={() => {
                setCurrentTab(value);
                handleTabClick(value, tab);
              }}
              data-key={value}
              style={customTabStyle}
            >
              <div className={`${autoTruncate ? 'text-truncate-1' : ''}`}>
                {renderCustomLabel
                  ? renderCustomLabel({
                      key: value,
                      label: tab.label,
                      t,
                      ...tab,
                    })
                  : t(tab.label)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentedControl;
