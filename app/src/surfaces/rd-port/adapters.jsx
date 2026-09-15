// Local-only integration boundary for the RD presentation modules.
// UI markup/styles live in copied RD modules, not in these service adapters.
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import en from './en.json';
import categoryNameUtils from './category-name-utils.js';
export { default as useWindowDevice } from './use-window-device.js';
export { default as useWindowWidth } from './use-window-width.js';
export { default as ImageLazyLoad } from './ImageLazyLoad.jsx';
export { default as HiddenFileInput } from './HiddenFileInput.jsx';
export { default as ExternalLink } from './ExternalLink.jsx';
export { default as Portal } from './Portal.jsx';
export { default as ButtonWrapper } from './ButtonWrapper.jsx';
const Runtime = createContext(null);
export function RuntimeProvider({ children, path, onNavigate, onBoundary, copy = {} }) {
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const dispatch = useCallback(action => {
    if (action?.type === 'section') setCurrentSectionId(action.value);
    return Promise.resolve({});
  }, []);
  const router = useMemo(() => ({ pathname: path.split('?')[0], asPath: path, query: Object.fromEntries(new URLSearchParams(path.split('?')[1] || '')), isReady: true, push: onNavigate }), [path, onNavigate]);
  const value = useMemo(() => ({ router, dispatch, onBoundary, copy, state: { homeCategory: { currentSectionId }, user: { checked: true }, api: { initOK: true, initResult: { misc: { country: 'US' } } }, info: { moduleType: null, sodType: null }, yceData: {}, ui: { pricingModal: { type: 'normal' } } } }), [router, dispatch, onBoundary, copy, currentSectionId]);
  return <Runtime.Provider value={value}>{children}</Runtime.Provider>;
}
export const useRouter = () => useContext(Runtime).router;
export const useSelector = selector => selector(useContext(Runtime).state);
export const useDispatch = () => useContext(Runtime).dispatch;
export const getTranslationFunction = () => {
  const { copy } = useContext(Runtime);
  return { locale: 'en-us', t: (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{{${name}}}`, value).replaceAll(`%{${name}}`, value), copy[key] ?? en[key] ?? key) };
};
export const routerUtils = { push: (router, path, query) => router.push(path, query), shallowPush: () => {}, shallowReplace: (router, query, path) => router.push(path) };
export function LinkWithLocale({ href, children, onClick, ...props }) {
  const { router } = useContext(Runtime);
  return <a {...props} href={href} onClick={event => { event.preventDefault(); onClick?.(event); router.push(href); }}>{children}</a>;
}
export const useHeaderGeneral = () => ({ isHomePage: useRouter().pathname === '/home', isAiAgentPage: false });
export const useUserStatus = () => ({ isGuest: false, isLoginUser: true });
export const useShowContest = () => ({ showContest: false });
export const setCurrentSectionId = value => ({ type: 'section', value });
export const setCrossPageState = value => ({ type: 'cross-page', value });
export const setHeaderMenuOpened = value => ({ type: 'header', value });
export const setLoginModalOpen = value => ({ type: 'login', value });
export const sessionStorageUtils = { setItem() {} };
export const sessionStorageTypes = { copilot: { source: 'prototype-entry' } };
export const ProcessingTypes = { processing: 'processing' };
export const TaskTypes = { new: 'new' };
export const moduleTypes = { edit: 'edit' };
export const headerProducts = {};
export const moduleTypeUtils = { pageKeyOrFunctionKeyToModuleType: value => value };
export const setAIGenerateEntrySource = () => {};
export const isAIGenerateVideoModuleType = () => false;
export const useEditProject = () => ({ initProject() {} });
export const useHandleRecentFiles = () => ({ deleteRecentFile: async () => {} });
export const useUpdateResultRedux = () => ({ setTaskProcessType() {}, setNewTask() {} });
export function useHandleInput({ inputRef } = {}) {
  const { onBoundary } = useContext(Runtime);
  return { handleInputClick: ref => (ref || inputRef)?.current?.click(), handleInputFileChange: () => onBoundary('/edit/result-photo') };
}
export const useHandleFile = useHandleInput;
export const sideBarMenuUtils = { convertUrlToKey: value => value };
export const useCommonFunction = () => ({ getProductImageSrc: () => '' });
export const msrUtils = { convertMsrLanguageType: value => value, translateWithKey: panel => ({ ...panel, name: panel.name }) };
export const getValidCards = cards => cards.filter(card => card.link);
export const isLinkValid = link => typeof link === 'string' && link.startsWith('/');
export function useResizeObserver({ targetRef, onResize }) {
  useEffect(() => { const observer = new ResizeObserver(onResize); if (targetRef.current) observer.observe(targetRef.current); return () => observer.disconnect(); }, [targetRef, onResize]);
}
export const browserUtils = {
  isTouchDevice: () => window.matchMedia('(pointer: coarse)').matches,
  canHover: () => window.matchMedia('(hover: hover)').matches,
  isIOs: () => /iPhone|iPod/.test(navigator.userAgent),
  isIPad: () => /iPad/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
};
export const LogoMap = { 'en-us': 'ENU' };
export const HolidayTypes = { default: 'default', halloween: 'halloween', blackfriday: 'black_friday', christmas: 'christmas', endyear: 'end_year' };
export const useHolidayType = () => ({ holidayType: 'normal' });
export const useCheckHolidayProduct = () => ({ isHolidayMode: false });
export const useNoticeCheckbox = () => ({ optIn: true, isShowSubscribeNoticeCheckboxFunc: () => false });
export const headerUtils = { adjustFontSize: (_locale, styles) => styles };
export const hoverClassMap = { hover46e4fa: 'hover-with-border-46e4fa' };
export const touchClassMap = { hover46e4fa: 'touch-with-border-46e4fa' };
export const myAccountTabs = { account: 'account', gallery: 'gallery', photoEditor: 'photoEditor', videoEditor: 'videoEditor', imageGeneration: 'imageGeneration', avatar: 'artwork', settings: 'settings', apikey: 'apikey', aiTools: 'artwork', aiAgent: 'aiAgent' };
export const AccountRedDotsContext = createContext({});
export const useAccountRedDots = () => ({});
export const useTwoCheckout = () => ({ updateSourcePage() {}, updateSourceButton4PricingIcon() {} });
export function useHomeCategory({ gridSections }) {
  const { t } = getTranslationFunction();
  return { filteredSections: gridSections, getCategoryName: name => t(categoryNameUtils.getCategoryNameMappingKey(name) || name) };
}
export const Footer = () => null;
export const AiTools = () => null;
export const AiAgent = () => null;
export const uuidv4 = () => crypto.randomUUID();
export const posterFrameSrc = value => value;
// No persisted recent-use history is seeded into a pristine fixture.
export const RecentUsedFeatures = () => null;
export const LoginBanner = () => null; // commented out in RD Layout1300
export const LoadingSkeleton = () => null; // fixture is synchronous, skipLoadingSkeleton=true
export function GalleryPickerModal({ isOpen, onClose }) {
  const { onBoundary } = useContext(Runtime);
  useEffect(() => { if (isOpen) { onBoundary('home/gallery-picker'); onClose(); } }, [isOpen, onBoundary, onClose]);
  return null;
}
