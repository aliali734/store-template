const API_BASE = "https://shoe-store-api.onrender.com/api";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

function csrfHeaders() {
  const csrf = getCookie("csrfToken");
  return csrf ? { "x-csrf-token": csrf } : {};
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
// AUTO REDIRECT (ONLY ON LOGIN/REGISTER PAGES)
// =====================
(async function redirectIfLoggedIn() {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  const isAuthPage = page === "login.html" || page === "register.html";
  if (!isAuthPage) return;

  try {
    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    if (res.ok) window.location.href = "user.html";
  } catch (err) {
    console.error("Token verification failed on auth pages:", err);
  }
})();

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

    if (name.length < 2) return showMessage("Name must be at least 2 characters");
    if (!email.includes("@")) return showMessage("Invalid email format");
    if (password.length < 8) return showMessage("Password must be at least 8 characters");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
           ...csrfHeaders()
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) return showMessage(data.message || "Register failed ❌");

      showMessage("Registered successfully ✅ Redirecting...", "green");
      setTimeout(() => (window.location.href = "login.html"), 900);
    } catch (err) {
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

    if (!email.includes("@")) return showMessage("Invalid email format");
    if (password.length < 8) return showMessage("Password must be at least 8 characters");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
           ...csrfHeaders()
         },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) return showMessage(data.message || "Login failed ❌");

      showMessage("Login successful ✅ Redirecting...", "green");
      setTimeout(() => (window.location.href = "user.html"), 700);
    } catch (err) {
      showMessage("Server error");
    }
  });
}

// =====================
// LOGOUT (helper for any page)
// =====================
async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...csrfHeaders()
      }
    });
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.location.href = "login.html";
  }
}

// If you want to call it from HTML: onclick="logout()"
window.logout = logout;