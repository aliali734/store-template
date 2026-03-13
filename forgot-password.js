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

const form = document.getElementById("forgot-form");
const msg = document.getElementById("msg");
const btn = document.getElementById("btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  btn.disabled = true;

  const email = document.getElementById("email").value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    // Always shows same message for security
    msg.style.color = "green";
    msg.textContent = data.message || "If that email exists, we sent a reset link.";

  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Server error. Try again.";
  } finally {
    btn.disabled = false;
  }
});