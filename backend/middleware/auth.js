const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "webfixer_secret_key_123";

/**
 * Middleware to verify JWT token.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware to verify Admin role.
 * Assumes verifyToken has already run and attached req.user.
 */
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
}

module.exports = { verifyToken, isAdmin };
