import { createContext, useContext, useEffect, useState } from 'react';
import checkIconSrc from '../../../design-library/assets/icon/yco-home-gallery/images__icon_check_thumbnail_w.svg';
import styles from './DataTable.module.scss';

/**
 * The guideline table, built from Figma Guideline_YCO_2025 node 14892:36402
 * (Table column / Table heading cell / Table data cell / Checkbox).
 *
 * There is no RD counterpart: RD's gallery has no table view at all, and the two
 * tables that existed before this component — a library list view and a Trash
 * table — were separate ad-hoc grids in one feature's stylesheet with different
 * row heights, paddings and header weights. This is the single structure both
 * now use.
 *
 * It is a CSS grid rather than a `<table>`: the columns have to stay aligned
 * between the header and every row while a row's cells carry arbitrary content
 * (a thumbnail with two lines of text, a menu, a countdown). Table semantics are
 * supplied through explicit `role` attributes so assistive technology still
 * reads it as a table.
 */

const defaultLabels = {
  selectAll: 'Select all',
  selectRow: 'Select row',
};

const NARROW_QUERY = '(max-width: 768px)';

// Columns are declared once and drive both the header and the grid track list,
// so a row can never fall out of step with its own headings. A column marked
// `narrowHidden` drops out of the track list below the tablet breakpoint rather
// than being squeezed, which is what the two previous tables did by hand.
function trackList(columns, { selectable, narrow }) {
  const tracks = columns
    .filter((column) => !(narrow && column.narrowHidden))
    .map((column) => column.width ?? 'minmax(0, 1fr)');
  return [selectable ? 'auto' : null, ...tracks].filter(Boolean).join(' ');
}

/* The track list is a computed value, so it has to reach the DOM as an inline
   style: a component-local custom property would read as an undeclared token to
   the token policy, which only knows RD's set. That rules out a media query for
   the narrow variant too, so the breakpoint is read with matchMedia and the
   right list is applied directly — the same way this codebase's other
   viewport-dependent components resolve theirs. */
const TableContext = createContext({ template: undefined });

function useNarrow() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(NARROW_QUERY);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return narrow;
}

/**
 * The 24px square from the Figma Checkbox component. Rendered as a real
 * `<input type="checkbox">` behind a styled box so it stays focusable and
 * announceable; the tick is the design library's own white check glyph.
 */
export function TableCheckbox({ checked = false, onChange, ariaLabel, testId, className = '' }) {
  return (
    <label className={`${styles.checkboxLabel} ${className}`.trim()}>
      <input
        type="checkbox"
        className={styles.nativeCheckbox}
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        data-testid={testId}
      />
      <span className={styles.checkbox} data-checked={String(checked)} aria-hidden="true">
        <img className={styles.checkboxTick} src={checkIconSrc} alt="" />
      </span>
    </label>
  );
}

/**
 * The Figma "Avatar" column: a 40px media square, a primary line and an optional
 * secondary line. The avatar's 48px radius becomes the 8px corner this product's
 * thumbnails use, because the thing pictured is a piece of media, not a person.
 */
export function TableMediaCell({
  thumbnail,
  primary,
  secondary,
  primaryTestId,
  secondaryTestId,
  className = '',
  ...cellProps
}) {
  return (
    <TableCell className={`${styles.mediaCell} ${className}`.trim()} {...cellProps}>
      <span
        className={styles.mediaThumbnail}
        data-testid="row-thumbnail"
        style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined}
      />
      <span className={styles.mediaText}>
        <span className={styles.mediaPrimary} data-testid={primaryTestId}>
          {primary}
        </span>
        {secondary != null && secondary !== '' && (
          <span className={styles.mediaSecondary} data-testid={secondaryTestId}>
            {secondary}
          </span>
        )}
      </span>
    </TableCell>
  );
}

export function TableCell({ align = 'start', children, className = '', ...cellProps }) {
  return (
    <span className={`${styles.cell} ${className}`.trim()} role="cell" data-align={align} {...cellProps}>
      {children}
    </span>
  );
}

/** Right-aligned icon-button run from the Figma "Action icons" data cell. */
export function TableActionsCell({ children, className = '', ...cellProps }) {
  return (
    <TableCell align="end" className={`${styles.actionsCell} ${className}`.trim()} {...cellProps}>
      {children}
    </TableCell>
  );
}

/* The bundler inlines a small SVG as a data: URI, and those carry parentheses
   and quotes of their own. An unquoted url() token therefore fails to parse and
   the whole declaration is dropped silently — which renders as a filled square,
   since the background colour survives and the mask does not. Quoting it, with
   any double quote percent-encoded, is what makes both forms of the asset URL
   safe. */
function maskUrl(source) {
  return `url("${String(source).replace(/"/g, '%22')}")`;
}

/** A 42px icon button, the unit the Figma action cell repeats. */
export function TableIconButton({ icon, label, onClick, disabled = false, testId, tone = 'neutral' }) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      data-tone={tone}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={testId}
    >
      {typeof icon === 'string' ? (
        <span
          className={styles.iconGlyph}
          style={{ maskImage: maskUrl(icon), WebkitMaskImage: maskUrl(icon) }}
        />
      ) : (
        icon
      )}
    </button>
  );
}

export function TableRow({
  selectable = false,
  selected = false,
  onToggleSelect,
  selectLabel,
  selectTestId,
  children,
  className = '',
  ...rowProps
}) {
  const { template } = useContext(TableContext);

  return (
    <div
      className={`${styles.row} ${className}`.trim()}
      role="row"
      style={{ gridTemplateColumns: template }}
      data-selected={selectable ? String(selected) : undefined}
      {...rowProps}
    >
      {selectable && (
        <TableCell className={styles.selectCell}>
          <TableCheckbox
            checked={selected}
            onChange={onToggleSelect}
            ariaLabel={selectLabel}
            testId={selectTestId}
          />
        </TableCell>
      )}
      {children}
    </div>
  );
}

export default function DataTable({
  columns = [],
  selectable = false,
  allSelected = false,
  onToggleAll,
  labels = {},
  children,
  className = '',
  testId,
  ...tableProps
}) {
  const copy = { ...defaultLabels, ...labels };
  const narrow = useNarrow();
  const template = trackList(columns, { selectable, narrow });

  return (
    <TableContext.Provider value={{ template }}>
      <div
        className={`${styles.table} ${className}`.trim()}
        role="table"
        data-component-role="data-table"
        data-narrow={narrow ? 'true' : undefined}
        data-testid={testId}
        {...tableProps}
      >
        <div
          className={styles.head}
          role="row"
          data-component-role="data-table-head"
          style={{ gridTemplateColumns: template }}
        >
          {selectable && (
            <span className={`${styles.headCell} ${styles.selectCell}`} role="columnheader">
              <TableCheckbox
                checked={allSelected}
                onChange={onToggleAll}
                ariaLabel={copy.selectAll}
                testId="table-select-all"
              />
            </span>
          )}
          {columns.map((column) => (
            <span
              key={column.key}
              className={styles.headCell}
              role="columnheader"
              data-align={column.align ?? 'start'}
              data-narrow-hidden={column.narrowHidden ? 'true' : undefined}
            >
              {/* A column whose heading is not drawn — the action column — still
                  needs a name: a header cell with no text reads as an unlabelled
                  column to a screen reader. `srLabel` supplies one without
                  putting a word above a row of icons. */}
              {column.srLabel ? (
                <span className={styles.srOnly}>{column.srLabel}</span>
              ) : (
                column.label
              )}
            </span>
          ))}
        </div>
        {children}
      </div>
    </TableContext.Provider>
  );
}
