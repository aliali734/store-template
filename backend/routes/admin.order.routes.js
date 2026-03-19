const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

const {
  getAllOrders,
  getOrderById
} = require("../controllers/admin.order.controller");

router.use(protect());
router.use(admin);

router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);

module.exports = router;