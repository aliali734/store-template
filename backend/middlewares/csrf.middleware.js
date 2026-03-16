const crypto = require("crypto");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ============================
// SET CSRF COOKIE
// ============================

function setCsrfCookie(req, res, next) {

  if (!req.cookies?.csrfToken) {

    const token = generateCsrfToken();

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("csrfToken", token, {
      httpOnly: false,          // JS must read it to send header
      sameSite: "lax",
      secure: isProd,           // HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

  }

  next();

}

// ============================
// VERIFY CSRF TOKEN
// ============================

function verifyCsrf(req, res, next) {

  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;

  const headerToken =
    req.headers["x-csrf-token"] ||
    req.headers["csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {

    return res.status(403).json({
      message: "CSRF token invalid or missing"
    });

  }

  next();

}

module.exports = {
  setCsrfCookie,
  verifyCsrf
};