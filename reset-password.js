const API_BASE = "https://shoe-store-api.onrender.com/api";

// Load header
fetch("header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;
    if (typeof setupAuthHeader === "function") setupAuthHeader();
  });

// If already logged in, go to user page
(function redirectIfLoggedIn() {
  const token = localStorage.getItem("token");
  if (token) window.location.href = "user.html";
})();

// Read token + email from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");

const form = document.getElementById("reset-form");
const msg = document.getElementById("msg");
const hint = document.getElementById("hint");
const btn = document.getElementById("btn");

if (!token || !email) {
  msg.style.color = "red";
  msg.textContent = "Invalid reset link ❌";
  hint.textContent = "Please request a new reset link from Forgot Password page.";
  btn.disabled = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  hint.textContent = "";
  btn.disabled = true;

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword.length < 6) {
    msg.style.color = "red";
    msg.textContent = "Password must be at least 6 characters.";
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
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, newPassword })
    });

    const data = await res.json();

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
    msg.style.color = "red";
    msg.textContent = "Server error. Try again.";
    btn.disabled = false;
  }
});