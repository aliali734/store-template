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
          { label: "All Shoes", url: "index.html?audience=men&category=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=men&category=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=men&category=sneakers" },
          { label: "Classic Sneakers", url: "index.html?audience=men&category=classic-sneakers" },
          { label: "Boots", url: "index.html?audience=men&category=boots" },
          { label: "Canvas Shoes", url: "index.html?audience=men&category=canvas-shoes" },
          { label: "Sandals & Slides", url: "index.html?audience=men&category=sandals" },
          { label: "Loafers", url: "index.html?audience=men&category=loafers" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=men&category=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=men&category=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=men&category=t-shirts" },
          { label: "Shirts", url: "index.html?audience=men&category=shirts" },
          { label: "Polos", url: "index.html?audience=men&category=polos" },
          { label: "Hoodies & Sweats", url: "index.html?audience=men&category=hoodies" },
          { label: "Sweaters", url: "index.html?audience=men&category=sweaters" },
          { label: "Jackets & Coats", url: "index.html?audience=men&category=jackets" },
          { label: "Jeans", url: "index.html?audience=men&category=jeans" },
          { label: "Pants & Chinos", url: "index.html?audience=men&category=pants" },
          { label: "Shorts", url: "index.html?audience=men&category=shorts" },
          { label: "Tracksuits", url: "index.html?audience=men&category=tracksuits" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=men&category=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=men&category=accessories&promo=true" },
          { label: "Hats & Caps", url: "index.html?audience=men&category=hats" },
          { label: "Beanies", url: "index.html?audience=men&category=beanies" },
          { label: "Belts", url: "index.html?audience=men&category=belts" },
          { label: "Watches", url: "index.html?audience=men&category=watches" },
          { label: "Socks", url: "index.html?audience=men&category=socks" },
          { label: "Bags & Backpacks", url: "index.html?audience=men&category=bags" },
          { label: "Sunglasses", url: "index.html?audience=men&category=sunglasses" },
          { label: "Scarves & Gloves", url: "index.html?audience=men&category=scarves" }
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
          { label: "All Shoes", url: "index.html?audience=women&category=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=women&category=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=women&category=sneakers" },
          { label: "Heels", url: "index.html?audience=women&category=heels" },
          { label: "Boots", url: "index.html?audience=women&category=boots" },
          { label: "Flats", url: "index.html?audience=women&category=flats" },
          { label: "Sandals & Slides", url: "index.html?audience=women&category=sandals" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=women&category=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=women&category=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=women&category=t-shirts" },
          { label: "Blouses & Shirts", url: "index.html?audience=women&category=blouses" },
          { label: "Dresses", url: "index.html?audience=women&category=dresses" },
          { label: "Skirts", url: "index.html?audience=women&category=skirts" },
          { label: "Hoodies & Sweats", url: "index.html?audience=women&category=hoodies" },
          { label: "Sweaters", url: "index.html?audience=women&category=sweaters" },
          { label: "Jackets & Coats", url: "index.html?audience=women&category=jackets" },
          { label: "Jeans", url: "index.html?audience=women&category=jeans" },
          { label: "Pants & Leggings", url: "index.html?audience=women&category=pants" },
          { label: "Shorts", url: "index.html?audience=women&category=shorts" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=women&category=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=women&category=accessories&promo=true" },
          { label: "Bags & Purses", url: "index.html?audience=women&category=bags" },
          { label: "Jewelry", url: "index.html?audience=women&category=jewelry" },
          { label: "Hats & Caps", url: "index.html?audience=women&category=hats" },
          { label: "Watches", url: "index.html?audience=women&category=watches" },
          { label: "Belts", url: "index.html?audience=women&category=belts" },
          { label: "Sunglasses", url: "index.html?audience=women&category=sunglasses" },
          { label: "Scarves & Gloves", url: "index.html?audience=women&category=scarves" }
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
          { label: "All Shoes", url: "index.html?audience=kids&category=shoes" },
          { label: "Shoes on Sale", url: "index.html?audience=kids&category=shoes&promo=true" },
          { label: "Sneakers", url: "index.html?audience=kids&category=sneakers" },
          { label: "Boots", url: "index.html?audience=kids&category=boots" },
          { label: "Sandals", url: "index.html?audience=kids&category=sandals" },
          { label: "School Shoes", url: "index.html?audience=kids&category=school-shoes" }
        ]
      },
      {
        title: "Clothing",
        links: [
          { label: "All Clothing", url: "index.html?audience=kids&category=clothing" },
          { label: "Clothing on Sale", url: "index.html?audience=kids&category=clothing&promo=true" },
          { label: "T-Shirts", url: "index.html?audience=kids&category=t-shirts" },
          { label: "Hoodies & Sweats", url: "index.html?audience=kids&category=hoodies" },
          { label: "Jackets", url: "index.html?audience=kids&category=jackets" },
          { label: "Jeans", url: "index.html?audience=kids&category=jeans" },
          { label: "Pants", url: "index.html?audience=kids&category=pants" },
          { label: "Shorts", url: "index.html?audience=kids&category=shorts" },
          { label: "Tracksuits", url: "index.html?audience=kids&category=tracksuits" }
        ]
      },
      {
        title: "Accessories",
        links: [
          { label: "All Accessories", url: "index.html?audience=kids&category=accessories" },
          { label: "Accessories on Sale", url: "index.html?audience=kids&category=accessories&promo=true" },
          { label: "Hats & Caps", url: "index.html?audience=kids&category=hats" },
          { label: "Bags & Backpacks", url: "index.html?audience=kids&category=bags" },
          { label: "Socks", url: "index.html?audience=kids&category=socks" }
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
          { label: "All Accessories", url: "index.html?category=accessories" },
          { label: "Accessories on Sale", url: "index.html?category=accessories&promo=true" },
          { label: "Bags & Backpacks", url: "index.html?category=bags" },
          { label: "Watches", url: "index.html?category=watches" },
          { label: "Sunglasses", url: "index.html?category=sunglasses" },
          { label: "Belts", url: "index.html?category=belts" },
          { label: "Jewelry", url: "index.html?category=jewelry" }
        ]
      },
      {
        title: "Headwear",
        links: [
          { label: "Hats & Caps", url: "index.html?category=hats" },
          { label: "Beanies", url: "index.html?category=beanies" },
          { label: "Scarves & Gloves", url: "index.html?category=scarves" }
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