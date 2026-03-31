let cart = JSON.parse(localStorage.getItem("cart")) || [];

// =====================
// IMAGE URL RESOLVER
// Supports both:
// - Cloudinary full URLs
// - old local /uploads/... paths
// =====================
function resolveImageUrl(path, fallback = "https://via.placeholder.com/400") {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_BASE}${path}`;
}

// =====================
// TOAST
// =====================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
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
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// =====================
// ELEMENTS
// =====================
const mainImg = document.getElementById("product-img");
const thumbsContainer = document.querySelector(".thumbnails");
const nameEl = document.getElementById("product-name");
const categoryEl = document.getElementById("product-category");
const priceEl = document.getElementById("product-price");
const descEl = document.getElementById("product-description");
const quantityEl = document.getElementById("product-quantity");
const addBtn = document.getElementById("add-to-cart-btn");
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
    const data = await apiFetch(`/product/${productId}`);
    const product = data.product;

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.images && product.images.length) {
      mainImg.src = resolveImageUrl(product.images[0]);

      thumbsContainer.innerHTML = product.images
        .map(
          (src) => `
            <img class="thumb" src="${resolveImageUrl(src)}" alt="Thumbnail" />
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

    nameEl.textContent = product.name || "Product";
    categoryEl.textContent = product.category || "Uncategorized";
    priceEl.textContent = `$${Number(product.price || 0).toFixed(2)}`;
    descEl.textContent = product.description || "No description available.";

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
    cart.push({
      id: productId,
      name: nameEl.textContent,
      price: parseFloat(priceEl.textContent.replace("$", "")),
      quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
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

    relatedContainer.innerHTML = related
      .map((p) => {
        const firstImage = Array.isArray(p.images) ? p.images[0] : "";
        const imageSrc = resolveImageUrl(
          firstImage,
          "https://via.placeholder.com/300"
        );

        return `
          <div class="related-card" onclick="window.location.href='product.html?id=${p._id}'">
            <img src="${imageSrc}" alt="${p.name}" />
            <div class="related-info">
              <h4>${p.name}</h4>
              <p>$${Number(p.price || 0).toFixed(2)}</p>
            </div>
          </div>
        `;
      })
      .join("");

    if (!related.length) {
      relatedContainer.innerHTML = "<p>No related products found.</p>";
    }
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