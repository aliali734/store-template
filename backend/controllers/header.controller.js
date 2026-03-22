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
          { label: "All Shoes", url: "index.html?audience=men&department=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=men&department=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=men&department=shoes&category=sneakers" },
          { label: "Classic Sneakers", url: "index.html?audience=men&department=shoes&category=classic-sneakers" },
          { label: "Boots", url: "index.html?audience=men&department=shoes&category=boots" },
          { label: "Canvas Shoes", url: "index.html?audience=men&department=shoes&category=canvas-shoes" },
          { label: "Sandals & Slides", url: "index.html?audience=men&department=shoes&category=sandals" },
          { label: "Loafers", url: "index.html?audience=men&department=shoes&category=loafers" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=men&department=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=men&department=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=men&department=clothing&category=t-shirts" },
          { label: "Shirts", url: "index.html?audience=men&department=clothing&category=shirts" },
          { label: "Polos", url: "index.html?audience=men&department=clothing&category=polos" },
          { label: "Hoodies & Sweats", url: "index.html?audience=men&department=clothing&category=hoodies" },
          { label: "Sweaters", url: "index.html?audience=men&department=clothing&category=sweaters" },
          { label: "Jackets & Coats", url: "index.html?audience=men&department=clothing&category=jackets" },
          { label: "Jeans", url: "index.html?audience=men&department=clothing&category=jeans" },
          { label: "Pants & Chinos", url: "index.html?audience=men&department=clothing&category=pants" },
          { label: "Shorts", url: "index.html?audience=men&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "index.html?audience=men&department=clothing&category=tracksuits" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=men&department=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=men&department=accessories&promo=true" },
          { label: "Hats & Caps", url: "index.html?audience=men&department=accessories&category=hats" },
          { label: "Beanies", url: "index.html?audience=men&department=accessories&category=beanies" },
          { label: "Belts", url: "index.html?audience=men&department=accessories&category=belts" },
          { label: "Watches", url: "index.html?audience=men&department=accessories&category=watches" },
          { label: "Socks", url: "index.html?audience=men&department=accessories&category=socks" },
          { label: "Bags & Backpacks", url: "index.html?audience=men&department=accessories&category=bags" },
          { label: "Sunglasses", url: "index.html?audience=men&department=accessories&category=sunglasses" },
          { label: "Scarves & Gloves", url: "index.html?audience=men&department=accessories&category=scarves" }
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
          { label: "All Shoes", url: "index.html?audience=women&department=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=women&department=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=women&department=shoes&category=sneakers" },
          { label: "Heels", url: "index.html?audience=women&department=shoes&category=heels" },
          { label: "Boots", url: "index.html?audience=women&department=shoes&category=boots" },
          { label: "Flats", url: "index.html?audience=women&department=shoes&category=flats" },
          { label: "Sandals & Slides", url: "index.html?audience=women&department=shoes&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=women&department=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=women&department=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=women&department=clothing&category=t-shirts" },
          { label: "Blouses & Shirts", url: "index.html?audience=women&department=clothing&category=blouses" },
          { label: "Dresses", url: "index.html?audience=women&department=clothing&category=dresses" },
          { label: "Skirts", url: "index.html?audience=women&department=clothing&category=skirts" },
          { label: "Hoodies & Sweats", url: "index.html?audience=women&department=clothing&category=hoodies" },
          { label: "Sweaters", url: "index.html?audience=women&department=clothing&category=sweaters" },
          { label: "Jackets & Coats", url: "index.html?audience=women&department=clothing&category=jackets" },
          { label: "Jeans", url: "index.html?audience=women&department=clothing&category=jeans" },
          { label: "Pants & Leggings", url: "index.html?audience=women&department=clothing&category=pants" },
          { label: "Shorts", url: "index.html?audience=women&department=clothing&category=shorts" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=women&department=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=women&department=accessories&promo=true" },
          { label: "Bags & Purses", url: "index.html?audience=women&department=accessories&category=bags" },
          { label: "Jewelry", url: "index.html?audience=women&department=accessories&category=jewelry" },
          { label: "Hats & Caps", url: "index.html?audience=women&department=accessories&category=hats" },
          { label: "Watches", url: "index.html?audience=women&department=accessories&category=watches" },
          { label: "Belts", url: "index.html?audience=women&department=accessories&category=belts" },
          { label: "Sunglasses", url: "index.html?audience=women&department=accessories&category=sunglasses" },
          { label: "Scarves & Gloves", url: "index.html?audience=women&department=accessories&category=scarves" }
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
          { label: "All Shoes", url: "index.html?audience=kids&department=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=kids&department=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=kids&department=shoes&category=sneakers" },
          { label: "Boots", url: "index.html?audience=kids&department=shoes&category=boots" },
          { label: "Sandals", url: "index.html?audience=kids&department=shoes&category=sandals" },
          { label: "School Shoes", url: "index.html?audience=kids&department=shoes&category=school-shoes" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=kids&department=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=kids&department=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=kids&department=clothing&category=t-shirts" },
          { label: "Hoodies & Sweats", url: "index.html?audience=kids&department=clothing&category=hoodies" },
          { label: "Jackets", url: "index.html?audience=kids&department=clothing&category=jackets" },
          { label: "Jeans", url: "index.html?audience=kids&department=clothing&category=jeans" },
          { label: "Pants", url: "index.html?audience=kids&department=clothing&category=pants" },
          { label: "Shorts", url: "index.html?audience=kids&department=clothing&category=shorts" },
          { label: "Tracksuits", url: "index.html?audience=kids&department=clothing&category=tracksuits" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=kids&department=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=kids&department=accessories&promo=true" },
          { label: "Hats & Caps", url: "index.html?audience=kids&department=accessories&category=hats" },
          { label: "Bags & Backpacks", url: "index.html?audience=kids&department=accessories&category=bags" },
          { label: "Socks", url: "index.html?audience=kids&department=accessories&category=socks" }
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
          { label: "All Accessories", url: "index.html?department=accessories" },
          { label: "Accessories on Sale", url: "index.html?department=accessories&promo=true" },
          { label: "Bags & Backpacks", url: "index.html?department=accessories&category=bags" },
          { label: "Watches", url: "index.html?department=accessories&category=watches" },
          { label: "Sunglasses", url: "index.html?department=accessories&category=sunglasses" },
          { label: "Belts", url: "index.html?department=accessories&category=belts" },
          { label: "Jewelry", url: "index.html?department=accessories&category=jewelry" }
        ]
      },
      {
        title: "Headwear",
        links: [
          { label: "Hats & Caps", url: "index.html?department=accessories&category=hats" },
          { label: "Beanies", url: "index.html?department=accessories&category=beanies" },
          { label: "Scarves & Gloves", url: "index.html?department=accessories&category=scarves" }
        ]
      }
    ]
  },
  {
    title: "Featured",
    sections: [
      {
        title: "Collections",
        links: [
          { label: "Featured Products", url: "index.html?featured=true" },
          { label: "New Arrivals", url: "index.html?sort=newest" },
          { label: "On Sale", url: "index.html?promo=true" }
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