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
      return "moyasar"; // recommended Gulf-first placeholder
    case "bnpl":
      return "tabby"; // recommended BNPL placeholder
    default:
      return "";
  }
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
    const orderRes = await paymentApiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        products: productsPayload,
        paymentMethod
      })
    });

    const orderData = await orderRes.json().catch(() => ({}));

    if (!orderRes.ok || !orderData.order?._id) {
      alert(orderData.message || "Order creation failed");
      return;
    }

    const orderId = orderData.order._id;

    // 2) Create payment record
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

    if (!paymentRes.ok) {
      alert(paymentData.message || "Payment record creation failed");
      return;
    }

    // 3) Handle payment method
    if (paymentMethod === "cash") {
      localStorage.setItem("currentOrderId", orderId);
      savePaymentCart([]);
      window.location.href = "confirmation.html";
      return;
    }

    if (paymentMethod === "card") {
      alert("Card / Mada / Apple Pay gateway integration is the next step.");
      return;
    }

    if (paymentMethod === "bnpl") {
      alert("Buy Now, Pay Later integration (Tabby/Tamara) is the next step.");
      return;
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Server error during checkout");
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn?.addEventListener("click", handleCheckout);
});