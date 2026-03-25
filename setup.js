const setupForm = document.getElementById("setup-form");
const setupMessage = document.getElementById("setup-message");
const setupBtn = document.getElementById("setup-btn");

// =====================
// CHECK IF ALREADY CONFIGURED
// =====================
(async function checkSetupStatus() {
  try {
    const data = await apiFetch("/setup/status");

    if (data.success && data.isConfigured) {
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Setup status check failed:", err);
  }
})();

// =====================
// GET CSRF TOKEN
// =====================
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/csrf`, {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));
    return data.csrfToken || null;
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
    return null;
  }
}

// =====================
// SUBMIT SETUP
// =====================
setupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  setupMessage.textContent = "";
  setupBtn.disabled = true;

  const payload = {
    storeName: document.getElementById("storeName")?.value || "",
    supportEmail: document.getElementById("supportEmail")?.value || "",
    phone: document.getElementById("phone")?.value || "",
    address: document.getElementById("address")?.value || "",
    currency: document.getElementById("currency")?.value || "USD",
    footerText: document.getElementById("footerText")?.value || "",
    facebook: document.getElementById("facebook")?.value || "",
    instagram: document.getElementById("instagram")?.value || "",
    tiktok: document.getElementById("tiktok")?.value || "",
    twitter: document.getElementById("twitter")?.value || "",
    whatsapp: document.getElementById("whatsapp")?.value || ""
  };

  if (!payload.storeName.trim()) {
    setupMessage.textContent = "Store name is required.";
    setupMessage.style.color = "#b91c1c";
    setupBtn.disabled = false;
    return;
  }

  try {
    const csrfToken = await getCsrfToken();

    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setupMessage.textContent = data.message || "Setup failed.";
      setupMessage.style.color = "#b91c1c";
      setupBtn.disabled = false;
      return;
    }

    setupMessage.textContent = "Store setup completed. Redirecting...";
    setupMessage.style.color = "#166534";

    setTimeout(() => {
      window.location.href = "setup-admin.html";
    }, 1000);
  } catch (err) {
    console.error(err);
    setupMessage.textContent = "Server error.";
    setupMessage.style.color = "#b91c1c";
    setupBtn.disabled = false;
  }
});