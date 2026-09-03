import { Fragment, useState, useEffect, useRef } from 'react';
import styles from './index.module.scss';
import { getTranslationFunction } from '@/i18n';
import { moduleTypes } from '@/utils/moduleTypes';

// `group` is presentational only (which group header this option renders
// under) — createFilterByType (use-video-history.js) still matches purely by
// `value`, so it's inert for filtering itself.
const FILTER_OPTIONS = [
  { label: 'text.to.image.settings.styles.all', value: 'all' },
  {
    label: 'header.items.product.ai.video.generator',
    value: moduleTypes.img2Vid,
    group: 'video',
  },
  {
    label: 'header.items.product.ai.text.to.video.generator',
    value: moduleTypes.textToVideo,
    group: 'video',
  },
  {
    label: 'header.items.product.video.enhancer.ai',
    value: moduleTypes.videoSr,
    group: 'video',
  },
  {
    label: 'header.items.product.face.swap',
    value: moduleTypes.faceSwapVid,
    group: 'video',
  },
  {
    label: 'header.items.product.ai.video.filters',
    value: moduleTypes.aiVideoFilters,
    group: 'video',
  },
  {
    label: 'header.items.product.video.object.remover',
    value: moduleTypes.videoObjRemover,
    group: 'video',
  },
  {
    label: 'header.items.product.ai.video.editor',
    value: moduleTypes.aiVideoEditor,
    group: 'video',
  },
  {
    label: 'header.items.product.ai.motion.transfer',
    value: moduleTypes.characterMotionSwap,
    group: 'video',
  },
  {
    label: 'header.items.product.video.template',
    value: moduleTypes.videoTemplate,
    group: 'video',
  },
  {
    label: 'header.items.product.image.template',
    value: moduleTypes.imageTemplate,
    group: 'image',
  },
];

// Reusing existing generic labels (same pattern as FILTER_OPTIONS' own "all"
// entry borrowing `text.to.image.settings.styles.all`) rather than adding
// new keys for two plain words already translated elsewhere.
const GROUP_LABELS = {
  video: 'product.page.ai.api.tab.video',
  image: 'product.page.ai.api.tab.image',
};

const FilterDropdown = ({
  value,
  onChange,
  isNeedCentered,
  isNeedRightPadding,
  isNeedBottomMargin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const optionsRef = useRef(null);

  const { t } = getTranslationFunction();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compensate for .dropdown's position for I2V to center .options on viewport
  useEffect(() => {
    if (isOpen && isNeedCentered && dropdownRef.current && optionsRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const offsetX = dropdownRect.left;
      optionsRef.current.style.setProperty(
        '--dropdown-offset-x',
        `${offsetX}px`
      );
    }
  }, [isOpen, isNeedCentered]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = FILTER_OPTIONS.find((opt) => opt.value === value);

  return (
    <div
      className={`${styles.dropdown} 
      ${isNeedRightPadding ? styles.dropdownNeedRightPadding : ''}
      ${isNeedBottomMargin ? styles.dropdownNeedbottomMargin : ''}
      `}
      ref={dropdownRef}
    >
      <div
        className={`${styles.selected} ${isOpen ? styles.isOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.label}>{t(selectedOption?.label)}</span>
        <span className={styles.arrow}></span>
      </div>
      {isOpen && (
        <ul
          ref={optionsRef}
          className={`${styles.options} ${
            isNeedCentered ? styles.optionsNeedCentered : ''
          }${isNeedRightPadding ? styles.optionsNeedRightAligned : ''}`}
        >
          {FILTER_OPTIONS.map((option, index) => {
            const isNewGroup =
              option.group && option.group !== FILTER_OPTIONS[index - 1]?.group;
            return (
              <Fragment key={option.value}>
                {isNewGroup && (
                  <>
                    <li className={styles.divider} aria-hidden="true" />
                    <li className={styles.groupLabel}>
                      {t(GROUP_LABELS[option.group])}
                    </li>
                  </>
                )}
                <li
                  className={`${styles.option} ${
                    value === option.value ? styles.selectedOption : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {t(option.label)}
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;
