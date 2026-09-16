import _get from 'lodash/get';
import getSymbolFromCurrency from 'currency-symbol-map';
import { paymentUtils as paymentUtils } from './pricing-adapters.jsx';
import _round from 'lodash/round';

const getLocalePrice = (creditPlan, locale) => {
  const credits = _get(creditPlan, 'info.customInfo.tokenInfo.amount', 0);
  const localeCurrency = paymentUtils.getCurrency(locale);

  // Both 2CO and Stripe have info.prices array
  const prices = _get(creditPlan, 'info.prices', []);
  const currencyUpper = localeCurrency?.toUpperCase();
  const currencyLower = localeCurrency?.toLowerCase();

  const localePrice =
    prices.find((price) => {
      const priceCurrency = price.currency;
      return (
        priceCurrency === localeCurrency ||
        priceCurrency === currencyUpper ||
        priceCurrency === currencyLower
      );
    }) ||
    prices.find((price) => {
      const priceCurrency = price.currency?.toUpperCase();
      return priceCurrency === 'USD';
    });

  return { ...localePrice, credits };
};

const getCurrencyPrice = (creditPlan, currency) => {
  const credits = _get(creditPlan, 'info.customInfo.tokenInfo.amount', 0);

  // devLog('[getCurrencyPrice] Called with:', {
  //   skuId: _get(creditPlan, 'info.skuId'),
  //   extId: _get(creditPlan, 'extId'),
  //   currency,
  //   hasPricesArray: !!_get(creditPlan, 'info.prices'),
  //   pricesArraySample: _get(creditPlan, 'info.prices', []).slice(0, 2),
  // });

  // Both 2CO and Stripe have info.prices array
  const prices = _get(creditPlan, 'info.prices', []);
  const currencyUpper = currency?.toUpperCase();
  const currencyLower = currency?.toLowerCase();

  // devLog('[getCurrencyPrice] Searching for currency:', {
  //   input: currency,
  //   upper: currencyUpper,
  //   lower: currencyLower,
  //   availableCurrencies: prices.map((p) => p.currency),
  // });

  const localePrice =
    prices.find((price) => {
      const priceCurrency = price.currency;
      return (
        priceCurrency === currency ||
        priceCurrency === currencyUpper ||
        priceCurrency === currencyLower
      );
    }) ||
    prices.find((price) => {
      const priceCurrency = price.currency?.toUpperCase();
      return priceCurrency === 'USD';
    });

  // devLog('[getCurrencyPrice] Returning from prices array:', {
  //   ...localePrice,
  //   credits,
  // });
  return { ...localePrice, credits };
};

const getCurrencySymbol = (currency = 'USD') => {
  return getSymbolFromCurrency(currency);
};

const shouldDisplayDecimal = (price, currency = 'USD') => {
  const excludeList = ['TWD', 'JPY', 'KRW', 'CLP'];
  if (excludeList.includes(currency)) {
    return _round(price, 0);
  }
  return _round(price, 2).toFixed(2);
};

export {
  getLocalePrice,
  getCurrencyPrice,
  getCurrencySymbol,
  shouldDisplayDecimal,
};
