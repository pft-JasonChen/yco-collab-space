import { useCallback, useSyncExternalStore } from 'react';

/**
 * RD keeps the like/dislike reaction for a result in a central store
 * (`state.task.videoHistoryDetailedData.reactions[videoId]`) so the History card
 * and the detail dialog always agree about the same result. Redux is outside the
 * platform-UI boundary for this pilot, so the shared component owns an equivalent
 * module-level store instead. It is prototype state only: nothing is persisted and
 * nothing leaves the browser tab.
 */
let reactions = {};
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVideoReaction(videoId) {
  return reactions[videoId] ?? null;
}

export function toggleVideoReaction(videoId, reaction) {
  if (!videoId) return;
  const next = { ...reactions };
  if (next[videoId] === reaction) delete next[videoId];
  else next[videoId] = reaction;
  reactions = next;
  emit();
}

export function resetVideoReactions() {
  reactions = {};
  emit();
}

export function useVideoReaction(videoId) {
  const reaction = useSyncExternalStore(
    subscribe,
    () => getVideoReaction(videoId),
    () => null,
  );
  const toggle = useCallback((next) => toggleVideoReaction(videoId, next), [videoId]);
  return [reaction, toggle];
}
