require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const { setCsrfCookie } = require("./middlewares/csrf.middleware");

// Connect to MongoDB
connectDB();

const app = express();

// ===============================
// CORS CONFIG (GitHub Pages → Render)
// ===============================

const allowedOrigins = [
  "https://aliali734.github.io"
];

app.use(cors({
  origin: function (origin, callback) {

    // allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-csrf-token"
  ]
}));

// Handle preflight requests
app.options("*", cors());

// ===============================
// BODY PARSERS
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// COOKIE PARSER + CSRF
// ===============================

app.use(cookieParser());
app.use(setCsrfCookie);

// ===============================
// STATIC FILES
// ===============================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// ROUTES
// ===============================

app.use("/api/test", require("./routes/test.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/product", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/header", require("./routes/header.routes"));

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});