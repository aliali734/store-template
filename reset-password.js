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
// READ URL PARAMS
// =====================
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");

// =====================
// ELEMENTS
// =====================
const form = document.getElementById("reset-form");
const msg = document.getElementById("msg");
const hint = document.getElementById("hint");
const btn = document.getElementById("btn");

// =====================
// PASSWORD VALIDATION
// =====================
function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

// =====================
// INVALID LINK CHECK
// =====================
if ((!token || !email) && msg && hint && btn) {
  msg.style.color = "#b91c1c";
  msg.textContent = "Invalid reset link";
  hint.textContent =
    "Please request a new reset link from the Forgot Password page.";
  btn.disabled = true;
}

// =====================
// FORM SUBMIT
// =====================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "";
    hint.textContent = "";
    btn.disabled = true;

    const newPassword = document.getElementById("newPassword")?.value || "";
    const confirmPassword =
      document.getElementById("confirmPassword")?.value || "";

    if (!token || !email) {
      msg.style.color = "#b91c1c";
      msg.textContent = "Invalid reset link";
      btn.disabled = false;
      return;
    }

    if (!isStrongPassword(newPassword)) {
      msg.style.color = "#b91c1c";
      msg.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
      btn.disabled = false;
      return;
    }

    if (newPassword !== confirmPassword) {
      msg.style.color = "#b91c1c";
      msg.textContent = "Passwords do not match.";
      btn.disabled = false;
      return;
    }

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
        },
        body: JSON.stringify({ token, email, newPassword })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.style.color = "#b91c1c";
        msg.textContent = data.message || "Reset failed";
        btn.disabled = false;
        return;
      }

      msg.style.color = "#166534";
      msg.textContent = "Password reset successful";
      hint.textContent = "Redirecting to login...";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      console.error(err);
      msg.style.color = "#b91c1c";
      msg.textContent = "Server error. Try again.";
      btn.disabled = false;
    }
  });
}