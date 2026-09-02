function waitForMediaEvent(media, eventName, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timeout);
      media.removeEventListener(eventName, onReady);
      media.removeEventListener('error', onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('The browser could not decode timeline frames.'));
    };
    media.addEventListener(eventName, onReady, { once: true });
    media.addEventListener('error', onError, { once: true });
  });
}

async function seek(video, time) {
  if (Math.abs(video.currentTime - time) < 0.01 && video.readyState >= 2) return;
  const ready = waitForMediaEvent(video, 'seeked');
  video.currentTime = time;
  await ready;
}

export async function extractVideoFrames(sourceUrl, {
  count = 10,
  startTime = 0,
  endTime,
  width = 160,
} = {}) {
  if (!sourceUrl || count < 1) return [];

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = sourceUrl;

  try {
    video.load();
    if (video.readyState < 2) await waitForMediaEvent(video, 'loadeddata');

    const mediaDuration = Number.isFinite(video.duration) ? video.duration : 0;
    if (!mediaDuration || !video.videoWidth || !video.videoHeight) return [];

    const requestedEnd = Number.isFinite(endTime) ? endTime : mediaDuration;
    const usesMockTimeline = mediaDuration + 0.05 < requestedEnd;
    const captureStart = usesMockTimeline ? 0 : Math.min(Math.max(0, startTime), mediaDuration);
    const captureEnd = usesMockTimeline
      ? mediaDuration
      : Math.min(Math.max(captureStart, requestedEnd), mediaDuration);
    const safeLastFrame = Math.max(captureStart, Math.min(captureEnd, mediaDuration - 0.04));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(1, Math.round(width * (video.videoHeight / video.videoWidth)));
    const context = canvas.getContext('2d');
    if (!context) return [];

    const frames = [];
    for (let index = 0; index < count; index += 1) {
      const progress = count === 1 ? 0 : index / (count - 1);
      const captureTime = captureStart + ((safeLastFrame - captureStart) * progress);
      await seek(video, captureTime);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.72));
    }
    return frames;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
