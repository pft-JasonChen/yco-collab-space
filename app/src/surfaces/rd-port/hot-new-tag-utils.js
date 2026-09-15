import _get from 'lodash/get';

const HOT_TAB_VALUE = 'Tab: Hot';
const NEW_TAB_VALUE = 'Tab: New';

export const isHotTab = (value) => value === HOT_TAB_VALUE;

export const isNewTab = (value) => value === NEW_TAB_VALUE;

export const getHotNewFlagsFromTabs = (tabs) => ({
  isHot: isHotTab(tabs),
  isNew: isNewTab(tabs),
});

export const getHotNewFlagsFromGridItem = (gridItem = {}) => ({
  isHot: isHotTab(_get(gridItem, 'tabs', false)),
  isNew: isNewTab(_get(gridItem, 'tabs', false)),
});

