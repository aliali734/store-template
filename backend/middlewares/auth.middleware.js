const jwt = require("jsonwebtoken");

const protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      // =========================
      // VERIFY SERVER CONFIG
      // =========================
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");

        return res.status(500).json({
          success: false,
          message: "Server configuration error"
        });
      }

      let token = null;

      // =========================
      // TOKEN FROM COOKIE
      // =========================
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      // =========================
      // TOKEN FROM AUTH HEADER
      // Fallback for APIs/mobile
      // =========================
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;

        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        }
      }

      // =========================
      // NO TOKEN
      // =========================
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // =========================
      // VERIFY JWT
      // =========================
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // =========================
      // ATTACH USER TO REQUEST
      // =========================
      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      // =========================
      // ROLE AUTHORIZATION
      // =========================
      if (
        roles.length > 0 &&
        !roles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      return next();

    } catch (err) {
      console.error("Auth middleware error:", err);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};

module.exports = protect;