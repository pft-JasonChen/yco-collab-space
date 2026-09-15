import { useRouter } from './adapters.jsx';
import { useEffect } from 'react';
import _isEqual from 'lodash/isEqual';
import { routerUtils as routerUtils } from './adapters.jsx';

const useSwitchTab = (props) => {
  const {
    tabMap,
    setTab = null,
    isManualChange = null,
    querySwitch = true,
  } = props;
  const router = useRouter();

  const handleSetTab = async (tabKey) => {
    if (isManualChange) isManualChange.current = true;
    const { locale } = router.query;
    const prefix = !locale || locale === 'en-us' ? '' : `/${locale}`;

    const { basePath, pathSuffix, queryKey, queryValue } = tabMap[tabKey];

    const targetPath = `${basePath}${pathSuffix}`;
    const tabQuery = { [queryKey]: queryValue };
    const query = {
      locale: locale || 'en-us',
      ...tabQuery,
    };
    const fullPath = prefix + targetPath;

    if (_isEqual(router.asPath, fullPath)) return;

    // Browser URL remains the Surface route; the local router owns RD path state.
    await routerUtils.shallowReplace(router, query, fullPath);
    if (setTab) setTab(tabKey);
  };

  useEffect(() => {
    if (!querySwitch) return;
    if (isManualChange && isManualChange.current) {
      isManualChange.current = false;
      return;
    }

    let isSetTab = false;
    Object.keys(tabMap).forEach((key) => {
      const { queryKey, queryValue } = tabMap[key];
      const isTabQuery = _isEqual(router.query[queryKey], queryValue);
      if (isTabQuery && setTab) {
        setTab(key);
        isSetTab = true;
      }
    });
    if (!isSetTab && setTab) setTab(Object.keys(tabMap)[0]);
  }, [router.query]);

  return { handleSetTab };
};

export default useSwitchTab;

