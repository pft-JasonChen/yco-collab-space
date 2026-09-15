import assetMap from './rd-assets.js';
import styles from './StartEditingButton.module.scss';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { useHandleFile as useHandleFile } from './adapters.jsx';
import { moduleTypes } from './adapters.jsx';
import { HiddenFileInput as HiddenFileInput } from './adapters.jsx';
import {
  setCrossPageState,
  setHeaderMenuOpened,
  setLoginModalOpen,
} from './adapters.jsx';
import { useUserStatus as useUserStatus } from './adapters.jsx';

export default function StartEditingButton({
  handleOpenGalleryPicker,
  isHeaderPortal = false,
  onDropdownOpenChange,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);

  const { isGuest } = useUserStatus();

  const { t } = getTranslationFunction();
  const {
    handleInputClick,
    handleInputFileChange: originalHandleInputFileChange,
  } = useHandleFile({
    moduleType: moduleTypes.edit,
  });

  const checked = useSelector((state) => state.user.checked);

  const dispatch = useDispatch();

  const handleInputFileChange = useCallback(
    async (event) => {
      if (event?.target?.files?.length > 0) {
        dispatch(setHeaderMenuOpened(false));
      }
      return originalHandleInputFileChange(event);
    },
    [originalHandleInputFileChange, dispatch]
  );

  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        onDropdownOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onDropdownOpenChange]);

  useEffect(() => {
    return () => {
      onDropdownOpenChange?.(false);
    };
  }, [onDropdownOpenChange]);

  const handleUploadPhotos = useCallback(
    async (e) => {
      e.stopPropagation();
      setIsDropdownOpen(false);
      onDropdownOpenChange?.(false);
      await dispatch(
        setCrossPageState({ newProject: false, showEmpty: false })
      );
      handleInputClick(inputRef);
    },
    [dispatch, handleInputClick, onDropdownOpenChange]
  );

  const handleSelectFromGallery = useCallback(
    (e) => {
      e.stopPropagation();
      setIsDropdownOpen(false);
      onDropdownOpenChange?.(false);
      // The option is hidden for guests; guard anyway so gallery stays login-only.
      if (isGuest) {
        dispatch(setLoginModalOpen(true));
        return;
      }
      handleOpenGalleryPicker?.();
    },
    [isGuest, dispatch, handleOpenGalleryPicker, onDropdownOpenChange]
  );

  // Click/tap toggles dropdown on both desktop and mobile
  const handleButtonClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!checked) return;
      setIsDropdownOpen((prev) => {
        const next = !prev;
        onDropdownOpenChange?.(next);
        return next;
      });
    },
    [checked, onDropdownOpenChange]
  );

  return (
    <div
      className={`${styles.container} ${
        isDropdownOpen ? styles.containerDropdownOpen : ''
      }`}
      data-is-header-portal={isHeaderPortal ? 'true' : 'false'}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.startEditingBtn} ${
          !checked ? styles.startEditingBtnDisabled : ''
        }`}
        onClick={handleButtonClick}
      >
        <img
          className={styles.icon}
          src={assetMap["/assets/images/header/start_editing_icon.svg"]}
          alt=""
          loading="lazy"
        />
        <span className={styles.text}>
          {t('header.items.gridmodule.greeting.start.editing')}
        </span>
      </button>
      {isDropdownOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={handleUploadPhotos}
          >
            <img
              className={styles.dropdownIcon}
              src={assetMap["/assets/images/icon_upload_mb.png"]}
              alt=""
              loading="lazy"
            />
            <span>{t('home.sidebar.start.editing.upload.photos')}</span>
          </button>
          {!isGuest && (
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleSelectFromGallery}
            >
              <img
                className={styles.dropdownIcon}
                src={assetMap["/assets/images/header/icon_gallery.svg"]}
                alt=""
                loading="lazy"
              />
              <span>{t('home.sidebar.start.editing.select.from.gallery')}</span>
            </button>
          )}
        </div>
      )}
      <HiddenFileInput
        inputRef={inputRef}
        handleInputFileChange={handleInputFileChange}
      />
    </div>
  );
}
