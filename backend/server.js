const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const { setCsrfCookie } = require("./middlewares/csrf.middleware");

dotenv.config();
connectDB();

const app = express();

// ✅ CORS (allow both localhost + 127) + allow cookies
// ✅ Update CORS to allow your live GitHub Pages site
app.use(cors({
  origin: [
    "http://127.0.0.1:5500", 
    "https://your-username.github.io" // Add your GitHub Pages URL here!
  ],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ cookie parser first
app.use(cookieParser());

// ✅ then set csrf cookie
app.use(setCsrfCookie);

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/product", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/email-test", require("./routes/email-test.routes"));
app.use("/api/header", require("./routes/header.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));