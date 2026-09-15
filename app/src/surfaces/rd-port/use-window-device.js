import variables from './breakpoints.module.scss';
import useWindowWidth from './use-window-width.js';
import { useMemo, useState, useEffect } from 'react';

// The `isMobileDevice` test as a plain call, for code that needs the answer
// synchronously — the hook's state starts false until its effect runs.
export const isMobileDeviceNow = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
};

// The `isMd` breakpoint as a plain call, for code that only needs the answer
// when something fires. The hook keeps it current by subscribing to resize —
// that re-renders every consumer, for a value read once inside a callback.
export const isMdNow = () =>
  typeof window !== 'undefined' &&
  window.innerWidth <= parseInt(variables['width-md']);

export default function useWindowDevice() {
  const { width } = useWindowWidth();

  const isDesktop = width > parseInt(variables['width-lg']);
  const isMobile = width <= parseInt(variables['width-sm']);
  const isPad = !isDesktop && !isMobile;
  // width is 0 until the first client measurement (SSG has no window at build
  // time). Consumers can use this to avoid painting a breakpoint-specific
  // variant before the real width is known.
  const isMeasured = width > 0;
  const isMd = width <= parseInt(variables['width-md']);
  const isHd = width <= parseInt(variables['width-1400']);
  const isIphoneSe = width <= 375; // width-iphone-se

  const isSmallMobile = useMemo(() => {
    return width <= 320;
  }, [width]);

  const is992 = useMemo(() => {
    return width <= 992;
  }, [width]);

  const is1200 = useMemo(() => {
    return width < 1200;
  }, [width]);

  const is1250Width = useMemo(() => {
    return width <= 1250;
  }, [width]);

  const is1280Width = useMemo(() => {
    return width <= 1280;
  }, [width]);

  const is1920 = useMemo(() => {
    return width < 1920;
  }, [width]);

  const [dpi, setDpi] = useState(1);

  // New addition for mobile device and orientation
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    setDpi(window.devicePixelRatio || 1);

    const checkMobile = () => setIsMobileDevice(isMobileDeviceNow());

    const checkOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    checkMobile();
    checkOrientation();

    const onResize = () => {
      checkMobile();
      checkOrientation();
    };
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    windowWidth: width,
    isDesktop,
    isMobile,
    isPad,
    isMeasured,
    isMd,
    isHd,
    isSmallMobile,
    isIphoneSe,
    is992,
    is1200,
    is1250Width,
    is1280Width,
    is1920,
    isMobileDevice,
    orientation,
    dpi,
  };
}

