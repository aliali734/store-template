// ============================
// ESCAPE REGEX
// User input fed into a MongoDB $regex must be escaped, otherwise:
//   - regex meta-chars (. * + ? ( [ \ etc.) silently change the
//     intended substring search;
//   - a malicious pattern like "(a+)+$" against long strings causes
//     catastrophic backtracking (ReDoS), hanging the Node event loop.
// ============================
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildProductFilter(query) {
  const {
    search,
    department,
    category,
    audience,
    size,
    color,
    priceMin,
    priceMax,
    inStock,
    featured,
    promo
  } = query;

  const filter = { isActive: true };

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name:        { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { brand:       { $regex: safe, $options: "i" } }
    ];
  }

  if (department) filter.department = String(department).toLowerCase();
  if (category) filter.category = String(category).toLowerCase();
  if (audience) filter.audience = String(audience).toLowerCase();
  if (size) filter.sizes = size;
  if (color) filter.colors = color;

  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }

  if (inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  if (featured === "true") {
    filter.featured = true;
  }

  if (promo === "true") {
    filter.compareAtPrice = { $gt: 0 };
  }

  return filter;
}

function buildSortOption(sort) {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "oldest":
      return { createdAt: 1 };
    case "newest":
      return { createdAt: -1 };
    case "name_asc":
      return { name: 1 };
    case "name_desc":
      return { name: -1 };
    default:
      return { createdAt: -1 };
  }
}

function buildPagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

module.exports = {
  buildProductFilter,
  buildSortOption,
  buildPagination,
  escapeRegex
};
