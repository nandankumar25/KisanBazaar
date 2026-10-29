const jwt = require('jsonwebtoken');

/**
 * Generate JWT and set it as an HttpOnly cookie on the response
 * @param {Object} res - Express response object
 * @param {String} userId - Mongo User ObjectId string
 * @returns {String} token
 */
const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'kisanbazaar_fallback_dev_secret_key_2026';
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });

  return token;
};

/**
 * Clear the auth cookie on logout
 * @param {Object} res - Express response object
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  });
};

module.exports = {
  generateTokenAndSetCookie,
  clearAuthCookie,
};
