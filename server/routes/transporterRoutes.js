const express = require('express');
const router = express.Router();
const {
  getTransporters,
  getTransporterById,
  calculateTransportCost,
  createTransporter,
  updateTransporter,
  getMyTransporters,
} = require('../controllers/transporterController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getTransporters);
router.post('/calculate-cost', calculateTransportCost);
router.get('/me', protect, authorize('TRANSPORTER', 'ADMIN'), getMyTransporters);
router.post('/', protect, authorize('TRANSPORTER', 'ADMIN'), createTransporter);
router.put('/:id', protect, authorize('TRANSPORTER', 'ADMIN'), updateTransporter);
router.get('/:id', optionalAuth, getTransporterById);

module.exports = router;

