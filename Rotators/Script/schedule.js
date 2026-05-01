import { state } from "./state.js";
import { dom } from "./dom.js";

const EXCLUSION_PAIRS = [
  ["jollibee", "mang inasal"],
  ["mang inasal", "jollibee"],
];

function isConflictPair(leftBrand, rightBrand) {
  return EXCLUSION_PAIRS.some(
    ([left, right]) =>
      String(leftBrand).toLowerCase() === left &&
      String(rightBrand).toLowerCase() === right
  );
}

function markConflicts(blocks) {
  blocks.forEach((current, index) => {
    current.conflict = false;

    if (current.type !== "video") return;

    const prev = blocks[index - 1];
    const next = blocks[index + 1];

    if (prev?.type === "video" && isConflictPair(prev.brandTag, current.brandTag)) {
      current.conflict = true;
    }

    if (next?.type === "video" && isConflictPair(current.brandTag, next.brandTag)) {
      current.conflict = true;
    }
  });
}

export function buildSchedule() {
  const queue = [];

  state.videos.forEach((video) => {
    for (let i = 0; i < video.targetPlayCount; i += 1) {
      queue.push({
        type: "video",
        sourceId: video.sourceId,
        title: video.name,
        brandTag: video.brandTag,
        durationSeconds: video.durationSeconds,
        durationMinutes: Math.max(1, Math.ceil(video.durationSeconds / 60)),
        resolution: video.resolution,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        conflict: false,
      });
    }
  });

  const scheduleDate =
    dom.scheduleDate?.value || new Date().toISOString().slice(0, 10);

  let currentDateTime = new Date(`${scheduleDate}T00:00:00`);
  const endOfDay = new Date(`${scheduleDate}T23:59:59`);

  let currentMinute = 0;
  let blockId = 1;
  const blocks = [];

  queue.forEach((item) => {
    if (currentMinute >= 1440) return;

    const durationMinutes = Math.min(item.durationMinutes, 1440 - currentMinute);

    const startAt = new Date(currentDateTime);
    const endAt = new Date(
      currentDateTime.getTime() + durationMinutes * 60 * 1000
    );

    blocks.push({
      ...item,
      id: blockId++,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      startMinute: currentMinute,
      endMinute: currentMinute + durationMinutes,
      durationMinutes,
    });

    currentDateTime = endAt;
    currentMinute += durationMinutes;
  });

  if (currentMinute < 1440) {
    const startAt = new Date(currentDateTime);
    const endAt = endOfDay;

    blocks.push({
      id: blockId++,
      type: "gap",
      title: "Gap",
      brandTag: "Gap",
      durationSeconds: (1440 - currentMinute) * 60,
      durationMinutes: 1440 - currentMinute,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      startMinute: currentMinute,
      endMinute: 1440,
      resolution: "--",
      url: "",
      thumbnailUrl: "",
      conflict: false,
    });
  }

  markConflicts(blocks);

  state.scheduledBlocks = blocks;
  state.playbackQueue = blocks.filter((block) => block.type === "video");
  state.currentQueueIndex = 0;
}