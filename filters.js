// =====================
// FILTER STATE
// =====================
const filters = {
  search: "",
  department: "",
  category: "",
  audience: "",
  size: "",
  color: "",
  priceMin: "",
  priceMax: "",
  inStock: "",
  featured: "",
  promo: "",
  sort: "newest"
};

let productTaxonomy = {};
let productDepartments = [];

// =====================
// DEBOUNCE
// =====================
function debounce(fn, delay = 400) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// =====================
// SIZE OPTIONS
// =====================
function populateSizeFilter(department = "", selectedSize = "") {
  const sizeInput = document.getElementById("filter-size");
  if (!sizeInput) return;

  const sizes = window.getSizesForDepartment
    ? window.getSizesForDepartment(department)
    : [];

  sizeInput.innerHTML =
    `<option value="">All sizes</option>` +
    sizes
      .map(
        (size) =>
          `<option value="${size}" ${
            size === selectedSize ? "selected" : ""
          }>${size}</option>`
      )
      .join("");
}

// =====================
// LOAD TAXONOMY
// =====================
async function loadFilterTaxonomy() {
  try {
    const data = await apiFetch("/product/meta/taxonomy");

    if (!data.success) {
      throw new Error("Failed to load taxonomy");
    }

    productTaxonomy = data.taxonomy || {};
    productDepartments = data.departments || [];

    populateDepartmentFilter(filters.department);
    populateCategoryFilter(filters.department, filters.category);
    populateSizeFilter(filters.department, filters.size);
  } catch (err) {
    console.error("Failed to load filter taxonomy:", err);
  }
}

function populateDepartmentFilter(selectedDepartment = "") {
  const departmentInput = document.getElementById("filter-department");
  if (!departmentInput) return;

  departmentInput.innerHTML = `<option value="">All departments</option>`;

  productDepartments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department;
    option.textContent = humanizeLabel(department);
    option.selected = department === selectedDepartment;
    departmentInput.appendChild(option);
  });
}

function populateCategoryFilter(department = "", selectedCategory = "") {
  const categoryInput = document.getElementById("filter-category");
  if (!categoryInput) return;

  categoryInput.innerHTML = `<option value="">All categories</option>`;

  const categories = department ? productTaxonomy[department] || [] : [];

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = humanizeLabel(category);
    option.selected = category === selectedCategory;
    categoryInput.appendChild(option);
  });
}

function humanizeLabel(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// =====================
// READ FILTERS FROM URL
// =====================
function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);

  filters.search = params.get("search") || "";
  filters.department = params.get("department") || "";
  filters.category = params.get("category") || "";
  filters.audience = params.get("audience") || "";
  filters.size = params.get("size") || "";
  filters.color = params.get("color") || "";
  filters.priceMin = params.get("priceMin") || "";
  filters.priceMax = params.get("priceMax") || "";
  filters.inStock = params.get("inStock") || "";
  filters.featured = params.get("featured") || "";
  filters.promo = params.get("promo") || "";
  filters.sort = params.get("sort") || "newest";
}

// =====================
// WRITE FILTERS TO URL
// =====================
function updateFiltersURL() {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const newUrl =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : "");

  window.history.replaceState(null, "", newUrl);
}

// =====================
// BUILD QUERY STRING
// =====================
function buildFilterQuery(page = 1, limit = 9) {
  return new URLSearchParams({
    page,
    limit,
    search: filters.search || "",
    department: filters.department || "",
    category: filters.category || "",
    audience: filters.audience || "",
    size: filters.size || "",
    color: filters.color || "",
    priceMin: filters.priceMin || "",
    priceMax: filters.priceMax || "",
    inStock: filters.inStock || "",
    featured: filters.featured || "",
    promo: filters.promo || "",
    sort: filters.sort || "newest"
  });
}

