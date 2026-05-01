import { dom } from "./dom.js";
import { state } from "./state.js";
import { getBrandColor, formatMinutesToClock, formatDuration } from "./utils.js";
import { openInspector } from "./inspector.js";

export function setSelectedBlock(blockId) {
    state.selectedBlockId = blockId;

    const block = state.scheduledBlocks.find((item) => item.id === blockId);

    document.querySelectorAll(".timeline-block").forEach((el) => {
        el.classList.toggle("selected", el.dataset.id === String(blockId));
    });

    if (!block || block.type !== "video") {
        dom.metaTitle.textContent = "No clip selected";
        dom.metaDuration.textContent = "--:--";
        dom.metaStartTime.textContent = "--:--";
        dom.metaResolution.textContent = "Unknown";
        dom.metaBrand.textContent = "--";
        dom.metaConflict.textContent = "No";
        return;
    }

    dom.metaTitle.textContent = block.title;
    dom.metaDuration.textContent = formatDuration(block.durationSeconds);
    dom.metaStartTime.textContent = formatMinutesToClock(block.startMinute);
    dom.metaResolution.textContent = block.resolution;
    dom.metaBrand.textContent = block.brandTag;
    dom.metaConflict.textContent = block.conflict ? "Yes" : "No";
    dom.metaConflict.className = block.conflict
        ? "text-lg text-rose-400"
        : "text-lg text-emerald-300";

    if (dom.overlayTitle) {
        dom.overlayTitle.textContent = block.title;
    }

    if (dom.overlaySubtitle) {
        dom.overlaySubtitle.textContent = `${block.brandTag.toUpperCase()} • ${block.resolution}`;
    }
}

function isOverlapping(a, b) {
    return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

function assignTimelineLanes(blocks) {
    const lanes = [];
    const minVisualMinutes = 90; // 110px-like spacing on timeline

    const sortedBlocks = [...blocks].sort((a, b) => a.startMinute - b.startMinute);

    return sortedBlocks.map((block) => {
        const visualEndMinute = Math.max(
            block.endMinute,
            block.startMinute + minVisualMinutes
        );

        let assignedLane = -1;

        for (let laneIndex = 0; laneIndex < lanes.length; laneIndex += 1) {
            const lane = lanes[laneIndex];

            const overlapsLane = lane.some((existing) => {
                const existingVisualEnd = Math.max(
                    existing.endMinute,
                    existing.startMinute + minVisualMinutes
                );

                return (
                    block.startMinute < existingVisualEnd &&
                    visualEndMinute > existing.startMinute
                );
            });

            if (!overlapsLane) {
                assignedLane = laneIndex;
                break;
            }
        }

        if (assignedLane === -1) {
            assignedLane = lanes.length;
            lanes.push([]);
        }

        block.lane = assignedLane;
        lanes[assignedLane].push(block);

        return block;
    });
}

export function renderTimeline() {
    dom.timelineTrack.innerHTML = "";

    if (state.scheduledBlocks.length === 0) {
        dom.timelineTrack.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center text-slate-500">
        No schedule generated yet.
      </div>
    `;
        return;
    }

    const visibleBlocks = assignTimelineLanes(
        state.scheduledBlocks.filter((block) => block.type === "video")
    );

    const laneHeight = 92;
    const laneCount = visibleBlocks.length
        ? Math.max(...visibleBlocks.map((block) => block.lane)) + 1
        : 1;

    dom.timelineTrack.style.height = `${Math.max(
        128,
        laneCount * laneHeight + 24
    )}px`;

    visibleBlocks.forEach((block) => {
        const el = document.createElement("div");
        el.className = "timeline-block";
        el.dataset.id = String(block.id);

        const left = (block.startMinute / 1440) * 100;
        const width = ((block.endMinute - block.startMinute) / 1440) * 100;

        el.style.left = `${left}%`;
        el.style.width = `${Math.max(width, 2)}%`;
        el.style.minWidth = "110px";
        el.style.top = `${block.lane * laneHeight + 10}px`;
        el.style.background = block.conflict
            ? "#be123c"
            : getBrandColor(block.brandTag);

        el.innerHTML = `
      <div class="timeline-thumb-card">
        ${block.thumbnailUrl
                ? `<img src="${block.thumbnailUrl}" class="timeline-thumb-img" alt="${block.title}" draggable="false" />`
                : `<div class="timeline-thumb-empty"></div>`
            }

        <div class="timeline-thumb-overlay"></div>

        <div class="timeline-thumb-content">
          <div class="timeline-thumb-title">${block.title}</div>
          <div class="timeline-thumb-meta">
            ${formatMinutesToClock(block.startMinute)} • ${block.brandTag}
          </div>
        </div>
      </div>
    `;

        el.addEventListener("click", () => {
            setSelectedBlock(block.id);
            openInspector();
        });

        el.addEventListener("pointerdown", (event) => {
            event.preventDefault();

            el.setPointerCapture(event.pointerId);

            const startX = event.clientX;
            const originalStart = block.startMinute;

            dom.dragTimeTooltip.classList.remove("hidden");
            dom.dragTimeText.textContent = formatMinutesToClock(block.startMinute);
            dom.dragTimeTooltip.style.left = `${event.clientX + 14}px`;
            dom.dragTimeTooltip.style.top = `${event.clientY + 14}px`;

            function onMove(moveEvent) {
                const deltaX = moveEvent.clientX - startX;
                const minutesPerPixel = 1440 / dom.timelineTrack.offsetWidth;
                const deltaMinutes = Math.round(deltaX * minutesPerPixel);

                let newStart = originalStart + deltaMinutes;

                newStart = Math.max(
                    0,
                    Math.min(1440 - block.durationMinutes, newStart)
                );

                block.startMinute = newStart;
                block.endMinute = newStart + block.durationMinutes;

                const nextLeft = (block.startMinute / 1440) * 100;
                el.style.left = `${nextLeft}%`;

                dom.dragTimeText.textContent = formatMinutesToClock(block.startMinute);
                dom.dragTimeTooltip.style.left = `${moveEvent.clientX + 14}px`;
                dom.dragTimeTooltip.style.top = `${moveEvent.clientY + 14}px`;

                setSelectedBlock(block.id);
            }

            function onUp() {
                el.releasePointerCapture(event.pointerId);
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerup", onUp);

                dom.dragTimeTooltip.classList.add("hidden");

                renderTimeline();
                setSelectedBlock(block.id);
            }

            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerup", onUp);
        });

        dom.timelineTrack.appendChild(el);
    });
}