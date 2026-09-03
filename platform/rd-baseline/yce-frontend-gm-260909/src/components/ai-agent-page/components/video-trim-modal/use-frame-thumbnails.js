import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BlobSource, CanvasSink, Input, MP4, QTFF } from 'mediabunny';
import { FRAME_COUNT } from './constants';

// Fallback for sources WebCodecs can't decode at all (see the canDecode()
// check below) — a plain <video> element + canvas.drawImage, same
// iOS-Safari-hardened technique imageUtils.generateVideoThumbnail and
// video-object-remover's timeline filmstrip already use elsewhere in this
// codebase. Sequential seek-and-wait per frame is slower and flakier on
// mobile than mediabunny's direct decode (that's why this hook uses
// mediabunny as the default path), but it works regardless of what
// VideoDecoder.isConfigSupported() says, so it's the only option once
// mediabunny is off the table.
async function drawThumbnailsViaVideoElement(
  file,
  timestamps,
  canvasRefs,
  isCancelled
) {
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
      video.load();
    });
    if (isCancelled()) return;

    const videoAspect = video.videoWidth / video.videoHeight;

    for (let i = 0; i < timestamps.length; i += 1) {
      if (isCancelled()) return;
      const canvas = canvasRefs.current[i];
      if (!canvas) continue;

      // Same-position seek (time 0, video already at 0) may not fire
      // 'seeked' on iOS Safari — nudge the first frame off zero.
      video.currentTime = timestamps[i] || 0.001;
      await new Promise((resolve) => {
        video.addEventListener('seeked', resolve, { once: true });
      });
      if (isCancelled()) return;

      // Cover-crop to match the mediabunny path's fit: 'cover'.
      const canvasAspect = canvas.width / canvas.height;
      let sx, sy, sw, sh;
      if (videoAspect > canvasAspect) {
        sh = video.videoHeight;
        sw = Math.round(sh * canvasAspect);
        sx = Math.round((video.videoWidth - sw) / 2);
        sy = 0;
      } else {
        sw = video.videoWidth;
        sh = Math.round(sw / canvasAspect);
        sx = 0;
        sy = Math.round((video.videoHeight - sh) / 2);
      }
      canvas
        .getContext('2d')
        .drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    }
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

// Draws FRAME_COUNT evenly spaced thumbnails from the source video onto a row
// of <canvas> elements. mediabunny decodes frames straight out of the file
// (no <video> element / seek-and-wait round trips), which sidesteps the
// `currentTime` seek flakiness real <video> elements have on some mobile
// browsers, and `fit: 'cover'` handles the center-crop for us.
//
// thumbnailWidth/thumbnailHeight must match each <canvas>'s actual rendered
// size (both vary — width with the frames-area's measured width, height with
// breakpoint, see trim-timeline.module.scss) so `fit: 'cover'` crops to the
// final display box itself — otherwise the browser stretches the bitmap to
// fit the CSS box since <canvas> content ignores object-fit.
export default function useFrameThumbnails(
  videoFile,
  duration,
  thumbnailWidth,
  thumbnailHeight
) {
  const canvasRefs = useRef([]);
  // False while this hook holds its own mediabunny decode session over
  // videoFile, so callers (the "Use Video" button) can wait for it to
  // release the file before starting another decode/encode pass over the
  // same bytes — concurrent hardware decode sessions on one file is what
  // caused the "Unexpected frame format" trim failures.
  const [isReady, setIsReady] = useState(false);

  // The <canvas> elements are keyed by index, not by video identity, so they
  // stay mounted (with whatever pixels were last drawn) across a cancel +
  // re-upload. Clear them synchronously as soon as the video changes so the
  // previous video's frames never linger while the new one decodes.
  useLayoutEffect(() => {
    canvasRefs.current.forEach((canvas) => {
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    });
  }, [videoFile]);

  useEffect(() => {
    if (!videoFile || !duration) return undefined;
    let cancelled = false;
    let input = null;
    setIsReady(false);

    const run = async () => {
      try {
        // Restricted to mp4/mov — the only formats the AI Agent upload picker
        // accepts (videoUtils.validExtensions: .mp4, .mov, .m4v — the last is
        // an MP4-family container, so MP4 covers it too).
        input = new Input({
          source: new BlobSource(videoFile),
          formats: [MP4, QTFF],
        });
        const videoTrack = await input.getPrimaryVideoTrack();
        if (cancelled || !videoTrack) return;

        const timestamps = Array.from(
          { length: FRAME_COUNT },
          (_, i) => (duration * i) / FRAME_COUNT
        );

        // Some profiles a plain <video> element plays fine (e.g. an action
        // cam's H.264 "High 10" 10-bit export) aren't in WebCodecs'
        // VideoDecoder.isConfigSupported() allowlist on WebKit at all — a
        // gap between the OS media stack <video> uses and WebCodecs' own
        // narrower declared support, unrelated to hardware vs software
        // decode. Without this check an undecodable track just yields
        // blank thumbnails with no indication why.
        const canDecode =
          (await videoTrack.getCodec()) !== null &&
          (await videoTrack.canDecode());
        if (cancelled) return;

        if (!canDecode) {
          await drawThumbnailsViaVideoElement(
            videoFile,
            timestamps,
            canvasRefs,
            () => cancelled
          );
          return;
        }

        const sink = new CanvasSink(videoTrack, {
          width: thumbnailWidth,
          height: thumbnailHeight,
          fit: 'cover',
        });

        let i = 0;
        for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
          if (cancelled) return;
          const canvas = canvasRefs.current[i];
          if (wrapped && canvas) {
            canvas
              .getContext('2d')
              .drawImage(wrapped.canvas, 0, 0, canvas.width, canvas.height);
          }
          i += 1;
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            '[VideoTrimModal] Frame thumbnail extraction failed:',
            error
          );
        }
      } finally {
        // Dispose as soon as this decode pass is done, not just on
        // unmount/dep-change — otherwise the session (and the hardware
        // decoder slot it holds) stays open for as long as the modal is
        // open, well past when the thumbnails are actually needed.
        input?.dispose();
        input = null;
        if (!cancelled) setIsReady(true);
      }
    };
    run();

    return () => {
      cancelled = true;
      input?.dispose();
    };
  }, [videoFile, duration, thumbnailWidth, thumbnailHeight]);

  return { canvasRefs, isReady };
}
