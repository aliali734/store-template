// =====================================================================
// ADMIN — STRIPE CONNECT PANEL
// Talks to:
//   POST /api/payments/connect/onboard     -> { url } to redirect to
//   GET  /api/payments/connect/status      -> { connected, chargesEnabled, ... }
//   POST /api/payments/connect/disconnect  -> { success: true }
//
// Depends on globals from config.js:
//   API_BASE        - "https://…/api"
//   getCsrfToken()  - returns the current CSRF token
// =====================================================================
(function () {
  const openBtn        = document.getElementById("openPaymentsModal");
  const closeBtn       = document.getElementById("closePaymentsModal");
  const modal          = document.getElementById("paymentsModal");

  const statusLine     = document.getElementById("stripe-status-line");
  const detailsBox     = document.getElementById("stripe-details");
  const acctIdEl       = document.getElementById("stripe-acct-id");
  const chargesEl      = document.getElementById("stripe-charges");
  const payoutsEl      = document.getElementById("stripe-payouts");
  const detailsSubEl   = document.getElementById("stripe-details-submitted");
  const messageEl      = document.getElementById("stripe-message");

  const connectBtn     = document.getElementById("stripe-connect-btn");
  const refreshBtn     = document.getElementById("stripe-refresh-btn");
  const continueBtn    = document.getElementById("stripe-continue-btn");
  const disconnectBtn  = document.getElementById("stripe-disconnect-btn");

  if (!modal || !connectBtn) return;   // Not on the admin page

  // =====================
  // OPEN / CLOSE MODAL
  // =====================
  openBtn?.addEventListener("click", () => {
    modal.classList.remove("hidden");
    refreshStatus();
  });
  closeBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
    setMessage("");
  });

  // =====================
  // FETCH HELPER
  // =====================
  async function api(method, path, body) {
    const csrfToken = (typeof getCsrfToken === "function")
      ? await getCsrfToken()
      : null;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  // =====================
  // UI HELPERS
  // =====================
  function setMessage(text, kind = "info") {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.style.color =
      kind === "error"   ? "#b91c1c" :
      kind === "success" ? "#166534" :
                           "#374151";
  }

  function setStatusLine(text, bg = "#f3f4f6", border = "#e5e7eb", color = "#374151") {
    statusLine.textContent      = text;
    statusLine.style.background = bg;
    statusLine.style.borderColor= border;
    statusLine.style.color      = color;
  }

  function showButton(btn, visible, label) {
    if (!btn) return;
    btn.style.display = visible ? "" : "none";
    if (label) btn.textContent = label;
  }

  function renderState(state) {
    // state = { connected, chargesEnabled, payoutsEnabled, detailsSubmitted, accountId }
    if (!state.connected) {
      setStatusLine("Not connected. Click below to connect your Stripe account.");
      detailsBox.style.display = "none";
      showButton(connectBtn,    true,  "Connect Stripe Account");
      showButton(refreshBtn,    false);
      showButton(continueBtn,   false);
      showButton(disconnectBtn, false);
      return;
    }

    acctIdEl.textContent     = state.accountId || "—";
    chargesEl.textContent    = state.chargesEnabled    ? "Yes" : "No";
    payoutsEl.textContent    = state.payoutsEnabled    ? "Yes" : "No";
    detailsSubEl.textContent = state.detailsSubmitted  ? "Yes" : "No";
    detailsBox.style.display = "";

    if (state.chargesEnabled && state.payoutsEnabled) {
      setStatusLine(
        "✓ Connected. Your store can accept card payments.",
        "#ecfdf5", "#6ee7b7", "#065f46"
      );
      showButton(connectBtn,    false);
      showButton(continueBtn,   false);
      showButton(refreshBtn,    true,  "Refresh status");
      showButton(disconnectBtn, true);
    } else {
      setStatusLine(
        "⚠ Connected, but onboarding is incomplete. Click Continue to finish.",
        "#fffbeb", "#fcd34d", "#92400e"
      );
      showButton(connectBtn,    false);
      showButton(continueBtn,   true,  "Continue onboarding");
      showButton(refreshBtn,    true,  "Refresh status");
      showButton(disconnectBtn, true);
    }
  }

  // =====================
  // ACTIONS
  // =====================
  async function refreshStatus() {
    setMessage("");
    setStatusLine("Checking Stripe connection…");
    try {
      const data = await api("GET", "/payments/connect/status");
      renderState(data);
    } catch (err) {
      setStatusLine("Could not load Stripe status.", "#fef2f2", "#fca5a5", "#991b1b");
      setMessage(err.message, "error");
    }
  }

  async function startOnboarding() {
    setMessage("Opening Stripe…");
    connectBtn.disabled  = true;
    continueBtn.disabled = true;
    try {
      const data = await api("POST", "/payments/connect/onboard");
      if (data?.url) {
        // Stripe-hosted page; admin returns to admin.html?stripe=return
        window.location.href = data.url;
        return;
      }
      throw new Error("No onboarding URL returned");
    } catch (err) {
      setMessage(err.message, "error");
    } finally {
      connectBtn.disabled  = false;
      continueBtn.disabled = false;
    }
  }

  async function disconnect() {
    if (!confirm(
      "Disconnect Stripe? Customers will no longer be able to pay by card " +
      "until you connect an account again. Your Stripe account itself is " +
      "NOT deleted."
    )) return;

    disconnectBtn.disabled = true;
    setMessage("Disconnecting…");
    try {
      await api("POST", "/payments/connect/disconnect");
      setMessage("Disconnected.", "success");
      refreshStatus();
    } catch (err) {
      setMessage(err.message, "error");
    } finally {
      disconnectBtn.disabled = false;
    }
  }

  connectBtn   .addEventListener("click", startOnboarding);
  continueBtn  .addEventListener("click", startOnboarding);
  refreshBtn   .addEventListener("click", refreshStatus);
  disconnectBtn.addEventListener("click", disconnect);

  // =====================
  // AUTO-OPEN WHEN RETURNING FROM STRIPE
  // The onboarding link sends the admin back to admin.html?stripe=return
  // (or ?stripe=refresh if the link expired). Pop the modal and refresh.
  // =====================
  const params = new URLSearchParams(window.location.search);
  if (params.get("stripe") === "return" || params.get("stripe") === "refresh") {
    // Wait a tick to let admin.js finish auth/login redirects first.
    setTimeout(() => {
      modal.classList.remove("hidden");
      refreshStatus();
      if (params.get("stripe") === "return") {
        setMessage("Welcome back from Stripe. Refreshing your account status…", "success");
      } else {
        setMessage("That onboarding link expired. Click Continue onboarding to try again.", "error");
      }
      // Clean the URL so a future refresh of the page doesn't re-pop the modal.
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe");
      window.history.replaceState({}, "", url.toString());
    }, 500);
  }
})();
