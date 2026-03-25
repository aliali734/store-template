const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Header = require("../models/header");

// ============================
// CLOUDINARY UPLOAD HELPER
// ============================
function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ============================
// DEFAULT MENU
// ============================
const defaultMenu = [
  {
    title: "Men",
    sections: [
      {
        title: "Shoes",
        links: [
          { label: "All Shoes", url: "shop.html?audience=men&department=shoes" },
          { label: "Shoes on Sale", url: "shop.html?audience=men&department=shoes&promo=true" },
          { label: "Sneakers", url: "shop.html?audience=men&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "shop.html?audience=men&department=shoes&category=classic-sneakers" },
          { label: "High-Top Sneakers", url: "shop.html?audience=men&department=shoes&category=sneakers" },
          { label: "Canvas Shoes", url: "shop.html?audience=men&department=shoes&category=canvas-shoes" },
          { label: "Sandals & Slides", url: "shop.html?audience=men&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "shop.html?audience=men&department=clothing" },
          { label: "Clothing on Sale", url: "shop.html?audience=men&department=clothing&promo=true" },
          { label: "Cardigans", url: "shop.html?audience=men&department=clothing&category=sweaters" },
          { label: "Track Tops", url: "shop.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Jeans & Chinos", url: "shop.html?audience=men&department=clothing&category=jeans" },
          { label: "Track Pants", url: "shop.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Pants & Leggings", url: "shop.html?audience=men&department=clothing&category=pants" },
          { label: "Polos", url: "shop.html?audience=men&department=clothing&category=polos" },
          { label: "Shorts", url: "shop.html?audience=men&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "shop.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Underwear", url: "shop.html?audience=men&department=clothing" },
          { label: "Sweatshirts", url: "shop.html?audience=men&department=clothing&category=hoodies" },
          { label: "T-Shirts & Tanks", url: "shop.html?audience=men&department=clothing&category=t-shirts" },
          { label: "Jackets & Coats", url: "shop.html?audience=men&department=clothing&category=jackets" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "shop.html?audience=men&department=accessories" },
          { label: "Accessories on Sale", url: "shop.html?audience=men&department=accessories&promo=true" },
          { label: "Bucket Hats", url: "shop.html?audience=men&department=accessories&category=hats" },
          { label: "Caps", url: "shop.html?audience=men&department=accessories&category=hats" },
          { label: "Hats & Beanies", url: "shop.html?audience=men&department=accessories&category=beanies" },
          { label: "Socks", url: "shop.html?audience=men&department=accessories&category=socks" },
          { label: "Gloves & Scarves", url: "shop.html?audience=men&department=accessories&category=scarves" },
          { label: "Watches", url: "shop.html?audience=men&department=accessories&category=watches" },
          { label: "Backpacks", url: "shop.html?audience=men&department=accessories&category=bags" },
          { label: "Bags", url: "shop.html?audience=men&department=accessories&category=bags" }
        ]
      }
    ]
  },
  {
    title: "Women",
    sections: [
      {
        title: "Shoes",
        links: [
          { label: "All Shoes", url: "shop.html?audience=women&department=shoes" },
          { label: "Shoes on Sale", url: "shop.html?audience=women&department=shoes&promo=true" },
          { label: "Sneakers", url: "shop.html?audience=women&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "shop.html?audience=women&department=shoes&category=classic-sneakers" },
          { label: "Heels", url: "shop.html?audience=women&department=shoes&category=heels" },
          { label: "Flats", url: "shop.html?audience=women&department=shoes&category=flats" },
          { label: "Sandals & Slides", url: "shop.html?audience=women&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "shop.html?audience=women&department=clothing" },
          { label: "Clothing on Sale", url: "shop.html?audience=women&department=clothing&promo=true" },
          { label: "Cardigans", url: "shop.html?audience=women&department=clothing&category=sweaters" },
          { label: "Track Tops", url: "shop.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Jeans", url: "shop.html?audience=women&department=clothing&category=jeans" },
          { label: "Track Pants", url: "shop.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Pants & Leggings", url: "shop.html?audience=women&department=clothing&category=pants" },
          { label: "Polos", url: "shop.html?audience=women&department=clothing&category=polos" },
          { label: "Shorts", url: "shop.html?audience=women&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "shop.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Sweatshirts", url: "shop.html?audience=women&department=clothing&category=hoodies" },
          { label: "T-Shirts & Tanks", url: "shop.html?audience=women&department=clothing&category=t-shirts" },
          { label: "Jackets & Coats", url: "shop.html?audience=women&department=clothing&category=jackets" },
          { label: "Dresses", url: "shop.html?audience=women&department=clothing&category=dresses" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "shop.html?audience=women&department=accessories" },
          { label: "Accessories on Sale", url: "shop.html?audience=women&department=accessories&promo=true" },
          { label: "Bucket Hats", url: "shop.html?audience=women&department=accessories&category=hats" },
          { label: "Caps", url: "shop.html?audience=women&department=accessories&category=hats" },
          { label: "Hats & Beanies", url: "shop.html?audience=women&department=accessories&category=beanies" },
          { label: "Socks", url: "shop.html?audience=women&department=accessories&category=socks" },
          { label: "Gloves & Scarves", url: "shop.html?audience=women&department=accessories&category=scarves" },
          { label: "Watches", url: "shop.html?audience=women&department=accessories&category=watches" },
          { label: "Backpacks", url: "shop.html?audience=women&department=accessories&category=bags" },
          { label: "Bags", url: "shop.html?audience=women&department=accessories&category=bags" }
        ]
      }
    ]
  },
  {
    title: "Kids",
    sections: [
      {
        title: "Shoes",
        links: [
          { label: "All Shoes", url: "shop.html?audience=kids&department=shoes" },
          { label: "Shoes on Sale", url: "shop.html?audience=kids&department=shoes&promo=true" },
          { label: "Sneakers", url: "shop.html?audience=kids&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "shop.html?audience=kids&department=shoes&category=classic-sneakers" },
          { label: "Boots", url: "shop.html?audience=kids&department=shoes&category=boots" },
          { label: "Canvas Shoes", url: "shop.html?audience=kids&department=shoes&category=canvas-shoes" },
          { label: "Sandals", url: "shop.html?audience=kids&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "shop.html?audience=kids&department=clothing" },
          { label: "Clothing on Sale", url: "shop.html?audience=kids&department=clothing&promo=true" },
          { label: "Sweatshirts", url: "shop.html?audience=kids&department=clothing&category=hoodies" },
          { label: "Track Tops", url: "shop.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "Jeans", url: "shop.html?audience=kids&department=clothing&category=jeans" },
          { label: "Track Pants", url: "shop.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "Pants", url: "shop.html?audience=kids&department=clothing&category=pants" },
          { label: "Shorts", url: "shop.html?audience=kids&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "shop.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "T-Shirts", url: "shop.html?audience=kids&department=clothing&category=t-shirts" },
          { label: "Jackets", url: "shop.html?audience=kids&department=clothing&category=jackets" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "shop.html?audience=kids&department=accessories" },
          { label: "Accessories on Sale", url: "shop.html?audience=kids&department=accessories&promo=true" },
          { label: "Caps", url: "shop.html?audience=kids&department=accessories&category=hats" },
          { label: "Beanies", url: "shop.html?audience=kids&department=accessories&category=beanies" },
          { label: "Socks", url: "shop.html?audience=kids&department=accessories&category=socks" },
          { label: "Backpacks", url: "shop.html?audience=kids&department=accessories&category=bags" },
          { label: "Bags", url: "shop.html?audience=kids&department=accessories&category=bags" }
        ]
      }
    ]
  },
  {
    title: "Accessories",
    sections: [
      {
        title: "Popular",
        links: [
          { label: "All Accessories", url: "shop.html?department=accessories" },
          { label: "Accessories on Sale", url: "shop.html?department=accessories&promo=true" },
          { label: "Bags & Backpacks", url: "shop.html?department=accessories&category=bags" },
          { label: "Watches", url: "shop.html?department=accessories&category=watches" },
          { label: "Sunglasses", url: "shop.html?department=accessories&category=sunglasses" },
          { label: "Belts", url: "shop.html?department=accessories&category=belts" },
          { label: "Jewelry", url: "shop.html?department=accessories&category=jewelry" }
        ]
      }
    ]
  }
];

// ============================
// GET HEADER
// ============================
const getHeader = async (req, res) => {
  try {
    let header = await Header.findOne();

    if (!header) {
      header = await Header.create({
        logo: "",
        menu: defaultMenu
      });
    } else if (!header.menu || header.menu.length === 0) {
      header.menu = defaultMenu;
      await header.save();
    }

    return res.json({
      success: true,
      header
    });
  } catch (error) {
    console.error("Get header error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load header"
    });
  }
};

// ============================
// UPDATE HEADER
// ============================
const updateHeader = async (req, res) => {
  try {
    let header = await Header.findOne();

    if (!header) {
      header = await Header.create({
        logo: "",
        menu: defaultMenu
      });
    }

    if (req.body.menu) {
      try {
        header.menu = JSON.parse(req.body.menu);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu JSON format"
        });
      }
    }

    if (req.file) {
      const uploadedLogo = await uploadBufferToCloudinary(
        req.file.buffer,
        "store-template/header"
      );

      header.logo = uploadedLogo.secure_url;
    }

    await header.save();

    return res.json({
      success: true,
      header
    });
  } catch (error) {
    console.error("Update header error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update header"
    });
  }
};

module.exports = {
  getHeader,
  updateHeader
};