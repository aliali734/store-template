const express = require("express");
const router  = express.Router();

const protect = require("../middlewares/auth.middleware");
const admin   = require("../middlewares/admin.middleware");

// Import directly from the main order controller — the functions are
// identical to what was in admin.order.controller.js, which has been
// removed. There is no reason to maintain a separate controller file
// that just duplicates two functions.
const {
  getAllOrders,
  getOrderById
} = require("../controllers/order.controller");

router.use(protect());
router.use(admin);

router.get("/orders",     getAllOrders);
router.get("/orders/:id", getOrderById);

module.exports = router;