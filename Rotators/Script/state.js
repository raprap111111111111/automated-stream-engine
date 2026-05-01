export const EXCLUSION_PAIRS = [
  ["jollibee", "mang inasal"],
  ["mang inasal", "jollibee"]
];

export let state = {
  videos: [],
  scheduledBlocks: [],
  playbackQueue: [],
  currentQueueIndex: 0,
  selectedBlockId: null,
  isPlayingSession: false,

  // REQUIRED for scheduler
  schedulerId: null,

  // REQUIRED for date-based scheduling
  scheduleDate: null
};

export function updateState(newState) {
  Object.assign(state, newState);
}