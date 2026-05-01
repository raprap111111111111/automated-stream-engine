import { dom } from "./dom.js";
import { state } from "./state.js";

export function updateClock() {
  const now = new Date();
  const nowPH = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
);

dom.clockText.textContent = nowPH.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
}

export function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

export function updateTopStats() {
  const scheduledRealBlocks = state.scheduledBlocks.filter((block) => block.type === "video");
  const gapBlocks = state.scheduledBlocks.filter((block) => block.type === "gap");
  const totalGapMinutes = gapBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const conflictCount = scheduledRealBlocks.filter((block) => block.conflict).length;

  dom.scheduledCount.textContent = String(scheduledRealBlocks.length).padStart(2, "0");
  dom.conflictCountText.textContent = `Conflicts: ${conflictCount}`;

  const gapHours = Math.floor(totalGapMinutes / 60);
  const gapMins = totalGapMinutes % 60;

  dom.gapTimeText.textContent = `${String(gapHours).padStart(2, "0")}:${String(gapMins).padStart(2, "0")}`;

  const gapPercent = Math.min(100, (totalGapMinutes / 1440) * 100);
  dom.gapBar.style.width = `${gapPercent}%`;
}

export function updatePlaybackStatus(message = "Waiting") {
  const currentBlock = state.playbackQueue[state.currentQueueIndex];

  dom.statusText.textContent = message;
  dom.nowPlayingText.textContent = currentBlock ? currentBlock.title : "None";
  dom.remainingText.textContent = String(Math.max(state.playbackQueue.length - state.currentQueueIndex, 0));
}

export function updateSelectedFilesText() {
  dom.selectedFilesText.textContent =
    state.videos.length > 0
      ? `${state.videos.length} video(s) loaded`
      : "No files selected";
}