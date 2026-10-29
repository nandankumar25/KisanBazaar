const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware: Ensures the request is authenticated via HttpOnly cookie or Bearer token
 */
const protect = async (req, res, next) => {
  let token = null;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization header if provided
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login to access this resource.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'kisanbazaar_fallback_dev_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account for this session no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please login again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Please login again.',
    });
  }
};

/**
 * Optional authentication: Populates req.user if a valid token is present without blocking the request
 */
const optionalAuth = async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'kisanbazaar_fallback_dev_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (e) {
    // Ignore invalid token in optional auth
  }

  next();
};

/**
 * Role-based authorization middleware
 * @param  {...String} roles - Allowed roles (e.g. 'FARMER', 'BUYER', 'ADMIN', 'TRANSPORTER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    // ADMIN has superuser access to all protected resources
    if (req.user.role === 'ADMIN' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized to access this route.`,
    });
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
};
