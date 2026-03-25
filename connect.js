const form = document.getElementById("connect-form");
const backendUrlInput = document.getElementById("backendUrl");
const messageEl = document.getElementById("connect-message");
const btn = document.getElementById("connect-btn");

// =====================
// LOAD SAVED CONFIG
// =====================
(function preloadConfig() {
  try {
    const raw = localStorage.getItem("storeTemplateConfig");
    const config = raw ? JSON.parse(raw) : {};

    if (config.SERVER_BASE) {
      backendUrlInput.value = config.SERVER_BASE;
    }
  } catch (err) {
    console.error("Failed to preload config:", err);
  }
})();

// =====================
// SUBMIT
// =====================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  messageEl.textContent = "";
  btn.disabled = true;

  let backendUrl = (backendUrlInput.value || "").trim();

  if (!backendUrl) {
    messageEl.textContent = "Backend URL is required.";
    messageEl.style.color = "#b91c1c";
    btn.disabled = false;
    return;
  }

  backendUrl = backendUrl.replace(/\/+$/, "");

  const config = {
    SERVER_BASE: backendUrl,
    API_BASE: `${backendUrl}/api`
  };

  try {
    const res = await fetch(`${config.API_BASE}/test`, {
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Backend connection failed");
    }

    localStorage.setItem("storeTemplateConfig", JSON.stringify(config));

    messageEl.textContent = "Connection saved. Redirecting...";
    messageEl.style.color = "#166534";

    setTimeout(() => {
      window.location.href = "setup.html";
    }, 800);
  } catch (err) {
    console.error(err);
    messageEl.textContent =
      "Could not connect to backend. Check the URL and try again.";
    messageEl.style.color = "#b91c1c";
    btn.disabled = false;
  }
});