const crypto = require("crypto");

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(req, res, next) {
  if (!req.cookies?.csrfToken) {
    const token = generateCsrfToken();
    res.cookie("csrfToken", token, {
      httpOnly: false, // readable by JS
      sameSite: "lax",
      secure: false,   // true in production (https)
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
  next();
}

function verifyCsrf(req, res, next) {
  // allow safe methods
  const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  if (SAFE_METHODS.includes(req.method)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "CSRF token invalid or missing" });
  }

  next();
}

module.exports = { setCsrfCookie, verifyCsrf };