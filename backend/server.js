require("dotenv").config(); // This MUST be line 1
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { setCsrfCookie } = require("./middlewares/csrf.middleware");

// Connect to Database
connectDB();

const app = express();
const cors = require("cors");

app.use(cors({
  origin: "https://aliali734.github.io", // allow your GitHub Pages site
  credentials: true,                     // if using cookies/sessions
}));



// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(cookieParser());
app.use(setCsrfCookie);

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/product", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/header", require("./routes/header.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));