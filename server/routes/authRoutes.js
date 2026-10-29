const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatarMiddleware } = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadAvatarMiddleware, uploadAvatar);
router.delete('/avatar', protect, removeAvatar);
router.post('/logout', logout);

module.exports = router;
