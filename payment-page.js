const params = new URLSearchParams(window.location.search);
const paymentId = params.get("paymentId");
const orderId = params.get("orderId");

const paymentStatusEl = document.getElementById("payment-status");
const paymentSummaryEl = document.getElementById("payment-summary");
const paymentAmountEl = document.getElementById("payment-amount");
const paymentCurrencyEl = document.getElementById("payment-currency");
const paymentMethodLabelEl = document.getElementById("payment-method-label");
const paymentProviderEl = document.getElementById("payment-provider");
const payNowBtn = document.getElementById("pay-now-btn");

function humanizePaymentMethod(method) {
  switch (method) {
    case "cash":
      return "Cash on Delivery";
    case "card":
      return "Card / Mada / Apple Pay";
    case "bnpl":
      return "Buy Now, Pay Later";
    case "wallet":
      return "Wallet";
    default:
      return method || "-";
  }
}

async function loadPaymentDetails() {
  if (!paymentId) {
    paymentStatusEl.textContent = "Invalid payment link.";
    return null;
  }

  try {
    const data = await apiFetch(`/payments/${paymentId}`);

    if (!data.success || !data.payment) {
      throw new Error(data.message || "Payment not found");
    }

    const payment = data.payment;

    paymentAmountEl.textContent = Number(payment.amount || 0).toFixed(2);
    paymentCurrencyEl.textContent = payment.currency || "SAR";
    paymentMethodLabelEl.textContent = humanizePaymentMethod(payment.method);
    paymentProviderEl.textContent = payment.provider || "moyasar";

    paymentSummaryEl.classList.remove("hidden");
    payNowBtn.classList.remove("hidden");

    paymentStatusEl.textContent = "Payment details loaded. Continue to payment.";

    return payment;
  } catch (err) {
    console.error(err);
    paymentStatusEl.textContent = err.message || "Failed to load payment details.";
    return null;
  }
}

async function startMoyasarPayment() {
  if (!paymentId) return;

  payNowBtn.disabled = true;
  paymentStatusEl.textContent = "Creating payment session...";

  try {
    const callbackUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}confirmation.html`;

    const res = await fetch(`${API_BASE}/payments/moyasar`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(await (async () => {
          const csrfRes = await fetch(`${API_BASE}/csrf`, {
            method: "GET",
            credentials: "include"
          });
          const csrfData = await csrfRes.json().catch(() => ({}));
          return csrfData.csrfToken
            ? { "x-csrf-token": csrfData.csrfToken }
            : {};
        })())
      },
      body: JSON.stringify({
        paymentId,
        callbackUrl,
        description: `Order ${orderId || ""}`.trim()
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to start payment");
    }

    // Current scaffold response handling
    if (data.payment?.status === "paid") {
      localStorage.setItem("currentOrderId", orderId || data.payment.order);
      localStorage.setItem("cart", JSON.stringify([]));
      window.location.href = "confirmation.html";
      return;
    }

    paymentStatusEl.textContent =
      "Payment request created. Final secure provider redirect integration is the next step.";
  } catch (err) {
    console.error(err);
    paymentStatusEl.textContent = err.message || "Payment failed to start.";
  } finally {
    payNowBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const payment = await loadPaymentDetails();

  if (!payment) return;

  payNowBtn.addEventListener("click", startMoyasarPayment);
});