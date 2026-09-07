/**
 * L2 — Video Expansion defaults and identifiers.
 *
 * Pure data only: no React, no DOM, no imports. Values that PM owns live in
 * `product/mocks/video-expansion.json`; this file holds the product constants
 * the code depends on structurally.
 */

/** Longest segment the feature will submit. Also the trim dialog's cap. */
export const MAX_SELECTED_SECONDS = 30;

/** Shortest segment that still produces a usable result. */
export const MIN_SELECTED_SECONDS = 1;

/** Ratio selected when the editor opens or resets. */
export const DEFAULT_RATIO = '16:9';

/** Accepted upload types for the local file picker. */
export const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/quicktime,video/webm';

/** Where the current source came from; drives the History badge. */
export const ENTRY_SOURCES = {
  LOCAL_UPLOAD: 'local-upload',
  HISTORY_RESULT: 'history-result',
};

/** Source-media lifecycle. */
export const SOURCE_STATES = {
  EMPTY: 'empty',
  LOADED: 'loaded',
  ERROR: 'error',
};

/** Synthetic generation lifecycle. */
export const GENERATION_STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
};

/** Ratio options that carry a stable test id for rendered validation. */
const RATIO_TEST_IDS = {
  '16-9': 'ratio-16-9',
  '9-16': 'ratio-9-16',
  '3-4': 'ratio-3-4',
};

export function ratioTestId(option) {
  return RATIO_TEST_IDS[option.id];
}
