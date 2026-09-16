import pricingAssets from './pricing-assets.js';
import styles from './currency-index.module.scss';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from './pricing-adapters.jsx';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import clm from 'country-locale-map';
import { HolidayTypes } from './pricing-adapters.jsx';

const twoDigitCountryCode = [
  'US',
  'GB',
  'CA',
  'AU',
  'TW',
  'HK',
  'JP',
  'KO',
  'DE',
  'CH',
  'FR',
  'ES',
  'MX',
  'CL',
  'BR',
  'IT',
];

const threeDigitCountryCode = [
  'USA',
  'GBR',
  'CAN',
  'AUS',
  'TWN',
  'HKG',
  'JPN',
  'KOR',
  'DEU',
  'CHE',
  'FRA',
  'ESP',
  'MEX',
  'CHL',
  'BRA',
  'ITA',
];

const CurrencySelector = (props) => {
  const {
    currencyList = [],
    setCurrencyList,
    toggleDropdown,
    currencyIndex,
    setCurrencyIndex,
    isActive,
    setIsActive,
    dropdownPosition = 'down',
    useIconUI = false,
    isHolidayMode = false,
    holidayType = null,
  } = props;
  const api = useSelector((state) => state.api);
  const user = useSelector((state) => state.user);
  const isStripeMode = _get(user, 'isStripeMode');

  const [isInit, setIsInit] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!api?.initOK) return;
    const country = _get(api, 'initResult.misc.country', null);
    const checkCountry =
      twoDigitCountryCode.includes(country) ||
      threeDigitCountryCode.includes(country);
    if (!checkCountry) {
      setCurrencyList(['USD']);
      setCurrencyIndex(0);
      setIsInit(true);
      return;
    }
    const length = country.length;
    const currencyIndex =
      length === 2
        ? clm.getCurrencyByAlpha2(country)
        : clm.getCurrencyByAlpha3(country);
    const defaultCurrency = currencyList.indexOf(currencyIndex);
    setCurrencyIndex(defaultCurrency);
    setIsInit(true);
  }, [api?.initOK]);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const getCurrencyIconSrc = (holidayType) => {
    switch (holidayType) {
      case HolidayTypes.endyear:
        return '/assets/images/holiday/endyear/icon_down_currency.svg';
      case HolidayTypes.blackfriday:
        return pricingAssets['/assets/images/icon_down_currency_w.svg'];
      default:
        return pricingAssets['/assets/images/icon_down_currency.svg'];
    }
  };

  if (_isEmpty(currencyList) || !isInit) return null;

  return (
    <>
      <div
        className={styles.menuContainer}
        data-hidden={isStripeMode}
        ref={menuRef}
      >
        {useIconUI ? (
          <div className={styles.iconMenuButton} onClick={toggleDropdown}>
            <img
              className={styles.iconCurrency}
              src={pricingAssets['/assets/images/currency/currency.png']}
              alt="currency dropdown"
            />
            <div className={styles.iconCurrencytText}>
              {currencyList[currencyIndex]}
            </div>
          </div>
        ) : (
          <div
            className={styles.menuButton}
            onClick={toggleDropdown}
            data-holiday={isHolidayMode ? holidayType : false}
          >
            <div
              className={styles.currencytText}
              data-holiday={isHolidayMode ? holidayType : false}
            >
              {currencyList[currencyIndex]}
            </div>
            {!isHolidayMode ? (
              <img
                className={styles.iconDown}
                src={pricingAssets['/assets/images/icon_down_4prompt.svg']}
                alt="currency dropdown"
              />
            ) : (
              <div
                className={styles.currencyHolidayMode}
                data-holiday={isHolidayMode ? holidayType : false}
              >
                <div>|</div>
                <img
                  className={styles.iconDown}
                  src={getCurrencyIconSrc(holidayType)}
                  alt="currency dropdown"
                />
              </div>
            )}
          </div>
        )}
        <div
          className={`${styles.menuItems} ${isActive ? styles.active : ''} ${
            dropdownPosition === 'up' ? styles.up : ''
          }`}
          data-holiday={isHolidayMode || undefined} // Dynamically set the holiday name
        >
          {currencyList.map((item, index) => {
            return (
              <div
                key={`prompt-${index}`}
                className={styles.menuItem}
                onClick={() => {
                  setCurrencyIndex(index);
                  setIsActive(false);
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CurrencySelector;
export { twoDigitCountryCode, threeDigitCountryCode };
