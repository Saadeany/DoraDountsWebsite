const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Verifies a customer or admin JWT and attaches the user to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed or expired." });
  }
};

// Restricts a route to admin role only (used after `protect`)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required." });
};

// Attaches req.user if a valid token is present, but never blocks the request.
// Useful for routes like product listing where logged-out users are still allowed.
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (user && !user.is_blocked) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, adminOnly, optionalAuth };
