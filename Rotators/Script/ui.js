import { dom } from "./dom.js";

export function switchView(view) {
  dom.dashboardView.classList.add("hidden");
  dom.libraryView.classList.add("hidden");
  dom.settingsView.classList.add("hidden");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5";
  });

  if (view === "dashboard") {
    dom.dashboardView.classList.remove("hidden");
  }

  if (view === "library") {
    dom.libraryView.classList.remove("hidden");
  }

  if (view === "settings") {
    dom.settingsView.classList.remove("hidden");
  }

  const activeBtn = document.querySelector(`[data-view="${view}"]`);

  if (activeBtn) {
    activeBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600/20 text-blue-400 border-l-4 border-blue-500";
  }
}

export function bindNavigation() {
  // Sidebar buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Header buttons (The ones in the middle of the screen)
  const headerButtons = document.querySelectorAll("header .hidden.md\\:flex button");
  headerButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.textContent.toLowerCase();
      if (view === "dashboard" || view === "library") {
        switchView(view);
      }
    });
  });

  dom.newBroadcastBtn.addEventListener("click", () => switchView("library"));
}
