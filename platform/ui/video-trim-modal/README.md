# Shared VideoTrimModal

Approved platform extraction of the AI Agent video-trim presentation and interaction
from the RD snapshot at `/Users/jasonchen/Downloads/yce-frontend-gm-260909`.

## RD sources

- `src/components/ai-agent-page/components/video-trim-modal/index.js`
- `src/components/ai-agent-page/components/video-trim-modal/use-video-trim.js`
- `src/components/ai-agent-page/components/video-trim-modal/trim-video-preview.js`
- `src/components/ai-agent-page/components/video-trim-modal/trim-timeline.js`
- `src/components/ai-agent-page/components/video-trim-modal/use-trim-drag.js`
- `src/components/ai-agent-page/components/video-trim-modal/use-frame-thumbnails.js`
- `src/components/ai-agent-page/components/video-trim-modal/constants.js`

## Platform adaptations

- Replaced Next.js aliases, Redux, i18n, RD Portal, browser utilities and image
  wrappers with a portable React API.
- Preserved the preview, playback, mute, filmstrip, range handles, playhead and
  confirm/cancel behavior.
- Kept `mediabunny` thumbnail decoding for local `File` inputs and added a supplied
  thumbnail fallback for deterministic prototype assets.
- Parameterized minimum and maximum trim durations. The RD defaults remain 5 and
  60 seconds; Video Expansion passes 1 and 30 seconds.
- `maximumSeconds` is enforced while dragging: each handle stops at the maximum
  window relative to the opposite handle, so a longer segment cannot be selected.
  The `invalid-range` confirm guard stays as a defensive check for supplied ranges.
- Uses only the repository's existing RD CSS variables.

The component selects a range; it does not encode, upload or call a backend.
