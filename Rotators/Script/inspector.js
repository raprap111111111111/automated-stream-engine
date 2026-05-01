export function openInspector() {
  document
    .getElementById("inspectorPanel")
    ?.classList.remove("translate-x-full");
}

export function closeInspector() {
  document
    .getElementById("inspectorPanel")
    ?.classList.add("translate-x-full");
}