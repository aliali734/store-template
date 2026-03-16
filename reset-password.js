// js/reset-password.js

// Load header
fetch("header.html")
  .then((res) => res.text())
  .then((html) => {
    const headerEl = document.getElementById("header");
    if (headerEl) {
      headerEl.innerHTML = html;
      if (typeof setupAuthHeader === "function") setupAuthHeader();
    }
  })
  .catch((err) => console.error("Failed to load header:", err));

// Ensure CSRF cookie exists
async function ensureCsrf() {
  try {
    if (!getCookie("csrfToken")) {
      await fetch(`${API_BASE}/test/user`, {
        credentials: "include"
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
  }
}

// Read token + email from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");

const form = document.getElementById("reset-form");
const msg = document.getElementById("msg");
const hint = document.getElementById("hint");
const btn = document.getElementById("btn");

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

if ((!token || !email) && msg && hint && btn) {
  msg.style.color = "red";
  msg.textContent = "Invalid reset link ❌";
  hint.textContent = "Please request a new reset link from Forgot Password page.";
  btn.disabled = true;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "";
    hint.textContent = "";
    btn.disabled = true;

    const newPassword = document.getElementById("newPassword")?.value || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value || "";

    if (!token || !email) {
      msg.style.color = "red";
      msg.textContent = "Invalid reset link ❌";
      btn.disabled = false;
      return;
    }

    if (!isStrongPassword(newPassword)) {
      msg.style.color = "red";
      msg.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
      btn.disabled = false;
      return;
    }

    if (newPassword !== confirmPassword) {
      msg.style.color = "red";
      msg.textContent = "Passwords do not match.";
      btn.disabled = false;
      return;
    }

    try {
      await ensureCsrf();

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaders()
        },
        body: JSON.stringify({ token, email, newPassword })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.style.color = "red";
        msg.textContent = data.message || "Reset failed ❌";
        btn.disabled = false;
        return;
      }

      msg.style.color = "green";
      msg.textContent = "Password reset successful ✅";
      hint.textContent = "Redirecting to login...";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      console.error(err);
      msg.style.color = "red";
      msg.textContent = "Server error. Try again.";
      btn.disabled = false;
    }
  });
}