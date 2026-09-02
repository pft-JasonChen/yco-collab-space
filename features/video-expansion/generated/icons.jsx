/**
 * Feature-owned placeholder glyphs. RD replaces these with its own icon assets;
 * they exist so the prototype does not depend on an icon collection that the
 * Design Library has not published yet.
 */
import styles from './icons.module.scss';

const paths = {
  play: <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />,
  pause: <><path d="M4 3h3v10H4z" fill="currentColor" /><path d="M9 3h3v10H9z" fill="currentColor" /></>,
  upload: <><path d="M8 11V3m0 0L5 6m3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M3 10v3h10v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  trim: <><path d="m4 3 8 8M12 3 4 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="3.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="12.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /></>,
  video: <><rect x="2.5" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="m10.5 7 3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.4" /></>,
  warning: <><path d="M8 2.5 14 13H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" /><path d="M8 6v3.2M8 11.2v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
};

export default function Icon({ name, size = 16 }) {
  return (
    <svg className={styles.icon} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {paths[name] ?? paths.video}
    </svg>
  );
}
