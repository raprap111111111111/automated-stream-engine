export function formatMinutesToClock(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.floor(totalMinutes % 60);

  const suffix = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(seconds) {
  const total = Math.max(1, Math.round(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getBrandColor(brand) {
  const normalized = String(brand || "").toLowerCase();

  if (normalized === "jollibee") {
    return "linear-gradient(135deg, #ef4444, #b91c1c)";
  }

  if (normalized === "mang inasal") {
    return "linear-gradient(135deg, #f59e0b, #b45309)";
  }

  if (normalized === "gap") {
    return "linear-gradient(135deg, #64748b, #334155)";
  }

  return "linear-gradient(135deg, #3b82f6, #1d4ed8)";
}