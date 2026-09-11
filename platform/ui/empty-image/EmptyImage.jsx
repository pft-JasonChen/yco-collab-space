import generalWhite from '../../../design-library/assets/icon/yco-empty-state/general-white.svg';
import generalGray from '../../../design-library/assets/icon/yco-empty-state/general-gray.svg';
import videoWhiteBack from '../../../design-library/assets/icon/yco-empty-state/video-white-back.svg';
import videoWhiteFront from '../../../design-library/assets/icon/yco-empty-state/video-white-front.svg';
import videoGrayBack from '../../../design-library/assets/icon/yco-empty-state/video-gray-back.svg';
import videoGrayFront from '../../../design-library/assets/icon/yco-empty-state/video-gray-front.svg';
import edtWhite from '../../../design-library/assets/icon/yco-empty-state/edt-white.svg';
import edtGray from '../../../design-library/assets/icon/yco-empty-state/edt-gray.svg';
import t2iWhite from '../../../design-library/assets/icon/yco-empty-state/t2i-white.svg';
import t2iGray from '../../../design-library/assets/icon/yco-empty-state/t2i-gray.svg';
import i2vWhite from '../../../design-library/assets/icon/yco-empty-state/i2v-white.svg';
import i2vGray from '../../../design-library/assets/icon/yco-empty-state/i2v-gray.svg';
import t2v from '../../../design-library/assets/icon/yco-empty-state/t2v.svg';
import faceSwapPhoto from '../../../design-library/assets/icon/yco-empty-state/face-swap-photo.svg';
import faceSwapVideo from '../../../design-library/assets/icon/yco-empty-state/face-swap-video.svg';
import uploadDragPhoto from '../../../design-library/assets/icon/yco-empty-state/upload-drag-photo.svg';
import uploadDragHand from '../../../design-library/assets/icon/yco-empty-state/upload-drag-hand.svg';
import voiceMicSquare1 from '../../../design-library/assets/icon/yco-empty-state/voice-mic-square-1.svg';
import voiceMicSquare2 from '../../../design-library/assets/icon/yco-empty-state/voice-mic-square-2.svg';
import voiceMicVideo from '../../../design-library/assets/icon/yco-empty-state/voice-mic-video.svg';
import voiceMicHand from '../../../design-library/assets/icon/yco-empty-state/voice-mic-hand.svg';
import styles from './EmptyImage.module.scss';

/**
 * Figma "Empty Image" (node 13023:12548): a 120x120 illustration, one per tool
 * type. Most types are drawn twice, in a white-fill and a grey-fill (#F7F7F7)
 * version, specifically so the artwork doesn't blend into whichever surface
 * it sits on:
 *   - `background="base"`   — you're placing this on a --background-base (white)
 *                             surface, so it renders the GREY-fill artwork
 *                             (white-on-white would vanish).
 *   - `background="sunken"` — you're placing this on a --background-sunken /
 *                             --background-alternate (light-grey) surface, so it
 *                             renders the WHITE-fill artwork (grey-on-grey would
 *                             have too little contrast).
 * In other words the prop names the *page's* surface, and the component picks
 * whichever artwork fill contrasts against it — the opposite fill from what the
 * prop name might suggest at a glance, so don't "simplify" this mapping without
 * re-reading this comment.
 *
 * A few types only ever have one Figma-specified fill (t2v, face-swap-photo,
 * face-swap-video have no second version; upload-drag and voice-microphone use
 * the same asset on both surfaces — voice-microphone only swaps one inner
 * shape's fill color, not a different asset) — those ignore `background` and
 * always render their one artwork.
 */
function imgLayer({ left, top, width, height, imgWidth, imgHeight, rotate, flipX, flipY, src, key }) {
  const transforms = [];
  if (flipX) transforms.push('scaleX(-1)');
  if (flipY) transforms.push('scaleY(-1)');
  if (rotate) transforms.push(`rotate(${rotate}deg)`);
  return (
    <div key={key} className={styles.slot} style={{ left, top, width, height }}>
      <img
        src={src}
        alt=""
        style={{ width: imgWidth, height: imgHeight, transform: transforms.join(' ') || undefined }}
      />
    </div>
  );
}

