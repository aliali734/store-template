const SIZE_OPTIONS = {
  clothing: {
    default: ["XS", "S", "M", "L", "XL", "XXL"],
    kids: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"]
  },
  shoes: {
    default: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
    kids: ["28", "29", "30", "31", "32", "33", "34", "35"]
  },
  accessories: {
    default: ["One Size"],
    kids: ["One Size"]
  }
};

// Used by the admin product form — needs both department AND audience
// because the size set differs between adults and kids.
function getSizesForProduct(department, audience = "") {
  const dept = String(department || "").toLowerCase();
  const aud  = String(audience   || "").toLowerCase();

  const config = SIZE_OPTIONS[dept];
  if (!config) return [];

  if (aud === "kids" && Array.isArray(config.kids)) {
    return config.kids;
  }

  return config.default || [];
}

// Used by the shop filter sidebar — no audience context is available
// there, so we return the adult (default) sizes for the department.
// This is what filters.js calls via window.getSizesForDepartment(department).
function getSizesForDepartment(department) {
  return getSizesForProduct(department, "");
}
سشسشسش

window.SIZE_OPTIONS          = SIZE_OPTIONS;
window.getSizesForProduct    = getSizesForProduct;
window.getSizesForDepartment = getSizesForDepartment;