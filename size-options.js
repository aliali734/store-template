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

function getSizesForProduct(department, audience = "") {
  const dept = String(department || "").toLowerCase();
  const aud = String(audience || "").toLowerCase();

  const config = SIZE_OPTIONS[dept];
  if (!config) return [];

  if (aud === "kids" && Array.isArray(config.kids)) {
    return config.kids;
  }

  return config.default || [];
}

window.SIZE_OPTIONS = SIZE_OPTIONS;
window.getSizesForProduct = getSizesForProduct;