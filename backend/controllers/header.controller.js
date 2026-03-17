const Header = require("../models/header");

// default menu if header does not exist yet
const defaultMenu = [
  {
    title: "Men",
    sections: [
      {
        title: "Tops",
        links: [
          { label: "T-Shirts", url: "index.html?audience=men&category=t-shirts" },
          { label: "Shirts", url: "index.html?audience=men&category=shirts" },
          { label: "Hoodies", url: "index.html?audience=men&category=hoodies" },
          { label: "Jackets", url: "index.html?audience=men&category=jackets" }
        ]
      },
      {
        title: "Bottoms",
        links: [
          { label: "Pants", url: "index.html?audience=men&category=pants" },
          { label: "Jeans", url: "index.html?audience=men&category=jeans" },
          { label: "Shorts", url: "index.html?audience=men&category=shorts" }
        ]
      }
    ]
  },
  {
    title: "Women",
    sections: [
      {
        title: "Tops",
        links: [
          { label: "T-Shirts", url: "index.html?audience=women&category=t-shirts" },
          { label: "Shirts", url: "index.html?audience=women&category=shirts" },
          { label: "Hoodies", url: "index.html?audience=women&category=hoodies" },
          { label: "Jackets", url: "index.html?audience=women&category=jackets" }
        ]
      },
      {
        title: "Bottoms",
        links: [
          { label: "Pants", url: "index.html?audience=women&category=pants" },
          { label: "Jeans", url: "index.html?audience=women&category=jeans" },
          { label: "Skirts", url: "index.html?audience=women&category=skirts" }
        ]
      },
      {
        title: "Dresses",
        links: [
          { label: "Dresses", url: "index.html?audience=women&category=dresses" }
        ]
      }
    ]
  },
  {
    title: "Kids",
    sections: [
      {
        title: "Tops",
        links: [
          { label: "T-Shirts", url: "index.html?audience=kids&category=t-shirts" },
          { label: "Hoodies", url: "index.html?audience=kids&category=hoodies" },
          { label: "Jackets", url: "index.html?audience=kids&category=jackets" }
        ]
      },
      {
        title: "Bottoms",
        links: [
          { label: "Pants", url: "index.html?audience=kids&category=pants" },
          { label: "Jeans", url: "index.html?audience=kids&category=jeans" },
          { label: "Shorts", url: "index.html?audience=kids&category=shorts" }
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
          { label: "Featured", url: "index.html?featured=true" },
          { label: "New Arrivals", url: "index.html?sort=newest" }
        ]
      }
    ]
  }
];

// GET header
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

    res.json({ success: true, header });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE header (admin)
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
        return res.status(400).json({ message: "Invalid menu JSON format" });
      }
    }

    if (req.file) {
      header.logo = `/uploads/header/${req.file.filename}`;
    }

    await header.save();

    res.json({ success: true, header });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHeader, updateHeader };