const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminMandis,
  verifyMandi,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Mandi Admin approval & management
router.get('/mandis', getAdminMandis);
router.put('/mandis/:id/verify', verifyMandi);

module.exports = router;
