const express = require('express');
const router = express.Router();
const {
  createTransport,
  getTransports,
  getTransportById,
  updateTransportStatus,
  updateTransportPayment,
  cancelTransport,
} = require('../controllers/transportController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getTransports)
  .post(createTransport);

router.get('/:id', getTransportById);
router.put('/:id/status', updateTransportStatus);
router.put('/:id/payment', updateTransportPayment);
router.put('/:id/cancel', protect, cancelTransport);

module.exports = router;
