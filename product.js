let cart = JSON.parse(localStorage.getItem("cart")) || [];

// resolveImageUrl is defined in config.js and available globally.

// =====================
// HTML ESCAPE
// Sanitizes server-supplied strings before injection into innerHTML.
// =====================
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

// =====================
// TOAST
// =====================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className   = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// =====================
// URL PARAMS
// =====================
const params    = new URLSearchParams(window.location.search);
const productId = params.get("id");

// =====================
// ELEMENTS
// =====================
const mainImg          = document.getElementById("product-img");
const thumbsContainer  = document.querySelector(".thumbnails");
const nameEl           = document.getElementById("product-name");
const categoryEl       = document.getElementById("product-category");
const priceEl          = document.getElementById("product-price");
const descEl           = document.getElementById("product-description");
const quantityEl       = document.getElementById("product-quantity");
const addBtn           = document.getElementById("add-to-cart-btn");
const relatedContainer = document.getElementById("related-container");

// =====================
// LOAD PRODUCT
// =====================
async function loadProduct() {
  if (!productId) {
    alert("Product ID is missing.");
    return;
  }

  try {
    const data    = await apiFetch(`/product/${productId}`);
    const product = data.product;

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.images && product.images.length) {
      mainImg.src = resolveImageUrl(product.images[0]);

      thumbsContainer.innerHTML = product.images
        .map(
          (src) => `
            <img class="thumb" src="${resolveImageUrl(src)}" alt="${escapeHtml(product.name)}" />
          `
        )
        .join("");

      thumbsContainer.querySelectorAll(".thumb").forEach((img) => {
        img.onclick = () => {
          mainImg.src = img.src;
        };
      });
    } else {
      mainImg.src = "https://via.placeholder.com/400";
      thumbsContainer.innerHTML = "";
    }

    // Use textContent for all text fields — no HTML parsing, no XSS risk.
    nameEl.textContent     = product.name        || "Product";
    categoryEl.textContent = product.category    || "Uncategorized";
    priceEl.textContent    = `$${Number(product.price || 0).toFixed(2)}`;
    descEl.textContent     = product.description || "No description available.";

    // Store price as a data attribute so the cart handler reads it safely
    // without parsing DOM text (fixes the fragile replace("$","") pattern).
    priceEl.dataset.price = Number(product.price || 0);

    if (product.category) {
      loadRelatedProducts(product.category);
    }
  } catch (err) {
    console.error(err);
    alert("Product could not be loaded.");
  }
}

// =====================
// ADD TO CART
// =====================
addBtn?.addEventListener("click", () => {
  const quantity = parseInt(quantityEl.value, 10) || 1;
  if (quantity <= 0) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    const price = parseFloat(priceEl.dataset.price) || 0;

    cart.push({
      id: productId,
      name: nameEl.textContent,
      price,
      quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  if (typeof updateHeaderCartCounter === "function") {
    updateHeaderCartCounter();
  }

  if (typeof renderHeaderCartModal === "function") {
    renderHeaderCartModal();
  }

  showToast("Added to cart");
});

// =====================
// LOAD RELATED PRODUCTS
// =====================
async function loadRelatedProducts(category) {
  try {
    const data = await apiFetch(
      `/product?category=${encodeURIComponent(category)}&limit=4`
    );

    const related = (data.products || []).filter((p) => p._id !== productId);

    if (!related.length) {
      relatedContainer.innerHTML = "<p>No related products found.</p>";
      return;
    }

    // Build cards with DOM methods so text is always set via textContent,
    // never injected raw into innerHTML (XSS prevention).
    const fragment = document.createDocumentFragment();

    related.forEach((p) => {
      const firstImage = Array.isArray(p.images) ? p.images[0] : "";
      const imageSrc   = resolveImageUrl(firstImage, "https://via.placeholder.com/300");

      const card = document.createElement("div");
      card.className = "related-card";
      card.addEventListener("click", () => {
        window.location.href = `product.html?id=${encodeURIComponent(p._id)}`;
      });

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = p.name || "";

      const info  = document.createElement("div");
      info.className = "related-info";

      const title = document.createElement("h4");
      title.textContent = p.name || "";

      const priceP = document.createElement("p");
      priceP.textContent = `$${Number(p.price || 0).toFixed(2)}`;

      info.appendChild(title);
      info.appendChild(priceP);
      card.appendChild(img);
      card.appendChild(info);
      fragment.appendChild(card);
    });

    relatedContainer.innerHTML = "";
    relatedContainer.appendChild(fragment);
  } catch (err) {
    console.error(err);
    relatedContainer.innerHTML =
      "<p style='color:#b91c1c;'>Failed to load related products</p>";
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", loadProduct);