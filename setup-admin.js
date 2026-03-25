const form = document.getElementById("setup-admin-form");
const messageEl = document.getElementById("setup-admin-message");
const btn = document.getElementById("setup-admin-btn");

// =====================
// CHECK IF ADMIN EXISTS
// =====================
(async function checkAdminSetupStatus() {
  try {
    const data = await apiFetch("/setup-admin/status");

    if (data.success && data.adminExists) {
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("Admin setup status check failed:", err);
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
// SUBMIT
// =====================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  messageEl.textContent = "";
  btn.disabled = true;

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim().toLowerCase();
  const password = document.getElementById("password")?.value.trim();
  const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

  if (!name || !email || !password || !confirmPassword) {
    messageEl.textContent = "All fields are required.";
    messageEl.style.color = "#b91c1c";
    btn.disabled = false;
    return;
  }

  if (password !== confirmPassword) {
    messageEl.textContent = "Passwords do not match.";
    messageEl.style.color = "#b91c1c";
    btn.disabled = false;
    return;
  }

  try {
    const csrfToken = await getCsrfToken();

    const res = await fetch(`${API_BASE}/setup-admin`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      messageEl.textContent = data.message || "Failed to create admin.";
      messageEl.style.color = "#b91c1c";
      btn.disabled = false;
      return;
    }

    messageEl.textContent = "Admin created successfully. Redirecting...";
    messageEl.style.color = "#166534";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Server error.";
    messageEl.style.color = "#b91c1c";
    btn.disabled = false;
  }
});