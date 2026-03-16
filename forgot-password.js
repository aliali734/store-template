// js/forgot-password.js

fetch("header.html")
  .then((res) => res.text())
  .then((html) => {
    const headerEl = document.getElementById("header");
    if (headerEl) {
      headerEl.innerHTML = html;
    }
  })
  .catch((err) => console.error("Failed to load header:", err));

async function ensureCsrf() {
  try {
    await fetch(`${API_BASE}/csrf`, {
      credentials: "include"
    });
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
  }
}

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
      msg.style.color = "red";
      msg.textContent = "Email is required.";
      btn.disabled = false;
      return;
    }

    try {
      await ensureCsrf();

      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaders()
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      msg.style.color = "green";
      msg.textContent =
        data.message || "If that email exists, we sent a reset link.";
    } catch (err) {
      console.error(err);
      msg.style.color = "red";
      msg.textContent = "Server error. Try again.";
    } finally {
      btn.disabled = false;
    }
  });
}