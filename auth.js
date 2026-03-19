// auth.js

const authMessage = document.getElementById("auth-message");

// =====================
// UI MESSAGE
// =====================
function showMessage(message, color = "#b91c1c") {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.style.color = color;
}

function clearMessage() {
  if (!authMessage) return;
  authMessage.textContent = "";
}

// =====================
// GET CSRF TOKEN FROM BACKEND
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
// AUTO REDIRECT IF LOGGED IN
// =====================
(async function redirectIfLoggedIn() {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  const isAuthPage = page === "login.html" || page === "register.html";

  if (!isAuthPage) return;

  try {
    await getCsrfToken();

    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    if (res.ok) {
      window.location.href = "index.html";
    }
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

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim().toLowerCase();
    const password = document.getElementById("password")?.value.trim();

    if (!name || name.length < 2) {
      return showMessage("Name must be at least 2 characters");
    }

    if (!email || !email.includes("@")) {
      return showMessage("Invalid email format");
    }

    if (!password || password.length < 8) {
      return showMessage("Password must be at least 8 characters");
    }

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await safeJson(res);

      if (!res.ok) {
        return showMessage(data.message || "Register failed");
      }

      showMessage("Registered successfully. Redirecting...", "#166534");

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

    const email = document.getElementById("email")?.value.trim().toLowerCase();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !email.includes("@")) {
      return showMessage("Invalid email format");
    }

    if (!password || password.length < 8) {
      return showMessage("Password must be at least 8 characters");
    }

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
        },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(res);

      if (!res.ok) {
        return showMessage(data.message || "Login failed");
      }

      showMessage("Login successful. Redirecting...", "#166534");

      setTimeout(() => {
        window.location.href = "index.html";
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
    const csrfToken = await getCsrfToken();

    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      }
    });
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.location.href = "login.html";
  }
}

window.logout = logout;