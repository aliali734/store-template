// payment-page.js
// Moyasar has been removed. Stripe payments redirect here after checkout
// completes (success_url points to payment.html in previously-created
// Stripe sessions). This page bridges the gap: if an order ID was saved
// before the Stripe redirect, forward to confirmation.html so the user
// sees their order details. Otherwise fall back to shop.html.

document.addEventListener("DOMContentLoaded", () => {
  const orderId = localStorage.getItem("currentOrderId");

  if (orderId) {
    // A Stripe payment just completed. The order ID was stored in
    // localStorage by handleCardPayment() before the Stripe redirect.
    // Send the user to the confirmation page to display their order.
    window.location.href = "confirmation.html";
    return;
  }

  // No pending order — stale or direct visit. Show a message and
  // redirect back to the shop after a short delay.
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