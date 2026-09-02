import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FRAME_COUNT } from './constants.js';

async function drawViaVideo(file, timestamps, canvasRefs, isCancelled) {
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
      video.load();
    });
    const videoAspect = video.videoWidth / video.videoHeight;

    for (let index = 0; index < timestamps.length; index += 1) {
      if (isCancelled()) return;
      const canvas = canvasRefs.current[index];
      if (!canvas) continue;
      video.currentTime = timestamps[index] || 0.001;
      await new Promise((resolve) => video.addEventListener('seeked', resolve, { once: true }));
      const canvasAspect = canvas.width / canvas.height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;
      if (videoAspect > canvasAspect) {
        sourceWidth = Math.round(sourceHeight * canvasAspect);
        sourceX = Math.round((video.videoWidth - sourceWidth) / 2);
      } else {
        sourceHeight = Math.round(sourceWidth / canvasAspect);
        sourceY = Math.round((video.videoHeight - sourceHeight) / 2);
      }
      canvas.getContext('2d')?.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

export default function useFrameThumbnails(file, duration, width, height) {
  const canvasRefs = useRef([]);
  const [isReady, setIsReady] = useState(!file);

  useLayoutEffect(() => {
    canvasRefs.current.forEach((canvas) => {
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    });
  }, [file]);

  useEffect(() => {
    if (!file || !duration) {
      setIsReady(true);
      return undefined;
    }

    let cancelled = false;
    let input;
    setIsReady(false);
    const timestamps = Array.from({ length: FRAME_COUNT }, (_, index) => (duration * index) / FRAME_COUNT);

    const run = async () => {
      try {
        const { BlobSource, CanvasSink, Input, MP4, QTFF } = await import('mediabunny');
        if (cancelled) return;
        input = new Input({ source: new BlobSource(file), formats: [MP4, QTFF] });
        const track = await input.getPrimaryVideoTrack();
        if (!track || cancelled || !(await track.canDecode())) throw new Error('fallback');
        const sink = new CanvasSink(track, { width, height, fit: 'cover' });
        let index = 0;
        for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
          if (cancelled) return;
          const canvas = canvasRefs.current[index];
          if (wrapped && canvas) {
            canvas.getContext('2d')?.drawImage(wrapped.canvas, 0, 0, canvas.width, canvas.height);
          }
          index += 1;
        }
      } catch {
        if (!cancelled) {
          await drawViaVideo(file, timestamps, canvasRefs, () => cancelled);
        }
      } finally {
        input?.dispose();
        if (!cancelled) setIsReady(true);
      }
    };
    run();
    return () => {
      cancelled = true;
      input?.dispose();
    };
  }, [file, duration, width, height]);

  return { canvasRefs, isReady };
}
