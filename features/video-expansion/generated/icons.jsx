/**
 * Feature-owned placeholder glyphs. RD replaces these with its own icon assets;
 * they exist so the prototype does not depend on an icon collection that the
 * Design Library has not published yet.
 */
import styles from './icons.module.scss';
// Icon-font swap for upload/video (2026-09-06): this file is features/*/generated/**,
// normally agent-only via the prototype-update regeneration path rather than a
// direct hand-edit — Designer previewed this in-place and approved keeping it,
// so it's applied directly here rather than reverted. Flag to RD that
// generation.json's provenance record for this feature won't reflect this change
// until it's reconciled through prototype-update.
import '../../../design-library/assets/font/yco-interface-icons.style.css';

const paths = {
  play: <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />,
  pause: <><path d="M4 3h3v10H4z" fill="currentColor" /><path d="M9 3h3v10H9z" fill="currentColor" /></>,
  trim: <><path d="m4 3 8 8M12 3 4 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="3.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="12.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /></>,
  warning: <><path d="M8 2.5 14 13H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" /><path d="M8 6v3.2M8 11.2v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
};

export default function Icon({ name, size = 16 }) {
  // See the import comment above — upload/video render via the yco-interface-icons
  // icon font instead of their old hand-drawn SVG path. `video` uses icon-ic-video-2
  // (a camcorder glyph) rather than icon-ic-video (a clapperboard) — closer match
  // to the original hand-drawn shape, per Designer's side-by-side comparison.
  if (name === 'upload') {
    return <i className="icon-ic-upload" aria-hidden="true" style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }} />;
  }
  if (name === 'video') {
    return <i className="icon-ic-video-2" aria-hidden="true" style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }} />;
  }
  return (
    <svg className={styles.icon} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
