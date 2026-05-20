// =====================
// 3D MODEL ADMIN PANEL
// =====================
(function () {
  const openBtn      = document.getElementById("openModelModal");
  const closeBtn     = document.getElementById("closeModelModal");
  const modelModal   = document.getElementById("modelModal");
  const overlay      = document.getElementById("overlay");
  const modelForm    = document.getElementById("model-form");
  const modelUpload  = document.getElementById("model-upload");
  const modelMessage = document.getElementById("modelMessage");
  const modelInfo    = document.getElementById("current-model-info");
  const deleteBtn    = document.getElementById("deleteModelBtn");

  if (!openBtn || !modelModal) return;

  // ── Open ────────────────────────────────────────────────────────
  openBtn.addEventListener("click", () => {
    modelModal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    loadCurrentModel();
  });

  // ── Close ───────────────────────────────────────────────────────
  closeBtn?.addEventListener("click", closeModelModal);

  function closeModelModal() {
    modelModal.classList.add("hidden");
    overlay.classList.add("hidden");
    if (modelMessage) modelMessage.textContent = "";
  }

  // Make closeable from overlay click (overlay handler is in admin.js)
  window.closeModelModal = closeModelModal;

  // ── Load current model info ─────────────────────────────────────
  async function loadCurrentModel() {
    if (!modelInfo) return;
    modelInfo.textContent = "Checking current model...";

    try {
      const res  = await fetch(`${API_BASE}/api/model`, {
        credentials: "include"
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        modelInfo.innerHTML = `
          ✅ Model active: 
          <a href="${data.modelUrl}" target="_blank" rel="noopener" 
             style="color:#1d4ed8;">
            ${data.modelUrl}
          </a>
        `;
      } else {
        modelInfo.textContent = "⚠️ No model uploaded yet.";
      }
    } catch (err) {
      modelInfo.textContent = "❌ Could not reach server.";
    }
  }

  // ── Upload ──────────────────────────────────────────────────────
  modelForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = modelUpload?.files?.[0];
    if (!file) {
      showMsg("Please select a .glb or .gltf file.", "error");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["glb", "gltf"].includes(ext)) {
      showMsg("Only .glb and .gltf files are allowed.", "error");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showMsg("File exceeds 50 MB limit.", "error");
      return;
    }

    showMsg("Uploading...", "info");

    const formData = new FormData();
    formData.append("model", file);

    try {
      const data = await window.adminApiFetch("/api/model", {
        method: "PUT",
        body: formData
      });

      showMsg("✅ Model uploaded successfully!", "success");
      loadCurrentModel();
      modelForm.reset();
    } catch (err) {
      showMsg(err.message || "Upload failed.", "error");
    }
  });

  // ── Delete ──────────────────────────────────────────────────────
  deleteBtn?.addEventListener("click", async () => {
    if (!confirm("Remove the current 3D model from the hero section?")) return;

    try {
      await window.adminApiFetch("/api/model", { method: "DELETE" });
      showMsg("Model removed.", "success");
      loadCurrentModel();
    } catch (err) {
      showMsg(err.message || "Delete failed.", "error");
    }
  });

  // ── Message helper ──────────────────────────────────────────────
  function showMsg(text, type) {
    if (!modelMessage) return;
    modelMessage.textContent = text;
    modelMessage.style.color =
      type === "success" ? "#166534" :
      type === "error"   ? "#b91c1c" :
                           "#374151";
  }
})();