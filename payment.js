// =====================
// CSRF TOKEN
// Uses the global getCsrfToken() from config.js instead of a local copy.
// A local duplicate was the source of provider validation failures:
// if config.js hadn't finished or API_BASE was undefined, the local
// fetch hit a bad URL and returned HTML instead of JSON, causing every
// subsequent API call to fail with an unexpected error.
// =====================

// =====================
// AUTH-PROTECTED FETCH
// =====================
async function paymentApiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  // getCsrfToken is defined in config.js and always available globally.
  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {})
    },
    body: options.body
  });

  if (res.status === 401 || res.status === 403) {
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  return res;
}

// =====================
// GET CART
// =====================
function getCartItems() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse cart from localStorage:", err);
    return [];
  }
}

// =====================
// SAVE CART
// =====================
function savePaymentCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =====================
// MAP PAYMENT METHOD TO PROVIDER
// Only providers recognised by the backend are returned:
//   ["cod", "stripe", "paytabs", "tabby", "tamara", ""]
// =====================
function getProviderFromMethod(method) {
  switch (method) {
    case "cash":
      return "cod";
    case "card":
      return "stripe";
    case "bnpl":
      return "tabby";
    default:
      return "";
  }
}

// =====================
// CREATE ORDER
// =====================
async function createCheckoutOrder(productsPayload, paymentMethod) {
  const orderRes = await paymentApiFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      products: productsPayload,
      paymentMethod
    })
  });

  const orderData = await orderRes.json().catch(() => ({}));

  if (!orderRes.ok || !orderData.order?._id) {
    throw new Error(orderData.message || "Order creation failed");
  }

  return orderData.order;
}

// =====================
// CREATE PAYMENT RECORD
// =====================
async function createPaymentRecord(orderId, paymentMethod) {
  const provider = getProviderFromMethod(paymentMethod);

  // Currency is intentionally NOT sent from the frontend anymore. The
  // backend reads it from StoreSettings (configured by the admin in the
  // setup wizard) and falls back to USD if missing. Hard-coding "SAR"
  // here caused Stripe to reject sessions for any account that didn't
  // support SAR for card payments.
  const paymentRes = await paymentApiFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      method: paymentMethod,
      provider
    })
  });

  const paymentData = await paymentRes.json().catch(() => ({}));

  if (!paymentRes.ok || !paymentData.payment?._id) {
    throw new Error(paymentData.message || "Payment record creation failed");
  }

  return paymentData.payment;
}

// =====================
// CREATE STRIPE CHECKOUT SESSION
// =====================
async function createStripeCheckoutSession(paymentId) {
  const stripeRes = await paymentApiFetch("/payments/stripe/create-session", {
    method: "POST",
    body: JSON.stringify({ paymentId })
  });

  const stripeData = await stripeRes.json().catch(() => ({}));

  if (!stripeRes.ok || !stripeData.url) {
    throw new Error(stripeData.message || "Failed to create Stripe checkout session");
  }

  return stripeData;
}

// =====================
// HANDLE CASH PAYMENT
// =====================
function handleCashSuccess(orderId) {
  localStorage.setItem("currentOrderId", orderId);
  savePaymentCart([]);
  window.location.href = "confirmation.html";
}

// =====================
// HANDLE CARD PAYMENT WITH STRIPE
// =====================
async function handleCardPayment(payment, order) {
  const stripeSession = await createStripeCheckoutSession(payment._id);

  localStorage.setItem("currentOrderId", order._id);
  savePaymentCart([]);

  window.location.href = stripeSession.url;
}

// =====================
// HANDLE BNPL PAYMENT
// =====================
async function handleBnplPayment(payment, order) {
  alert(
    "BNPL integration (Tabby/Tamara) is planned next. Payment record was created successfully."
  );
}

// =====================
// CHECKOUT
// =====================
async function handleCheckout() {
  const cart = getCartItems();

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const paymentMethodInput = document.getElementById("payment-method");
  const paymentMethod      = paymentMethodInput?.value || "cash";

  const productsPayload = cart.map((item) => ({
    product:  item.id,
    quantity: item.quantity
  }));

  try {
    const order   = await createCheckoutOrder(productsPayload, paymentMethod);
    const payment = await createPaymentRecord(order._id, paymentMethod);

    if (paymentMethod === "cash") {
      handleCashSuccess(order._id);
      return;
    }

    if (paymentMethod === "card") {
      await handleCardPayment(payment, order);
      return;
    }

    if (paymentMethod === "bnpl") {
      await handleBnplPayment(payment, order);
      return;
    }

    alert("Unsupported payment method");
  } catch (err) {
    console.error("Checkout error:", err);
    alert(err.message || "Server error during checkout");
  }
}

// =====================
// BIND CHECKOUT BUTTON
// Works even if header is injected later
// =====================
function bindCheckoutButton() {
  const checkoutBtn = document.getElementById("checkout-btn");

  if (!checkoutBtn) {
    setTimeout(bindCheckoutButton, 300);
    return;
  }

  if (checkoutBtn.dataset.bound === "true") return;

  checkoutBtn.addEventListener("click", handleCheckout);
  checkoutBtn.dataset.bound = "true";
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  bindCheckoutButton();
});