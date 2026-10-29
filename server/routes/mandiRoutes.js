const express = require('express');
const router = express.Router();
const {
  getMandis,
  getMandiById,
  getMyMandi,
  updateMyMandi,
} = require('../controllers/mandiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getMandis);

// Private Mandi Admin endpoints (must be defined before /:id)
router.get('/my-mandi', protect, authorize('MANDI_ADMIN', 'ADMIN'), getMyMandi);
router.put('/my-mandi', protect, authorize('MANDI_ADMIN', 'ADMIN'), updateMyMandi);

router.get('/:id', getMandiById);

module.exports = router;
