const Header = require("../models/header");

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
          { label: "All Shoes", url: "/index.html?audience=men&department=shoes" },
          { label: "Shoes on Sale", url: "/index.html?audience=men&department=shoes&promo=true" },
          { label: "Sneakers", url: "/index.html?audience=men&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "/index.html?audience=men&department=shoes&category=classic-sneakers" },
          { label: "High-Top Sneakers", url: "/index.html?audience=men&department=shoes&category=sneakers" },
          { label: "Canvas Shoes", url: "/index.html?audience=men&department=shoes&category=canvas-shoes" },
          { label: "Sandals & Slides", url: "/index.html?audience=men&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "/index.html?audience=men&department=clothing" },
          { label: "Clothing on Sale", url: "/index.html?audience=men&department=clothing&promo=true" },
          { label: "Cardigans", url: "/index.html?audience=men&department=clothing&category=sweaters" },
          { label: "Track Tops", url: "/index.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Jeans & Chinos", url: "/index.html?audience=men&department=clothing&category=jeans" },
          { label: "Track Pants", url: "/index.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Pants & Leggings", url: "/index.html?audience=men&department=clothing&category=pants" },
          { label: "Polos", url: "/index.html?audience=men&department=clothing&category=polos" },
          { label: "Shorts", url: "/index.html?audience=men&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "/index.html?audience=men&department=clothing&category=tracksuits" },
          { label: "Underwear", url: "/index.html?audience=men&department=clothing" },
          { label: "Sweatshirts", url: "/index.html?audience=men&department=clothing&category=hoodies" },
          { label: "T-Shirts & Tanks", url: "/index.html?audience=men&department=clothing&category=t-shirts" },
          { label: "Jackets & Coats", url: "/index.html?audience=men&department=clothing&category=jackets" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "/index.html?audience=men&department=accessories" },
          { label: "Accessories on Sale", url: "/index.html?audience=men&department=accessories&promo=true" },
          { label: "Bucket Hats", url: "/index.html?audience=men&department=accessories&category=hats" },
          { label: "Caps", url: "/index.html?audience=men&department=accessories&category=hats" },
          { label: "Hats & Beanies", url: "/index.html?audience=men&department=accessories&category=beanies" },
          { label: "Socks", url: "/index.html?audience=men&department=accessories&category=socks" },
          { label: "Gloves & Scarves", url: "/index.html?audience=men&department=accessories&category=scarves" },
          { label: "Watches", url: "/index.html?audience=men&department=accessories&category=watches" },
          { label: "Backpacks", url: "/index.html?audience=men&department=accessories&category=bags" },
          { label: "Bags", url: "/index.html?audience=men&department=accessories&category=bags" }
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
          { label: "All Shoes", url: "/index.html?audience=women&department=shoes" },
          { label: "Shoes on Sale", url: "/index.html?audience=women&department=shoes&promo=true" },
          { label: "Sneakers", url: "/index.html?audience=women&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "/index.html?audience=women&department=shoes&category=classic-sneakers" },
          { label: "Heels", url: "/index.html?audience=women&department=shoes&category=heels" },
          { label: "Flats", url: "/index.html?audience=women&department=shoes&category=flats" },
          { label: "Sandals & Slides", url: "/index.html?audience=women&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "/index.html?audience=women&department=clothing" },
          { label: "Clothing on Sale", url: "/index.html?audience=women&department=clothing&promo=true" },
          { label: "Cardigans", url: "/index.html?audience=women&department=clothing&category=sweaters" },
          { label: "Track Tops", url: "/index.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Jeans", url: "/index.html?audience=women&department=clothing&category=jeans" },
          { label: "Track Pants", url: "/index.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Pants & Leggings", url: "/index.html?audience=women&department=clothing&category=pants" },
          { label: "Polos", url: "/index.html?audience=women&department=clothing&category=polos" },
          { label: "Shorts", url: "/index.html?audience=women&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "/index.html?audience=women&department=clothing&category=tracksuits" },
          { label: "Sweatshirts", url: "/index.html?audience=women&department=clothing&category=hoodies" },
          { label: "T-Shirts & Tanks", url: "/index.html?audience=women&department=clothing&category=t-shirts" },
          { label: "Jackets & Coats", url: "/index.html?audience=women&department=clothing&category=jackets" },
          { label: "Dresses", url: "/index.html?audience=women&department=clothing&category=dresses" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "/index.html?audience=women&department=accessories" },
          { label: "Accessories on Sale", url: "/index.html?audience=women&department=accessories&promo=true" },
          { label: "Bucket Hats", url: "/index.html?audience=women&department=accessories&category=hats" },
          { label: "Caps", url: "/index.html?audience=women&department=accessories&category=hats" },
          { label: "Hats & Beanies", url: "/index.html?audience=women&department=accessories&category=beanies" },
          { label: "Socks", url: "/index.html?audience=women&department=accessories&category=socks" },
          { label: "Gloves & Scarves", url: "/index.html?audience=women&department=accessories&category=scarves" },
          { label: "Watches", url: "/index.html?audience=women&department=accessories&category=watches" },
          { label: "Backpacks", url: "/index.html?audience=women&department=accessories&category=bags" },
          { label: "Bags", url: "/index.html?audience=women&department=accessories&category=bags" }
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
          { label: "All Shoes", url: "/index.html?audience=kids&department=shoes" },
          { label: "Shoes on Sale", url: "/index.html?audience=kids&department=shoes&promo=true" },
          { label: "Sneakers", url: "/index.html?audience=kids&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "/index.html?audience=kids&department=shoes&category=classic-sneakers" },
          { label: "Boots", url: "/index.html?audience=kids&department=shoes&category=boots" },
          { label: "Canvas Shoes", url: "/index.html?audience=kids&department=shoes&category=canvas-shoes" },
          { label: "Sandals", url: "/index.html?audience=kids&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "/index.html?audience=kids&department=clothing" },
          { label: "Clothing on Sale", url: "/index.html?audience=kids&department=clothing&promo=true" },
          { label: "Sweatshirts", url: "/index.html?audience=kids&department=clothing&category=hoodies" },
          { label: "Track Tops", url: "/index.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "Jeans", url: "/index.html?audience=kids&department=clothing&category=jeans" },
          { label: "Track Pants", url: "/index.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "Pants", url: "/index.html?audience=kids&department=clothing&category=pants" },
          { label: "Shorts", url: "/index.html?audience=kids&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "/index.html?audience=kids&department=clothing&category=tracksuits" },
          { label: "T-Shirts", url: "/index.html?audience=kids&department=clothing&category=t-shirts" },
          { label: "Jackets", url: "/index.html?audience=kids&department=clothing&category=jackets" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "/index.html?audience=kids&department=accessories" },
          { label: "Accessories on Sale", url: "/index.html?audience=kids&department=accessories&promo=true" },
          { label: "Caps", url: "/index.html?audience=kids&department=accessories&category=hats" },
          { label: "Beanies", url: "/index.html?audience=kids&department=accessories&category=beanies" },
          { label: "Socks", url: "/index.html?audience=kids&department=accessories&category=socks" },
          { label: "Backpacks", url: "/index.html?audience=kids&department=accessories&category=bags" },
          { label: "Bags", url: "/index.html?audience=kids&department=accessories&category=bags" }
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
          { label: "All Accessories", url: "/index.html?department=accessories" },
          { label: "Accessories on Sale", url: "/index.html?department=accessories&promo=true" },
          { label: "Bags & Backpacks", url: "/index.html?department=accessories&category=bags" },
          { label: "Watches", url: "/index.html?department=accessories&category=watches" },
          { label: "Sunglasses", url: "/index.html?department=accessories&category=sunglasses" },
          { label: "Belts", url: "/index.html?department=accessories&category=belts" },
          { label: "Jewelry", url: "/index.html?department=accessories&category=jewelry" }
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
      header.logo = `/uploads/header/${req.file.filename}`;
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