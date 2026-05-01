import { dom } from "./dom.js";
import { state } from "./state.js";
import { bindNavigation, switchView } from "./ui.js";
import { startClock, updateTopStats, updateSelectedFilesText } from "./dashboard.js";
import { handleFileUpload, renderLibrary } from "./library.js";
import { buildSchedule } from "./schedule.js";
import { renderTimeline } from "./timeline.js";
import { startScheduler } from "./player.js";
import { loadVideos, clearVideos } from "./storage.js";
import { showToast } from "./modal.js"; // add at top if not yet
import { openInspector, closeInspector } from "./inspector.js";

startClock();
bindNavigation();

document
  .getElementById("openInspectorBtn")
  ?.addEventListener("click", openInspector);

document
  .getElementById("closeInspectorBtn")
  ?.addEventListener("click", closeInspector);

dom.fileInput.addEventListener("change", handleFileUpload);

dom.generateScheduleBtn.addEventListener("click", () => {
    if (state.videos.length === 0) return;

    if (!dom.scheduleDate.value) {
        showToast("Please select a schedule date first.", "error");
        return;
    }

    state.scheduleDate = dom.scheduleDate.value;

    buildSchedule();
    renderTimeline();
    updateTopStats();
    switchView("dashboard");
    startScheduler();
});

dom.resetBtn.addEventListener("click", async () => {
    state.videos.forEach((video) => {
        if (video.url) URL.revokeObjectURL(video.url);
    });

    state.videos = [];
    state.scheduledBlocks = [];
    state.playbackQueue = [];
    state.currentQueueIndex = 0;
    state.selectedBlockId = null;

    await clearVideos();

    renderLibrary();
    renderTimeline();
    updateSelectedFilesText();
    updateTopStats();

    dom.videoPlayer.pause();
    dom.videoPlayer.removeAttribute("src");
    dom.videoPlayer.load();
});

async function boot() {
    const savedVideos = await loadVideos();

    state.videos = savedVideos.map((video) => ({
        ...video,
        url: URL.createObjectURL(video.file),
    }));

    renderLibrary();
    renderTimeline();
    updateSelectedFilesText();
    updateTopStats();
}

boot();