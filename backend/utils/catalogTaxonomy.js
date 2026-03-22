const CATALOG_TAXONOMY = {
  shoes: [
    "shoes",
    "sneakers",
    "classic-sneakers",
    "boots",
    "canvas-shoes",
    "sandals",
    "loafers",
    "heels",
    "flats",
    "school-shoes"
  ],

  clothing: [
    "clothing",
    "t-shirts",
    "shirts",
    "blouses",
    "polos",
    "hoodies",
    "sweaters",
    "jackets",
    "jeans",
    "pants",
    "shorts",
    "dresses",
    "skirts",
    "tracksuits",
    "activewear"
  ],

  accessories: [
    "accessories",
    "hats",
    "beanies",
    "belts",
    "watches",
    "socks",
    "bags",
    "sunglasses",
    "scarves",
    "jewelry"
  ]
};

function normalizeCatalogValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidDepartment(department) {
  const normalized = normalizeCatalogValue(department);
  return Object.prototype.hasOwnProperty.call(CATALOG_TAXONOMY, normalized);
}

function isValidCategoryForDepartment(department, category) {
  const normalizedDepartment = normalizeCatalogValue(department);
  const normalizedCategory = normalizeCatalogValue(category);

  if (!isValidDepartment(normalizedDepartment)) return false;

  return CATALOG_TAXONOMY[normalizedDepartment].includes(normalizedCategory);
}

function getAllowedDepartments() {
  return Object.keys(CATALOG_TAXONOMY);
}

function getAllowedCategories(department) {
  const normalizedDepartment = normalizeCatalogValue(department);

  if (!isValidDepartment(normalizedDepartment)) {
    return [];
  }

  return CATALOG_TAXONOMY[normalizedDepartment];
}

module.exports = {
  CATALOG_TAXONOMY,
  normalizeCatalogValue,
  isValidDepartment,
  isValidCategoryForDepartment,
  getAllowedDepartments,
  getAllowedCategories
};