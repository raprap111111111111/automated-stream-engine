import { dom } from "./dom.js";
import { state } from "./state.js";
import { openVideoMetaModal, showToast } from "./modal.js";
import { formatDuration } from "./utils.js";
import { updatePlaybackStatus, updateSelectedFilesText } from "./dashboard.js";
import { saveVideo } from "./storage.js";

/**
 * Extracts resolution and duration from a video file URL
 */
export async function getVideoMetadata(url) {
    return new Promise((resolve) => {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = url;

        tempVideo.onloadedmetadata = () => {
            const width = tempVideo.videoWidth || 0;
            const height = tempVideo.videoHeight || 0;
            const durationSeconds = tempVideo.duration || 0;

            let resolution = "HD";
            if (width >= 3840 || height >= 2160) {
                resolution = "4K ULTRA HD";
            } else if (width >= 1920 || height >= 1080) {
                resolution = "FULL HD";
            }

            resolve({ durationSeconds, resolution });
        };

        tempVideo.onerror = () => {
            resolve({ durationSeconds: 30, resolution: "Unknown" });
        };
    });
}

/**
 * Generates a JPEG thumbnail from the 1-second mark of a video
 */
export function getVideoThumbnail(url) {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");

        video.src = url;
        video.muted = true;
        video.currentTime = 1;

        video.onloadeddata = () => {
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 180;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", 0.75));
        };

        video.onerror = () => {
            resolve("");
        };
    });
}

/**
 * Handles the logic for selecting and processing video files
 */
export async function handleFileUpload(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    for (const file of files) {
        // Prevent duplicate uploads based on file properties
        const alreadyExists = state.videos.some(
            (item) =>
                item.name === file.name &&
                item.fileSize === file.size &&
                item.lastModified === file.lastModified
        );

        if (alreadyExists) {
            showToast(`${file.name} is already loaded.`, "info");
            continue;
        }

        // Prompt for Brand Tag and Play Count
        const config = await openVideoMetaModal(file);

        if (!config) {
            showToast(`${file.name} skipped.`, "info");
            continue;
        }

        const url = URL.createObjectURL(file);
        const metadata = await getVideoMetadata(url);
        const thumbnailUrl = await getVideoThumbnail(url);

        const videoRecord = {
            sourceId: crypto.randomUUID(),
            name: file.name,
            file, // 👈 IMPORTANT (this is what gets stored)
            url,
            thumbnailUrl,
            brandTag: config.brandTag,
            targetPlayCount: config.targetPlayCount,
            durationSeconds: metadata.durationSeconds,
            resolution: metadata.resolution,
            fileSize: file.size,
            lastModified: file.lastModified,
        };

        // memory (UI)
        state.videos.push(videoRecord);

        // storage (IndexedDB)
        await saveVideo({
            ...videoRecord,
            url: undefined // do NOT store blob URL
        });

        showToast(`${file.name} added successfully.`, "success");
    }

    // UI Updates
    dom.fileInput.value = "";
    updateSelectedFilesText();
    renderLibrary();
    updatePlaybackStatus("Assets loaded");
}

/**
 * Renders the video cards in the Library view
 */
export function renderLibrary() {
    if (state.videos.length === 0) {
        dom.libraryList.innerHTML = `<div class="text-slate-500 p-8 text-center w-full">No videos loaded yet.</div>`;
        return;
    }

    dom.libraryList.innerHTML = state.videos
        .map(
            (video) => `
        <div class="soft-panel rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
          <div class="relative bg-black aspect-video">
            ${video.thumbnailUrl
                    ? `<img src="${video.thumbnailUrl}" class="w-full h-full object-cover" alt="${video.name}" />`
                    : `<div class="w-full h-full flex items-center justify-center text-slate-500">No preview</div>`
                }

            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            <div class="absolute left-3 bottom-3 right-3">
              <div class="font-semibold text-lg truncate text-white">${video.name}</div>
              <div class="text-xs text-slate-300 mt-1 uppercase tracking-wider">${video.brandTag}</div>
            </div>

            <div class="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-black/60 border border-white/10 text-white">
              ${formatDuration(video.durationSeconds)}
            </div>
          </div>

          <div class="p-4 text-sm text-slate-400 space-y-2 bg-white/5">
            <div class="flex justify-between">
              <span>Target Plays:</span>
              <span class="text-white font-medium">${video.targetPlayCount}</span>
            </div>
            <div class="flex justify-between">
              <span>Resolution:</span>
              <span class="text-blue-400 font-medium">${video.resolution}</span>
            </div>
          </div>
        </div>
      `
        )
        .join("");
}