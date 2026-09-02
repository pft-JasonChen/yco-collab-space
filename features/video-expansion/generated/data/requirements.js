/**
 * L2 — Video Expansion preconditions.
 *
 * Pure predicates only: no React, no DOM, no imports. Each one answers a single
 * "may the user do this yet?" question, so the same rule can be reused by the
 * panel, the action bar and a future submit path without being restated.
 */
import { MAX_SELECTED_SECONDS, MIN_SELECTED_SECONDS, SOURCE_STATES } from './defaults.js';

export function isSourceLoaded(sourceState) {
  return sourceState === SOURCE_STATES.LOADED;
}

export function selectedDuration(trimStart, trimEnd) {
  return Math.max(0, trimEnd - trimStart);
}

export function isSelectionWithinLimits(trimStart, trimEnd) {
  const duration = selectedDuration(trimStart, trimEnd);
  return duration >= MIN_SELECTED_SECONDS && Math.floor(duration) <= MAX_SELECTED_SECONDS;
}

/** The Generate action is enabled only when a usable segment is selected. */
export function canGenerate({ sourceState, trimStart, trimEnd }) {
  return isSourceLoaded(sourceState) && isSelectionWithinLimits(trimStart, trimEnd);
}

/** A source longer than the cap must be trimmed before it can be edited. */
export function requiresInitialTrim(durationSeconds) {
  return durationSeconds > MAX_SELECTED_SECONDS;
}

/** Segment a freshly loaded local file starts with. */
export function initialTrimRange(durationSeconds) {
  return { start: 0, end: Math.min(MAX_SELECTED_SECONDS, durationSeconds) };
}
