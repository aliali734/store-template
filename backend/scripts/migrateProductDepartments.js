require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");
const {
  CATALOG_TAXONOMY,
  normalizeCatalogValue
} = require("../utils/catalogTaxonomy");

// ============================
// BUILD CATEGORY -> DEPARTMENT MAP
// ============================
function buildCategoryDepartmentMap() {
  const map = new Map();

  for (const [department, categories] of Object.entries(CATALOG_TAXONOMY)) {
    for (const category of categories) {
      map.set(normalizeCatalogValue(category), department);
    }
  }

  return map;
}

const categoryDepartmentMap = buildCategoryDepartmentMap();

// ============================
// GUESS DEPARTMENT
// ============================
function guessDepartmentFromCategory(category) {
  const normalizedCategory = normalizeCatalogValue(category);
  return categoryDepartmentMap.get(normalizedCategory) || null;
}

// ============================
// MAIN MIGRATION
// ============================
async function migrateProductDepartments() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let updatedCount = 0;
    let skippedCount = 0;
    let unresolvedCount = 0;

    for (const product of products) {
      const originalCategory = product.category;
      const normalizedCategory = normalizeCatalogValue(originalCategory);

      const guessedDepartment = guessDepartmentFromCategory(normalizedCategory);

      if (!guessedDepartment) {
        console.warn(
          `⚠️ Could not determine department for product "${product.name}" (category: "${originalCategory}")`
        );
        unresolvedCount++;
        continue;
      }

      let changed = false;

      if (product.category !== normalizedCategory) {
        product.category = normalizedCategory;
        changed = true;
      }

      if (product.department !== guessedDepartment) {
        product.department = guessedDepartment;
        changed = true;
      }

      if (changed) {
        await product.save();
        updatedCount++;
        console.log(
          `✅ Updated "${product.name}" -> department="${product.department}", category="${product.category}"`
        );
      } else {
        skippedCount++;
      }
    }

    console.log("\n🎉 Migration finished");
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Unresolved: ${unresolvedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrateProductDepartments();