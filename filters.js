// filters.js

// =====================
// FILTER STATE
// =====================
const filters = {
  search: "",
  category: "",
  audience: "",
  size: "",
  color: "",
  priceMin: "",
  priceMax: "",
  inStock: "",
  featured: "",
  sort: "newest"
};

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
// READ FILTERS FROM URL
// =====================
function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);

  filters.search = params.get("search") || "";
  filters.category = params.get("category") || "";
  filters.audience = params.get("audience") || "";
  filters.size = params.get("size") || "";
  filters.color = params.get("color") || "";
  filters.priceMin = params.get("priceMin") || "";
  filters.priceMax = params.get("priceMax") || "";
  filters.inStock = params.get("inStock") || "";
  filters.featured = params.get("featured") || "";
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
    category: filters.category || "",
    audience: filters.audience || "",
    size: filters.size || "",
    color: filters.color || "",
    priceMin: filters.priceMin || "",
    priceMax: filters.priceMax || "",
    inStock: filters.inStock || "",
    featured: filters.featured || "",
    sort: filters.sort || "newest"
  });
}

// =====================
// SYNC INPUTS FROM STATE
// =====================
function syncFilterInputsFromState() {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
  const sortInput = document.getElementById("filter-sort");

  if (searchInput) searchInput.value = filters.search;
  if (headerSearch) headerSearch.value = filters.search;
  if (categoryInput) categoryInput.value = filters.category;
  if (audienceInput) audienceInput.value = filters.audience;
  if (sizeInput) sizeInput.value = filters.size;
  if (colorInput) colorInput.value = filters.color;
  if (minInput) minInput.value = filters.priceMin;
  if (maxInput) maxInput.value = filters.priceMax;
  if (inStockInput) inStockInput.checked = filters.inStock === "true";
  if (featuredInput) featuredInput.checked = filters.featured === "true";
  if (sortInput) sortInput.value = filters.sort;
}

// =====================
// SETUP FILTER LISTENERS
// =====================
function setupFilters(onFilterChange) {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
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

  sortInput?.addEventListener("change", (e) => {
    filters.sort = e.target.value;
    updateFiltersURL();
    onFilterChange();
  });

  resetBtn?.addEventListener("click", () => {
    resetFilters();
    onFilterChange();
  });
}

// =====================
// RESET FILTERS
// =====================
function resetFilters() {
  filters.search = "";
  filters.category = "";
  filters.audience = "";
  filters.size = "";
  filters.color = "";
  filters.priceMin = "";
  filters.priceMax = "";
  filters.inStock = "";
  filters.featured = "";
  filters.sort = "newest";

  syncFilterInputsFromState();
  updateFiltersURL();
}

// =====================
// EXPOSE GLOBALLY
// =====================
window.filters = filters;
window.debounce = debounce;
window.applyUrlFilters = applyUrlFilters;
window.updateFiltersURL = updateFiltersURL;
window.buildFilterQuery = buildFilterQuery;
window.syncFilterInputsFromState = syncFilterInputsFromState;
window.setupFilters = setupFilters;
window.resetFilters = resetFilters;