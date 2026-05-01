import { dom } from "./dom.js";
import { state } from "./state.js";
import { updatePlaybackStatus } from "./dashboard.js";
import { setSelectedBlock } from "./timeline.js";

export function playBlock(block) {
    if (!block || block.type !== "video") return;
    dom.videoPlayer.src = block.url;
    dom.videoPlayer.play().catch(() => updatePlaybackStatus("Autoplay Blocked"));

    dom.overlayTitle.textContent = block.title;
    dom.overlaySubtitle.textContent = `${block.brandTag} • ${block.resolution}`;
    setSelectedBlock(block.id);
    updatePlaybackStatus(`Playing: ${block.title}`);
}

export function startScheduler() {
    if (state.schedulerId) clearInterval(state.schedulerId);

    state.schedulerId = setInterval(() => {
        if (!state.scheduledBlocks.length) return;
        const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );

        const minutesNow = now.getHours() * 60 + now.getMinutes();

        const activeBlock = state.scheduledBlocks.find(b =>
            b.type === "video" && minutesNow >= b.startMinute && minutesNow < b.endMinute
        );

        if (activeBlock && dom.videoPlayer.dataset.currentId !== String(activeBlock.id)) {
            dom.videoPlayer.dataset.currentId = activeBlock.id;
            playBlock(activeBlock);
        }
    }, 1000);
    
    // Add this to your event listeners in app.js
    dom.playNowBtn.addEventListener("click", () => {
        if (dom.videoPlayer.src) {
            if (dom.videoPlayer.paused) {
                dom.videoPlayer.play();
                dom.playNowBtn.textContent = "⏸"; // Change icon to pause
            } else {
                dom.videoPlayer.pause();
                dom.playNowBtn.textContent = "▶";
            }
        } else {
            showToast("No video loaded in the player.", "error");
        }
    });
}