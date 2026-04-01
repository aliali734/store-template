// =====================
// CSRF TOKEN
// =====================
async function getPaymentCsrfToken() {
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
// AUTH-PROTECTED FETCH
// =====================
async function paymentApiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const csrfToken = await getPaymentCsrfToken();

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
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
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
// =====================
function getProviderFromMethod(method) {
  switch (method) {
    case "cash":
      return "cod";
    case "card":
      return "moyasar";
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

  const paymentRes = await paymentApiFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      method: paymentMethod,
      provider,
      currency: "SAR"
    })
  });

  const paymentData = await paymentRes.json().catch(() => ({}));

  if (!paymentRes.ok || !paymentData.payment?._id) {
    throw new Error(paymentData.message || "Payment record creation failed");
  }

  return paymentData.payment;
}

// =====================
// CREATE MOYASAR PAYMENT
// =====================
async function createMoyasarPayment(paymentId) {
  const callbackUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}confirmation.html`;

  const moyasarRes = await paymentApiFetch("/payments/moyasar", {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      callbackUrl,
      description: "Store order payment"
    })
  });

  const moyasarData = await moyasarRes.json().catch(() => ({}));

  if (!moyasarRes.ok) {
    throw new Error(moyasarData.message || "Moyasar payment failed");
  }

  return moyasarData;
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
// HANDLE CARD PAYMENT
// =====================
async function handleCardPayment(payment) {
  const moyasarResult = await createMoyasarPayment(payment._id);

  // NOTE:
  // Current backend scaffold may already return payment success/failure
  // or only provider response placeholder.
  // For now, we handle the "paid" case if backend marks it so.

  if (moyasarResult.payment?.status === "paid") {
    localStorage.setItem("currentOrderId", payment.order);
    savePaymentCart([]);
    window.location.href = "confirmation.html";
    return;
  }

  alert(
    "Moyasar payment request was created, but the live secure hosted card flow still needs the final integration step."
  );
}

// =====================
// HANDLE BNPL PAYMENT
// =====================
async function handleBnplPayment(payment) {
  alert(
    "BNPL integration (Tabby/Tamara) is planned next. Payment record was created successfully."
  );
}

// =====================
// CHECKOUT
// =====================
async function handleCheckout() {
  const cart = getCartItems();

  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  const paymentMethodInput = document.getElementById("payment-method");
  const paymentMethod = paymentMethodInput?.value || "cash";

  const productsPayload = cart.map((item) => ({
    product: item.id,
    quantity: item.quantity
  }));

  try {
    // 1) Create order
    const order = await createCheckoutOrder(productsPayload, paymentMethod);

    // 2) Create payment record
    const payment = await createPaymentRecord(order._id, paymentMethod);

    // 3) Handle method-specific flow
    if (paymentMethod === "cash") {
      handleCashSuccess(order._id);
      return;
    }

    if (paymentMethod === "card") {
      await handleCardPayment(payment);
      return;
    }

    if (paymentMethod === "bnpl") {
      await handleBnplPayment(payment);
      return;
    }

    alert("Unsupported payment method");
  } catch (err) {
    console.error("Checkout error:", err);
    alert(err.message || "Server error during checkout");
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn?.addEventListener("click", handleCheckout);
});