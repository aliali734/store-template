require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");
const { setCsrfCookie } = require("./middlewares/csrf.middleware");

// Connect to Database
connectDB();

const app = express();

// ✅ CORS setup for GitHub Pages + cookies
app.use(cors({
  origin: "https://aliali734.github.io", // Your frontend URL
  credentials: true,                     // Needed for cookies/auth
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());
app.use(setCsrfCookie);

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/product", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/header", require("./routes/header.routes"));

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));