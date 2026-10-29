const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  recordPayment,
  updateTransactionStatus,
} = require('../controllers/transactionController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getTransactions)
  .post(protect, createTransaction);

router.post('/:id/payment', protect, recordPayment);
router.put('/:id/status', protect, updateTransactionStatus);
router.get('/:id', optionalAuth, getTransactionById);

module.exports = router;