// =====================
// SYNC INPUTS FROM STATE
// =====================
function syncFilterInputsFromState() {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const departmentInput = document.getElementById("filter-department");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
  const promoInput = document.getElementById("filter-promo");
  const sortInput = document.getElementById("filter-sort");

  populateSizeFilter(filters.department, filters.size);

  if (searchInput) searchInput.value = filters.search;
  if (headerSearch) headerSearch.value = filters.search;
  if (departmentInput) departmentInput.value = filters.department;
  if (categoryInput) categoryInput.value = filters.category;
  if (audienceInput) audienceInput.value = filters.audience;
  if (sizeInput) sizeInput.value = filters.size;
  if (colorInput) colorInput.value = filters.color;
  if (minInput) minInput.value = filters.priceMin;
  if (maxInput) maxInput.value = filters.priceMax;
  if (inStockInput) inStockInput.checked = filters.inStock === "true";
  if (featuredInput) featuredInput.checked = filters.featured === "true";
  if (promoInput) promoInput.checked = filters.promo === "true";
  if (sortInput) sortInput.value = filters.sort;
}

// =====================
// SETUP FILTER LISTENERS
// =====================
function setupFilters(onFilterChange) {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const departmentInput = document.getElementById("filter-department");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
  const promoInput = document.getElementById("filter-promo");
  const sortInput = document.getElementById("filter-sort");
  const resetBtn = document.getElementById("reset-filters");

  searchInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.search = e.target.value;
      if (headerSearch) headerSearch.value = e.target.value;
      updateFiltersURL();
      onFilterChange();
    })
  );

  departmentInput?.addEventListener("change", (e) => {
    filters.department = e.target.value;
    filters.category = "";
    filters.size = "";

    populateCategoryFilter(filters.department, "");
    populateSizeFilter(filters.department, "");

    updateFiltersURL();
    onFilterChange();
  });

  categoryInput?.addEventListener("change", (e) => {
    filters.category = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  audienceInput?.addEventListener("change", (e) => {
    filters.audience = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  sizeInput?.addEventListener("change", (e) => {
    filters.size = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  colorInput?.addEventListener("change", (e) => {
    filters.color = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  minInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMin = e.target.value;
      updateFiltersURL();
      onFilterChange();
    })
  );

  maxInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMax = e.target.value;
      updateFiltersURL();
      onFilterChange();
    })
  );

  inStockInput?.addEventListener("change", (e) => {
    filters.inStock = e.target.checked ? "true" : "";
    updateFiltersURL();
    onFilterChange();
  });

  featuredInput?.addEventListener("change", (e) => {
    filters.featured = e.target.checked ? "true" : "";
    updateFiltersURL();
    onFilterChange();
  });

  promoInput?.addEventListener("change", (e) => {
    filters.promo = e.target.checked ? "true" : "";
    updateFiltersURL();
    onFilterChange();
  });

  sortInput?.addEventListener("change", (e) => {
    filters.sort = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  resetBtn?.addEventListener("click", () => {
    resetFilters();
    populateDepartmentFilter("");
    populateCategoryFilter("", "");
    populateSizeFilter("", "");
    onFilterChange();
  });
}

// =====================
// RESET FILTERS
// =====================
function resetFilters() {
  filters.search = "";
  filters.department = "";
  filters.category = "";
  filters.audience = "";
  filters.size = "";
  filters.color = "";
  filters.priceMin = "";
  filters.priceMax = "";
  filters.inStock = "";
  filters.featured = "";
  filters.promo = "";
  filters.sort = "newest";

  syncFilterInputsFromState();
  updateFiltersURL();
}

// =====================
// EXPOSE GLOBALLY
// =====================
window.filters = filters;
window.debounce = debounce;
window.loadFilterTaxonomy = loadFilterTaxonomy;
window.applyUrlFilters = applyUrlFilters;
window.updateFiltersURL = updateFiltersURL;
window.buildFilterQuery = buildFilterQuery;
window.syncFilterInputsFromState = syncFilterInputsFromState;
window.setupFilters = setupFilters;
window.resetFilters = resetFilters;
window.populateDepartmentFilter = populateDepartmentFilter;
window.populateCategoryFilter = populateCategoryFilter;
window.populateSizeFilter = populateSizeFilter;