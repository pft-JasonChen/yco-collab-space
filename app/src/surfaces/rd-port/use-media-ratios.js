import { useEffect, useRef, useState } from 'react';

/**
 * Measures the *true* aspect ratio of media by loading it off-DOM:
 *   - image: naturalWidth / naturalHeight
 *   - video: videoWidth / videoHeight (a video's thumbnail/poster ratio can
 *     differ — some posters are user-uploaded or a before-image — so the video
 *     itself is the only reliable source)
 *
 * Images load cors-mode (crossOrigin='anonymous') to share the rendered
 * gallery <img>'s cache entry — one download per src. Videos stay no-cors;
 * loading is aborted right after metadata so we don't buffer 48 clips.
 *
 * A `started` set guards against re-loading a src on re-render (the `entries`
 * array identity changes each render). The mount guard — NOT a per-run cancel
 * flag — is what gates setState: when `entries` grows (e.g. a new item is
 * added), in-flight measurements from the previous run must still resolve.
 * Cancelling them per-run while `started` skips re-measuring would strand the
 * already-loading items on the fallback ratio forever.
 *
 * `settled` marks a src as done measuring — resolved OR errored — so callers can
 * stop waiting (e.g. drop a per-cell skeleton). A src can be settled WITHOUT a
 * ratio (error / no dimensions); the caller then falls back. NOTE: there is no
 * timeout-based settle on purpose — a slow video must stay unsettled until its
 * metadata actually loads, or the caller would reveal it on the fallback ratio
 * and then visibly resize when the real ratio arrives.
 *
 * @param {{src: string, type: 'image'|'video'}[]} entries
 * @returns {{ratios: Record<string, number>, settled: Record<string, true>}}
 */
export default function useMediaRatios(entries) {
  const [ratios, setRatios] = useState({});
  const [settled, setSettled] = useState({});
  const started = useRef(new Set());
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    const markSettled = (src) => {
      if (!mounted.current) return;
      setSettled((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
    };
    const setRatio = (src, w, h) => {
      if (mounted.current && h) {
        setRatios((prev) => (prev[src] ? prev : { ...prev, [src]: w / h }));
      }
      markSettled(src);
    };

    entries.forEach(({ src, type }) => {
      if (!src || started.current.has(src)) return;
      started.current.add(src);

      if (type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.onloadedmetadata = () => {
          setRatio(src, video.videoWidth, video.videoHeight);
          video.src = ''; // stop buffering once we have the dimensions
          video.load();
        };
        video.onerror = () => markSettled(src); // unmeasured -> caller falls back
        video.src = src;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setRatio(src, img.naturalWidth, img.naturalHeight);
        img.onerror = () => markSettled(src);
        img.src = src;
      }
    });
  }, [entries]);

  return { ratios, settled };
}

