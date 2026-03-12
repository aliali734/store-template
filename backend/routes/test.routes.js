const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { testRoute } = require("../controllers/test.controller");

router.get("/user", protect(), testRoute);
router.get("/admin", protect(["admin"]), testRoute);

module.exports = router;