const VARIANTS = {
  general: {
    base: [{ key: 'photo', left: 14, top: 7.5, width: 91.448, height: 106, imgWidth: 91.448, imgHeight: 106, src: generalGray }],
    sunken: [{ key: 'photo', left: 14, top: 7.5, width: 91.448, height: 106, imgWidth: 91.448, imgHeight: 106, src: generalWhite }],
  },
  video: {
    base: [
      { key: 'back', left: 9, top: 36.5, width: 89.574, height: 73.5, imgWidth: 77.941, imgHeight: 55.208, rotate: -15, src: videoGrayBack },
      { key: 'front', left: 24.46, top: 10, width: 86.344, height: 67.904, imgWidth: 77.941, imgHeight: 55.208, rotate: 10, src: videoGrayFront },
    ],
    sunken: [
      { key: 'back', left: 9, top: 36.5, width: 89.574, height: 73.5, imgWidth: 77.941, imgHeight: 55.208, rotate: -15, src: videoWhiteBack },
      { key: 'front', left: 24.46, top: 10, width: 86.344, height: 67.904, imgWidth: 77.941, imgHeight: 55.208, rotate: 10, src: videoWhiteFront },
    ],
  },
  edt: {
    base: [{ key: 'edit', left: 6, top: 4, width: 117.546, height: 112.532, imgWidth: 117.546, imgHeight: 112.532, src: edtGray }],
    sunken: [{ key: 'edit', left: 6, top: 4, width: 117.546, height: 112.532, imgWidth: 117.546, imgHeight: 112.532, src: edtWhite }],
  },
  t2i: {
    base: [{ key: 'photo', left: 11, top: 13.5, width: 96.8, height: 96.597, imgWidth: 96.8, imgHeight: 96.597, src: t2iGray }],
    sunken: [{ key: 'photo', left: 11, top: 13.5, width: 96.8, height: 96.597, imgWidth: 96.8, imgHeight: 96.597, src: t2iWhite }],
  },
  i2v: {
    base: [{ key: 'photo', left: 7, top: 4, width: 105.198, height: 111.222, imgWidth: 105.198, imgHeight: 111.222, src: i2vGray }],
    sunken: [{ key: 'photo', left: 7, top: 4, width: 105.198, height: 111.222, imgWidth: 105.198, imgHeight: 111.222, src: i2vWhite }],
  },
  t2v: {
    base: [{ key: 'photo', left: 8, top: 8, width: 104.198, height: 103.498, imgWidth: 104.198, imgHeight: 103.498, src: t2v }],
  },
  'face-swap-photo': {
    base: [{ key: 'photo', left: 10, top: 9.5, width: 99.47, height: 99.744, imgWidth: 99.47, imgHeight: 99.744, src: faceSwapPhoto }],
  },
  'face-swap-video': {
    base: [{ key: 'photo', left: 0, top: 14.5, width: 120, height: 89, imgWidth: 120, imgHeight: 89, src: faceSwapVideo }],
  },
  // Same two assets regardless of `background` (no separate fill exists in Figma).
  'upload-drag': {
    base: [
      { key: 'photo', left: 'calc(50% - 40.65px)', top: 'calc(50% - 50px)', width: 80, height: 90, imgWidth: 80, imgHeight: 90, src: uploadDragPhoto },
      { key: 'hand', left: 66.35, top: 76, width: 42, height: 42, imgWidth: 42, imgHeight: 42, src: uploadDragHand },
    ],
  },
};
VARIANTS['upload-drag'].sunken = VARIANTS['upload-drag'].base;

const BASE_TYPES_ONLY = new Set(['t2v', 'face-swap-photo', 'face-swap-video', 'upload-drag']);

function VoiceMicrophone({ background }) {
  // Best-effort transcription of Figma's node 16479:645 / 16485:1047 — the source
  // uses nested rotate/scale transforms plus container-query `hypot()` sizing for
  // the hand layer; reproduced here with equivalent fixed-size absolute positions
  // rather than the container-query trig, since this canvas is a fixed 120x120
  // (not responsive) — visually equivalent, not a byte-for-byte transcription.
  // Same background/fill-direction rule as everywhere else in this file: `base`
  // (white page) gets the grey pill, `sunken` (grey page) gets the white pill.
  const pillFill = background === 'sunken' ? '#FFFFFF' : '#F7F7F7';
  return (
    <>
      {imgLayer({ key: 'square1', left: 21, top: 71, width: 14.142, height: 14.142, imgWidth: 10, imgHeight: 10, rotate: 45, flipY: true, src: voiceMicSquare1 })}
      {imgLayer({ key: 'square2', left: 82.96, top: 28, width: 10.182, height: 10.182, imgWidth: 7.2, imgHeight: 7.2, rotate: 45, flipY: true, src: voiceMicSquare2 })}
      {imgLayer({ key: 'waveform', left: 3, top: 4.16, width: 77.997, height: 61.168, imgWidth: 70.588, imgHeight: 50, rotate: 170.31, flipY: true, src: voiceMicVideo })}
      <div
        className={styles.slot}
        style={{ left: 44, top: 40.38, width: 70.785, height: 75.222 }}
      >
        <div
          className={styles.micPill}
          style={{ width: 56.47, height: 62.744, background: pillFill, transform: 'scaleY(-1) rotate(-165deg)' }}
        />
      </div>
      {imgLayer({ key: 'hand', left: 81.14, top: 76.82, width: 21.35, height: 27.57, imgWidth: 28.429, imgHeight: 38.231, rotate: 15, flipX: true, src: voiceMicHand })}
    </>
  );
}

export default function EmptyImage({ type = 'video', background = 'base', className = '' }) {
  const resolvedBackground = BASE_TYPES_ONLY.has(type) ? 'base' : background;

  if (type === 'voice-microphone') {
    return (
      <div className={`${styles.emptyImage} ${className}`} aria-hidden="true">
        <VoiceMicrophone background={resolvedBackground} />
      </div>
    );
  }

  const variant = VARIANTS[type];
  const layers = variant ? variant[resolvedBackground] || variant.base : null;
  if (!layers) {
    return null;
  }
  return (
    <div className={`${styles.emptyImage} ${className}`} aria-hidden="true">
      {layers.map((layer) => imgLayer(layer))}
    </div>
  );
}
