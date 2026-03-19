const jwt = require("jsonwebtoken");

const protect = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");

        return res.status(500).json({
          success: false,
          message: "Server configuration error"
        });
      }

      let token = null;

      // Read token from cookie
      if (req.cookies?.token) {
        token = req.cookies.token;
      }

      // Fallback: Authorization header
      const auth = req.headers?.authorization;
      if (!token && auth && auth.startsWith("Bearer ")) {
        token = auth.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No authentication token"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      // Role-based protection
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      return next();
    } catch (err) {
      console.error("Auth middleware error:", err.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};

module.exports = protect;