const express = require('express');
const router = express.Router();
const {
  createTransport,
  getTransports,
  getTransportById,
  updateTransportStatus,
  updateTransportPayment,
} = require('../controllers/transportController');

router.route('/')
  .get(getTransports)
  .post(createTransport);

router.get('/:id', getTransportById);
router.put('/:id/status', updateTransportStatus);
router.put('/:id/payment', updateTransportPayment);

module.exports = router;
