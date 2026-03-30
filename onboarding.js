(function () {
  const currentPage = (location.pathname.split("/").pop() || "").toLowerCase();

  const allowedWithoutRedirect = [
    "connect.html",
    "setup.html",
    "setup-admin.html"
  ];

  function getSavedAppConfig() {
    try {
      const raw = localStorage.getItem("storeTemplateConfig");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  async function checkJson(url) {
    const res = await fetch(url, {
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function runOnboardingCheck() {
    try {
      const savedConfig = getSavedAppConfig();

      // Step 1: backend URL not saved yet
      if (!savedConfig.API_BASE || !savedConfig.SERVER_BASE) {
        if (!allowedWithoutRedirect.includes(currentPage)) {
          window.location.href = "connect.html";
        }
        return;
      }

      const apiBase = savedConfig.API_BASE.replace(/\/+$/, "");

      // Step 2: store settings configured?
      const setupData = await checkJson(`${apiBase}/setup/status`);

      if (!setupData.success || !setupData.isConfigured) {
        if (currentPage !== "setup.html") {
          window.location.href = "setup.html";
        }
        return;
      }

      // Step 3: admin exists?
      const adminData = await checkJson(`${apiBase}/setup-admin/status`);

      if (!adminData.success || !adminData.adminExists) {
        if (currentPage !== "setup-admin.html") {
          window.location.href = "setup-admin.html";
        }
        return;
      }

      // If fully configured and user is still on setup pages, move them to login
      if (
        currentPage === "connect.html" ||
        currentPage === "setup.html" ||
        currentPage === "setup-admin.html"
      ) {
        window.location.href = "login.html";
      }
    } catch (err) {
      console.error("Onboarding check failed:", err);

      // If we cannot even verify state, safest fallback is connect page
      if (!allowedWithoutRedirect.includes(currentPage)) {
        window.location.href = "connect.html";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", runOnboardingCheck);
})();