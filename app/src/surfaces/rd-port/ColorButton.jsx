import styles from './ColorButton.module.scss';
import assetMap from './rd-assets.js';
import { useMemo } from 'react';
import { useSelector } from './adapters.jsx';
import { useRouter } from './adapters.jsx';
import { useNoticeCheckbox as useNoticeCheckbox } from './adapters.jsx';
import { getTranslationFunction } from './adapters.jsx';
import { headerUtils as headerUtils } from './adapters.jsx';
import ButtonWrapper from './ButtonWrapper.jsx';
import { LinkWithLocale as LinkWithLocale } from './adapters.jsx';
import _get from 'lodash/get';
import _size from 'lodash/size';
import _camelCase from 'lodash/camelCase';
import _capitalize from 'lodash/capitalize';

const HOVER_FOR_TOUCH_DEVICE = [
  'download',
  'get.the.app.mobile',
  'share',
  'log.in',
  'my.account',
  'member',
  'login.oval',
  'signup.oval',
  'login.and.signup.oval',
];

export default function ColorButton(props) {
  const { t } = getTranslationFunction();
  const locale = _get(useRouter(), 'query.locale', 'en-us');
  const {
    type,
    hideIcon,
    hideText,
    disabled,
    url = null,
    handleClick = () => {},
    customText,
    customIconComponent,
    bypassHover,
    hoverClass = 'hover-with-border-46e4fa',
    touchClass = 'touch-with-border-46e4fa',
    iconSrc = null,
    showRedDotState = [],
    showOtherRedDot = false,
    newTab = false,
    alt = '',
  } = props;
  const { optIn, isShowSubscribeNoticeCheckboxFunc } = useNoticeCheckbox();

  const showHoverEffect = useMemo(() => {
    return HOVER_FOR_TOUCH_DEVICE.includes(type) && !bypassHover && !disabled;
  }, [type, bypassHover, disabled]);

  const buttonClass = useMemo(() => {
    const baseClass = `${styles[_camelCase(type)]} ${
      disabled
        ? type.includes('skeleton')
          ? styles.skeletonDisabled
          : styles.disabled
        : ''
    } ${type.includes('skeleton') ? 'shimmer-skeleton' : ''}`;

    const gtmClass = baseClass.includes('color-button_myAccount__MZGOh')
      ? 'gtm_menu_myAccount'
      : '';

    return `${baseClass} ${gtmClass}`;
  }, [type, disabled]);

  const buttonText = useMemo(() => {
    if (customText) {
      return customText;
    } else if (['get.the.app.mobile', 'get.the.app.pad'].includes(type)) {
      return t('header.items.gettheapp');
    } else {
      return t(`header.items.${type}`);
    }
  }, [customText, type, t]);

  const gtmClass = useMemo(() => {
    return buttonText === t('header.items.gettheapp')
      ? 'gtm_menu_download_app'
      : buttonText === t('header.items.my.account')
      ? 'gtm_menu_myAccount'
      : '';
  }, [buttonText, t]);

  const textClass = useMemo(() => {
    let className = styles.text;
    if (hideIcon) {
      className += ' ' + styles.noMargin;
    }
    if (type === 'download') {
      className += ' ' + styles.downloadTextWrapper;
    }
    return className;
  }, [type, hideIcon]);

  const adjustFontSize = () => {
    const commonStyles = {
      whiteSpace: 'break-spaces',
      textAlign: 'center',
    };
    return headerUtils.adjustFontSize(locale, commonStyles);
  };

  const showRedDot = () =>
    isShowSubscribeNoticeCheckboxFunc() &&
    (type === 'my.account' || type === 'member') &&
    optIn === null;

  return (
    <Wrapper
      url={url}
      type={type}
      className={buttonClass}
      hoverClass={showHoverEffect ? hoverClass : null}
      touchClass={showHoverEffect ? touchClass : null}
      onClick={handleClick}
      newTab={newTab}
      alt={alt}
    >
      {!hideIcon &&
        (customIconComponent ? (
          <div className={styles.icon}>{customIconComponent()}</div>
        ) : (
          <img
            src={iconSrc ? iconSrc : assetMap['/assets/images/header/icon_profile.svg']}
            alt=""
            draggable={false}
            className={styles.iconProfile}
            data-type={type}
          />
        ))}
      {!hideText && (
        <div
          style={{ ...adjustFontSize() }}
          className={`${textClass} ${gtmClass}`}
        >
          <div className={type === 'download' ? styles.downloadText : ''}>
            {buttonText}
          </div>
        </div>
      )}
      {(showRedDot() || _size(showRedDotState) > 0 || showOtherRedDot) && (
        <div className={styles.redDot} />
      )}
    </Wrapper>
  );
}

function Wrapper(props) {
  const { children, url, type, newTab, alt = '', ...otherProps } = props;

  const wrapperType = useMemo(() => {
    return !url ? 1 : 2;
  }, [url]);

  const linkClass = useMemo(() => {
    return `${styles.link} ${
      type === 'my.account' || type === 'member' ? styles.noMargin : ''
    }`;
  }, [type]);

  const linkAttributes = useMemo(() => {
    if (['get.the.app.mobile', 'get.the.app.pad'].includes(type)) {
      return {
        target: '_blank',
        rel: 'noreferrer',
      };
    } else if (newTab) {
      return {
        target: '_blank',
        rel: 'noopener noreferrer',
      };
    } else {
      return {};
    }
  }, [type]);

  if (wrapperType === 1) {
    return (
      <ButtonWrapper {...otherProps} alt={alt}>
        {children}
      </ButtonWrapper>
    );
  } else if (wrapperType === 2) {
    return (
      <LinkWithLocale className={linkClass} href={url} {...linkAttributes}>
        <ButtonWrapper {...otherProps} alt={alt}>
          {children}
        </ButtonWrapper>
      </LinkWithLocale>
    );
  } else {
    return null;
  }
}
