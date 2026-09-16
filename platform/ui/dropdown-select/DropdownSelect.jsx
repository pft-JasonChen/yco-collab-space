import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import useClickOutside from './useClickOutside.js';
import styles from './DropdownSelect.module.scss';

// RD's SSR shim: useLayoutEffect on the server emits a console warning.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// RD's own constants: trigger-to-menu gap, and the margin a flipped menu keeps
// from the viewport edge.
const MENU_GAP = 8;
const MENU_MARGIN = 8;

function Caret({ up }) {
  return (
    <svg
      className={styles.caret}
      width="10"
      height="7"
      viewBox="0 0 10 7"
      fill="none"
      aria-hidden="true"
      data-up={up ? 'true' : undefined}
    >
      <path
        d="M1 1.5 5 5.5 9 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Shared dropdown, ported from RD's common/selection-control/dropdown-select.
 *
 * RD ships one component with four hard-coded display variants (default,
 * currency, AI-model, enhance-mode) plus pricing-discount enrichment, because
 * each caller needed a different row. A shared component cannot carry one
 * caller's row design, so the variant switch is gone and rows are described by
 * data: `label`, optional `description`, and the grouping flags below. What is
 * kept verbatim is the part that is hard to get right and identical everywhere
 * — the combobox/listbox semantics, the keyboard model, close-on-outside-click
 * in the capture phase, and the fixed-position flip.
 *
 * Two modes, because this replaces both a value picker and an action menu:
 * `select` is RD's own listbox (a current value, a tick on it), `menu` is an
 * action menu (no current value, `menu`/`menuitem` roles, every activation
 * closes). RD has no action-menu equivalent — its menus are all value pickers —
 * so this is the one behavioural addition, and it is additive: `select` is the
 * default and behaves as RD's default variant does.
 *
 * @param {object} props
 * @param {{key: string, label: string, description?: string, dividerBefore?: boolean,
 *          groupLabel?: string, destructive?: boolean, disabled?: boolean}[]} props.items
 * @param {string} [props.selectedKey]     select mode: the current value
 * @param {string[]} [props.selectedKeys]   select mode: current values, for a menu that holds
 *        more than one group — a sort field and a sort order in the same list, say. Ticks every
 *        key it contains; `onSelect` still reports one key and the consumer decides which group
 *        it belongs to
 * @param {(key: string) => void} [props.onSelect]
 * @param {'select'|'menu'} [props.mode]
 * @param {string} [props.label]           select mode: prefix shown before the current label
 * @param {React.ReactNode} [props.trigger] replaces the generated trigger content entirely
 * @param {string} [props.ariaLabel]       accessible name; falls back to `label`. A combobox
 *        takes its name from the author rather than its contents, so one of the two is required
 * @param {'start'|'end'} [props.align]    which trigger edge the menu lines up with
 * @param {boolean} [props.menuFixed]      pin the menu with position:fixed; needed inside a scroll container
 * @param {'default'|'plain'|'primary'} [props.variant]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {string} [props.className]
 * @param {string} [props.testId]          consumer's own hook on the trigger
 * @param {string} [props.menuTestId]      consumer's own hook on the open menu
 */
export default function DropdownSelect({
  items,
  selectedKey,
  selectedKeys,
  onSelect,
  mode = 'select',
  label,
  trigger,
  ariaLabel,
  align = 'start',
  menuFixed = false,
  variant = 'default',
  onOpenChange,
  className,
  testId,
  menuTestId,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fixedStyle, setFixedStyle] = useState(null);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const optionId = (index) => `${listId}-option-${index}`;

  const isMenu = mode === 'menu';
  const isChosen = (key) =>
    selectedKeys ? selectedKeys.includes(key) : key === selectedKey;
  const selectedIndex = items.findIndex((item) => isChosen(item.key));
  const current = selectedIndex >= 0 ? items[selectedIndex] : null;

  function change(next) {
    setOpen(next);
    onOpenChange?.(next);
  }

  useClickOutside(rootRef, () => open && change(false));

  function pick(index) {
    const item = items[index];
    if (!item || item.disabled) return;
    setActiveIndex(index);
    change(false);
    onSelect?.(item.key);
  }

  // RD's key handling, with one addition: `menu` mode has no current value, so
  // opening starts the highlight at the first row instead of the selection.
  function onKeyDown(event) {
    if (!items.length) return;

    if (event.key === 'Tab') {
      if (open) change(false);
      return;
    }

    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        change(false);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && activeIndex >= 0) pick(activeIndex);
      else change(true);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : items.length - 1);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    const from = activeIndex >= 0 ? activeIndex : Math.max(selectedIndex, 0);
    const next =
      event.key === 'ArrowDown'
        ? Math.min(from + 1, items.length - 1)
        : Math.max(from - 1, 0);
    setActiveIndex(next);
    change(true);
  }

  // Opening highlights the current selection so ArrowDown starts from there.
  useEffect(() => {
    if (open) setActiveIndex(isMenu ? 0 : Math.max(selectedIndex, 0));
  }, [open, isMenu, selectedIndex]);

  // RD's flip logic, unchanged in substance. The root is position:relative and
  // only as tall as the trigger, so its rect IS the trigger's rect. It runs
  // before paint: with a plain effect the browser painted the menu at its CSS
  // position first, so a flipped menu visibly jumped.
  useIsomorphicLayoutEffect(() => {
    if (!menuFixed) return;
    if (!open) {
      setFixedStyle(null);
      return;
    }
    const element = rootRef.current;
    if (!element) return;

    const { top, bottom, left, right, width } = element.getBoundingClientRect();
    const menuHeight = listRef.current?.offsetHeight || 0;
    const menuWidth = listRef.current?.offsetWidth || width;
    const spaceBelow = window.innerHeight - bottom - MENU_GAP - MENU_MARGIN;
    const spaceAbove = top - MENU_GAP - MENU_MARGIN;
    const flipUp = menuHeight > spaceBelow && spaceAbove > spaceBelow;

    setFixedStyle({
      position: 'fixed',
      top: flipUp
        ? `${Math.max(MENU_MARGIN, top - MENU_GAP - menuHeight)}px`
        : `${bottom + MENU_GAP}px`,
      left: align === 'end' ? `${Math.max(MENU_MARGIN, right - menuWidth)}px` : `${left}px`,
      maxHeight: `${Math.max(spaceBelow, spaceAbove)}px`,
      marginTop: 0,
    });
  }, [menuFixed, open, align]);

  // Rows grouped into runs: a new run starts at a group label or a divider.
  const blocks = [];
  items.forEach((item, index) => {
    const starts = blocks.length === 0 || item.groupLabel || item.dividerBefore;
    if (starts) {
      blocks.push({
        key: `${item.key}-block`,
        label: item.groupLabel,
        dividerBefore: Boolean(item.dividerBefore),
        items: [],
      });
    }
    blocks[blocks.length - 1].items.push({ item, index });
  });

  const triggerContent =
    trigger ??
    (
      <>
        <span className={styles.triggerText}>
          {/* The prefix is a separate span rather than concatenated text: a
              shared component must not bake in a separator character, which is
              punctuation the locale owns. */}
          {label && <span className={styles.triggerLabel}>{label}</span>}
          {current?.label}
        </span>
        <Caret up={open} />
      </>
    );

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      ref={rootRef}
      data-component-role="dropdown-select"
      data-mode={mode}
    >
      <button
        type="button"
        className={styles.trigger}
        data-variant={variant}
        data-open={String(open)}
        data-testid={testId}
        aria-label={ariaLabel ?? label}
        aria-haspopup={isMenu ? 'menu' : 'listbox'}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={!isMenu && open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        role={isMenu ? undefined : 'combobox'}
        onClick={() => change(!open)}
        onKeyDown={onKeyDown}
      >
        {triggerContent}
      </button>

      <div
        ref={listRef}
        id={listId}
        role={isMenu ? 'menu' : 'listbox'}
        data-testid={menuTestId}
        className={styles.list}
        data-align={align}
        data-open={String(open)}
        style={fixedStyle || undefined}
        hidden={!open}
      >
        {/* A listbox may only own options and groups, so a divider or a group
            label cannot sit as its direct child — axe reports that as a
            critical aria-required-children failure, which is how this was
            found. Each run of rows is wrapped instead: a labelled run becomes a
            real `group` carrying the label as its accessible name, and the
            divider is the wrapper's own border rather than an element. */}
        {blocks.map((block, blockIndex) => (
          <div
            key={block.key}
            className={styles.block}
            role={block.label ? 'group' : 'presentation'}
            aria-label={block.label || undefined}
            data-divider={block.dividerBefore && blockIndex > 0 ? 'true' : undefined}
          >
            {block.label && (
              <div className={styles.groupLabel} data-component-role="dropdown-group" aria-hidden="true">
                {block.label}
              </div>
            )}
            {block.items.map(({ item, index }) => {
              const selected = !isMenu && isChosen(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  id={optionId(index)}
                  role={isMenu ? 'menuitem' : 'option'}
                  aria-selected={isMenu ? undefined : selected}
                  className={styles.option}
                  data-selected={String(selected)}
                  data-keyboard-active={String(index === activeIndex)}
                  data-destructive={item.destructive ? 'true' : undefined}
                  data-menu-position={index === items.length - 1 ? 'last' : undefined}
                  data-option-key={item.key}
                  disabled={item.disabled}
                  tabIndex={-1}
                  onClick={() => pick(index)}
                >
                  <span className={styles.optionBody}>
                    <span className={styles.optionLabel}>{item.label}</span>
                    {item.description && (
                      <span className={styles.optionDescription}>{item.description}</span>
                    )}
                  </span>
                  {selected && (
                    <span className={styles.tick} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
