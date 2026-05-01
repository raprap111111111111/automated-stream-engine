import { dom } from "./dom.js";

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  dom.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

export function openVideoMetaModal(file, defaults = {}) {
  return new Promise((resolve) => {
    dom.modalFileName.textContent = file.name;
    dom.modalBrandTag.value = defaults.brandTag ?? "";
    dom.modalPlayCount.value = defaults.targetPlayCount ?? "1";

    dom.videoMetaModal.classList.remove("hidden");

    function cleanup() {
      dom.modalSaveBtn.removeEventListener("click", handleSave);
      dom.modalCancelBtn.removeEventListener("click", handleCancel);
      dom.videoMetaModal.classList.add("hidden");
    }

    function handleSave() {
      const brandTag = dom.modalBrandTag.value.trim();
      const targetPlayCount = Number(dom.modalPlayCount.value);

      if (!brandTag) {
        showToast("Please enter a brand tag.", "error");
        return;
      }

      if (!Number.isInteger(targetPlayCount) || targetPlayCount <= 0) {
        showToast("Play count must be greater than 0.", "error");
        return;
      }

      cleanup();
      resolve({ brandTag, targetPlayCount });
    }

    function handleCancel() {
      cleanup();
      resolve(null);
    }

    dom.modalSaveBtn.addEventListener("click", handleSave);
    dom.modalCancelBtn.addEventListener("click", handleCancel);
  });
}