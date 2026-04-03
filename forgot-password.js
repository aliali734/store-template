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
// FORM
// =====================
const form = document.getElementById("forgot-form");
const msg = document.getElementById("msg");
const btn = document.getElementById("btn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "";
    btn.disabled = true;

    const email = document.getElementById("email")?.value.trim().toLowerCase();

    if (!email) {
      msg.style.color = "#b91c1c";
      msg.textContent = "Email is required.";
      btn.disabled = false;
      return;
    }

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      msg.style.color = "#166534";
      msg.textContent =
        data.message || "If that email exists, we sent a reset link.";
    } catch (err) {
      console.error(err);
      msg.style.color = "#b91c1c";
      msg.textContent = "Server error. Try again.";
    } finally {
      btn.disabled = false;
    }
  });
}