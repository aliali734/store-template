require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const path         = require("path");
const fs           = require("fs");
const cookieParser = require("cookie-parser");
const connectDB    = require("./config/db");
const { setCsrfCookie } = require("./middlewares/csrf.middleware");

const app   = express();
const isDev = process.env.NODE_ENV !== "production";

// ── Ensure upload folders exist ────────────────────────────────────────────
const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads/header"),
  path.join(__dirname, "uploads/products")
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ── Ensure public/models folder exists (for 3D hero model) ────────────────
const modelDir = path.join(__dirname, "public", "models");
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://aliali734.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-csrf-token",
    "csrf-token"
  ]
}));

app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

// ── Webhook routes (must be before body parsers) ───────────────────────────
// Both Stripe and Moyasar require the raw request body for HMAC signature
// verification, so they are mounted here before express.json() runs.
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/payment.controllers").handleStripeWebhook
);

app.post(
  "/api/payments/moyasar/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/payment.controllers").handleMoyasarWebhook
);

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Cookies + CSRF ─────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(setCsrfCookie);

// ── Public CSRF route ──────────────────────────────────────────────────────
app.get("/api/csrf", (req, res) => {
  res.json({
    success:   true,
    csrfToken: req.cookies.csrfToken || null
  });
});

// ── Static folders ─────────────────────────────────────────────────────────
// /uploads  — product images, header logos, etc.
// /public   — static frontend assets including /public/models/hero.glb
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// ── Application routes ─────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/auth.routes"));
app.use("/api/product",     require("./routes/product.routes"));
app.use("/api/orders",      require("./routes/order.routes"));
app.use("/api/header",      require("./routes/header.routes"));
app.use("/api/settings",    require("./routes/storeSettings.routes"));
app.use("/api/setup",       require("./routes/setup.routes"));
app.use("/api/setup-admin", require("./routes/setupAdmin.routes"));
app.use("/api/payments",    require("./routes/payment.routes"));
app.use("/api/model",       require("./routes/model.routes"));

// ── Development-only routes ────────────────────────────────────────────────
// These expose internal details and debug tooling. They must never run in
// production. Set NODE_ENV=production in your deployment environment and
// they will not be mounted at all.
if (isDev) {
  app.use("/api/test",       require("./routes/test.routes"));
  app.use("/api/email-test", require("./routes/email-test.routes"));

  console.log("⚠️  Development mode: /api/test and /api/email-test are active.");
}

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();