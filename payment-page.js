// payment-page.js
// Moyasar payment has been removed. This page now redirects users back
// to the shop. Card payments go directly through Stripe (via the cart
// checkout flow in header.js), and cash orders go straight to confirmation.html.

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("payment-status");
  if (statusEl) {
    statusEl.textContent =
      "This payment page is no longer in use. " +
      "Please complete your order from the shop.";
  }

  setTimeout(() => {
    window.location.href = "shop.html";
  }, 3000);
});