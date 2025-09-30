const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

// Check if user has content access
exports.hasContentAccess = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.roles.accessContent)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Content access permission required.",
    });
  }
};

// Check if user has product access
exports.hasProductAccess = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.roles.accessProduct)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Product access permission required.",
    });
  }
};
