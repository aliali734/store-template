// utils/productFilter.js

// ============================
// BUILD FILTER QUERY
// ============================
function buildProductFilter(query) {
  const {
    search,
    category,
    audience,
    size,
    color,
    priceMin,
    priceMax,
    inStock,
    featured
  } = query;

  const filter = { isActive: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } }
    ];
  }

  if (category) filter.category = category;
  if (audience) filter.audience = audience;
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

  return filter;
}

// ============================
// BUILD SORT OPTION
// ============================
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

// ============================
// BUILD PAGINATION
// ============================
function buildPagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

module.exports = {
  buildProductFilter,
  buildSortOption,
  buildPagination
};