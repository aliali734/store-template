const jwt = require("jsonwebtoken");

const protect = (roles = []) => {
  return (req, res, next) => {
    try {
      let token = null;

      // 1️⃣ Read token from cookie
      if (req.cookies?.token) {
        token = req.cookies.token;
      }

      // 2️⃣ Fallback: Authorization header
      const auth = req.headers?.authorization;
      if (!token && auth && auth.startsWith("Bearer ")) {
        token = auth.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ message: "No authentication token" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      // Role protection
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();

    } catch (err) {
      console.error("Auth middleware error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = protect;