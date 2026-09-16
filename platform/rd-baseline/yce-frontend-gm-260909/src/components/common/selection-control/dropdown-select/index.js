import styles from './index.module.scss';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import _isEmpty from 'lodash/isEmpty';
import { dropDownSelectTypes } from '../utils/selectionControlTypes';
import _get from 'lodash/get';
import _isObject from 'lodash/isObject';
import useClickOutside from './hooks/use-click-outside';
import { DropdownButton } from './components/DropdownButton';
import { DropdownItem } from './components/DropdownItem';
import useItemDiscountEnrichment from './hooks/use-item-discount-enrichment';

// SSR shim: useLayoutEffect on the server emits a console warning.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Trigger-to-menu gap for menuFixed callers (design: 8px).
const MENU_GAP = 8;
// Keep the flipped menu clear of the viewport edge.
const MENU_MARGIN = 8;

const DropDownSelect = (props) => {
  const {
    dropDownSelectList = [],
    dropDownSelectIndex,
    setDropDownSelectIndex,
    extraSetDropDownSelectIndexFunc = () => {},
    isActive,
    setIsActive,
    toggleDropdown,
    dropdownPosition = 'down',
    currentSelectUI = dropDownSelectTypes.DEFAULT,
    variant = dropDownSelectTypes.DEFAULT,
    showTag = false,
    // Opt-in: pin the menu with position:fixed at the trigger instead of
    // position:absolute. Needed when an ancestor is a scroll container, which
    // clips an absolute menu no matter what z-index it carries (settings
    // panels). Off by default, so existing callers are untouched.
    menuFixed = false,
  } = props;
  const menuRef = useRef(null);
  const menuItemsRef = useRef(null);
  const [fixedStyle, setFixedStyle] = useState(null);

  // Combobox/listbox semantics. The trigger keeps DOM focus and points at the
  // highlighted option via aria-activedescendant, so opening the menu never
  // moves focus and closing it needs no restore.
  const listboxId = useId();
  const optionId = (index) => `${listboxId}-option-${index}`;
  const [activeIndex, setActiveIndex] = useState(-1);

  const enrichedItems = useItemDiscountEnrichment(dropDownSelectList);

  const current = _get(enrichedItems, dropDownSelectIndex, {});
  const text = _isObject(current) ? current.name : current;
  const desc = _get(current, 'description', '');
  const icon = _get(current, 'icon', '');
  const model = _get(current, 'model', current);
  const discountPercentage = _get(current, 'discountPercentage', 0);

  const selectedItem = { text, desc, icon, model, discountPercentage };

  const handleSelect = (index) => {
    setDropDownSelectIndex(index);
    setActiveIndex(index);
    extraSetDropDownSelectIndexFunc();
    setIsActive(false);
  };

  useClickOutside(menuRef, () => setIsActive(false));

  const handleTriggerKeyDown = (event) => {
    const itemCount = enrichedItems.length;
    if (!itemCount) return;

    if (event.key === 'Tab') {
      setIsActive(false);
      return;
    }

    if (event.key === 'Escape') {
      if (isActive) {
        event.preventDefault();
        setIsActive(false);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isActive && activeIndex >= 0) {
        handleSelect(activeIndex);
      } else {
        setIsActive(true);
      }
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    const currentIndex = activeIndex >= 0 ? activeIndex : dropDownSelectIndex;
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, itemCount - 1)
        : Math.max(currentIndex - 1, 0);

    setActiveIndex(nextIndex);
    setIsActive(true);
  };

  // Opening highlights the current selection so ArrowDown starts from there.
  useEffect(() => {
    if (isActive) setActiveIndex(dropDownSelectIndex ?? 0);
  }, [isActive, dropDownSelectIndex]);

  const triggerProps = {
    role: 'combobox',
    tabIndex: 0,
    'aria-haspopup': 'listbox',
    'aria-expanded': !!isActive,
    'aria-controls': listboxId,
    'aria-activedescendant':
      isActive && activeIndex >= 0 ? optionId(activeIndex) : undefined,
    onKeyDown: handleTriggerKeyDown,
  };

  // menuContainer is position:relative and only as tall as the trigger, so its
  // rect IS the trigger's rect. Runs before paint: with a plain effect the
  // browser painted the menu at its CSS position first, so a flipped menu
  // visibly jumped from below the trigger to above it.
  useIsomorphicLayoutEffect(() => {
    if (!menuFixed) return;
    if (!isActive) {
      setFixedStyle(null);
      return;
    }
    const el = menuRef.current;
    if (!el) return;
    const { top, bottom, left, width } = el.getBoundingClientRect();

    // Flip above the trigger when the menu would run past the viewport — near
    // the bottom of a phone screen the list would otherwise be cut off. Only
    // flips if there is actually more room up there.
    const menuHeight = menuItemsRef.current?.offsetHeight || 0;
    const spaceBelow = window.innerHeight - bottom - MENU_GAP - MENU_MARGIN;
    const spaceAbove = top - MENU_GAP - MENU_MARGIN;
    const flipUp = menuHeight > spaceBelow && spaceAbove > spaceBelow;

    setFixedStyle({
      position: 'fixed',
      top: flipUp
        ? `${Math.max(MENU_MARGIN, top - MENU_GAP - menuHeight)}px`
        : `${bottom + MENU_GAP}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${Math.max(spaceBelow, spaceAbove)}px`,
      marginTop: 0,
    });
  }, [menuFixed, isActive]);

  if (_isEmpty(dropDownSelectList)) {
    return (
      <div className={`${styles.menuContainer} ${styles[variant]}`}>
        <div
          className={`${styles.menuButton} ${styles[variant]} ${styles.skeleton} shimmer-skeleton`}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.menuContainer} ${styles[variant]}`} ref={menuRef}>
      <DropdownButton
        uiType={currentSelectUI}
        item={selectedItem}
        variant={variant}
        onClick={toggleDropdown}
        isActive={isActive}
        triggerProps={triggerProps}
      />
      <div
        ref={menuItemsRef}
        id={listboxId}
        role="listbox"
        className={`${styles.menuItems} ${isActive ? styles.active : ''} ${
          dropdownPosition === 'up' ? styles.up : ''
        } ${styles[variant]}`}
        style={fixedStyle || undefined}
      >
        {enrichedItems.map((item, index) => (
          <DropdownItem
            key={`dropdown-item-${index}`}
            uiType={currentSelectUI}
            item={item}
            variant={variant}
            showTag={showTag}
            isSelected={index === dropDownSelectIndex}
            onSelect={() => handleSelect(index)}
            optionProps={{
              id: optionId(index),
              role: 'option',
              'aria-selected': index === dropDownSelectIndex,
              'data-keyboard-active': index === activeIndex,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DropDownSelect;
