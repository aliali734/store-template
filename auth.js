const API_BASE = "https://shoe-store-api.onrender.com/api";

// =====================
// COOKIE HELPERS
// =====================

function getCookie(name) {
  const value = document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

function csrfHeaders() {
  const csrf = getCookie("csrfToken");
  return csrf ? { "x-csrf-token": csrf } : {};
}

// =====================
// ENSURE CSRF COOKIE
// =====================

async function ensureCsrf() {
  try {
    if (!getCookie("csrfToken")) {
      await fetch(`${API_BASE}/test/user`, {
        credentials: "include"
      });
    }
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
  }
}

// =====================
// UI MESSAGE
// =====================

const authMessage = document.getElementById("auth-message");

function showMessage(message, color = "red") {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.style.color = color;
}

function clearMessage() {
  if (!authMessage) return;
  authMessage.textContent = "";
}

// =====================
// AUTO REDIRECT (LOGIN/REGISTER PAGES)
// =====================

(async function redirectIfLoggedIn() {

  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  const isAuthPage = page === "login.html" || page === "register.html";

  if (!isAuthPage) return;

  try {

    await ensureCsrf();

    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    if (res.ok) {
      window.location.href = "user.html";
    }

  } catch (err) {
    console.error("Token verification failed:", err);
  }

})();

// =====================
// SAFE JSON PARSER
// =====================

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// =====================
// REGISTER
// =====================

const registerForm = document.getElementById("register-form");

if (registerForm) {

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();
    clearMessage();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (name.length < 2)
      return showMessage("Name must be at least 2 characters");

    if (!email.includes("@"))
      return showMessage("Invalid email format");

    if (password.length < 8)
      return showMessage("Password must be at least 8 characters");

    try {

      await ensureCsrf();

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaders()
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await safeJson(res);

      if (!res.ok)
        return showMessage(data.message || "Register failed ❌");

      showMessage("Registered successfully ✅ Redirecting...", "green");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);

    } catch (err) {
      console.error(err);
      showMessage("Server error");
    }

  });

}

// =====================
// LOGIN
// =====================

const loginForm = document.getElementById("login-form");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();
    clearMessage();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (!email.includes("@"))
      return showMessage("Invalid email format");

    if (password.length < 8)
      return showMessage("Password must be at least 8 characters");

    try {

      await ensureCsrf();

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaders()
        },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(res);

      if (!res.ok)
        return showMessage(data.message || "Login failed ❌");

      showMessage("Login successful ✅ Redirecting...", "green");

      setTimeout(() => {
        window.location.href = "user.html";
      }, 700);

    } catch (err) {
      console.error(err);
      showMessage("Server error");
    }

  });

}

// =====================
// LOGOUT
// =====================

async function logout() {

  try {

    await ensureCsrf();

    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...csrfHeaders()
      }
    });

  } catch (err) {
    console.error("Logout failed:", err);
  }

  window.location.href = "login.html";

}

window.logout = logout;