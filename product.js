const API_BASE = "https://shoe-store-api.onrender.com/api";
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Toast function
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
// AUTH-AWARE HEADER
// =====================
function setupAuthHeader() {
  const token = localStorage.getItem("token");

  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (!loginLink || !registerLink || !logoutBtn) return;

  if (token) {
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    logoutBtn.style.display = "inline-flex";

    logoutBtn.onclick = () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    };
  } else {
    loginLink.style.display = "inline-flex";
    registerLink.style.display = "inline-flex";
    logoutBtn.style.display = "none";
  }
}

// Load header
fetch("header.html")
  .then(res => res.text())
  .then(html =>{ document.getElementById("header").innerHTML = html
    setupAuthHeader();
});

// Get product ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// Elements
const mainImg = document.getElementById("product-img");
const thumbsContainer = document.querySelector(".thumbnails");
const nameEl = document.getElementById("product-name");
const categoryEl = document.getElementById("product-category");
const priceEl = document.getElementById("product-price");
const descEl = document.getElementById("product-description");
const quantityEl = document.getElementById("product-quantity");
const addBtn = document.getElementById("add-to-cart-btn");
const relatedContainer = document.getElementById("related-container");

// Load product
async function loadProduct() {
  try {
    const res = await fetch(`${API_BASE}/product/${productId}`);
    if (!res.ok) throw new Error("Product not found");
    const product = await res.json();

    // Gallery images
    if (product.images && product.images.length) {
      mainImg.src = `https://shoe-store-api.onrender.com${product.images[0]}`;
      thumbsContainer.innerHTML = product.images.map(src => `
        <img class="thumb" src="https://shoe-store-api.onrender.com${src}" alt="Thumbnail">
      `).join("");

      thumbsContainer.querySelectorAll(".thumb").forEach(img => {
        img.onclick = () => mainImg.src = img.src;
      });
    } else {
      mainImg.src = "https://via.placeholder.com/400";
    }

    // Product info
    nameEl.textContent = product.name;
    categoryEl.textContent = product.category || "Uncategorized";
    priceEl.textContent = `$${product.price}`;
    descEl.textContent = product.description || "No description available.";

    // Load related products
    if (product.category) loadRelatedProducts(product.category);

  } catch (err) {
    console.error(err);
    alert("Product could not be loaded.");
  }
}

// Add to cart
addBtn.onclick = () => {
  const quantity = parseInt(quantityEl.value) || 1;
  if (quantity <= 0) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += quantity;
  else {
    cart.push({
      id: productId,
      name: nameEl.textContent,
      price: parseFloat(priceEl.textContent.replace("$", "")),
      quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast("🛒 Added to cart");
};



// Load related products
async function loadRelatedProducts(category) {
  try {
    const res = await apiFetch(`/product?category=${encodeURIComponent(category)}&limit=4`);
    if (!res.ok) throw new Error("Failed to load related products");
    const data = await res.json();

    const related = data.products.filter(p => p._id !== productId);

    relatedContainer.innerHTML = related.map(p => `
      <div class="related-card" onclick="window.location.href='product.html?id=${p._id}'">
        <img src="${p.image ? 'https://shoe-store-api.onrender.com'+p.image : 'https://via.placeholder.com/300'}" alt="${p.name}">
        <div class="related-info">
          <h4>${p.name}</h4>
          <p>$${p.price}</p>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    relatedContainer.innerHTML = "<p style='color:red;'>Failed to load related products</p>";
  }
}

// Init
document.addEventListener("DOMContentLoaded", loadProduct);
