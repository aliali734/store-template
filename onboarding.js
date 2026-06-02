(function () {
  const currentPage = (location.pathname.split("/").pop() || "").toLowerCase();

  // Pages that are allowed before setup is complete
  const allowedWithoutRedirect = ["setup.html", "setup-admin.html"];

  async function checkJson(url) {
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function runOnboardingCheck() {
    try {
      // API_BASE is defined in config.js (hardcoded Render URL)
      const apiBase = API_BASE.replace(/\/+$/, "");

      // Step 1: store settings configured?
      const setupData = await checkJson(`${apiBase}/setup/status`);

      if (!setupData.success || !setupData.isConfigured) {
        if (currentPage !== "setup.html") {
          window.location.href = "setup.html";
        }
        return;
      }

      // Step 2: admin exists?
      const adminData = await checkJson(`${apiBase}/setup-admin/status`);

      if (!adminData.success || !adminData.adminExists) {
        if (currentPage !== "setup-admin.html") {
          window.location.href = "setup-admin.html";
        }
        return;
      }

      // Fully configured — move setup pages users to login
      if (
        currentPage === "setup.html" ||
        currentPage === "setup-admin.html"
      ) {
        window.location.href = "login.html";
      }
    } catch (err) {
      console.error("Onboarding check failed:", err);
      // If backend is unreachable, don't redirect — let the page handle it
    }
  }

  document.addEventListener("DOMContentLoaded", runOnboardingCheck);
})();