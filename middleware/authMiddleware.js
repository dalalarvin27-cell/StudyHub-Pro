const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. Authentication token missing." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "eduvault_super_secret_jwt_key_2026");
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired authentication token." });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ success: false, message: "Access denied. Admin permissions required." });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };