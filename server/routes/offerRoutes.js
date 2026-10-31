const express = require('express');
const router = express.Router();
const {
  createOffer,
  getOffers,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  cancelOffer,
  completeOffer,
  updateOfferStatus,
} = require('../controllers/offerController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getOffers)
  .post(protect, authorize('BUYER', 'ADMIN', 'FARMER'), createOffer);

router.put('/:id/accept', protect, acceptOffer);
router.put('/:id/reject', protect, rejectOffer);
router.put('/:id/counter', protect, authorize('FARMER', 'BUYER', 'ADMIN'), counterOffer);
router.put('/:id/cancel', protect, authorize('BUYER', 'ADMIN', 'FARMER'), cancelOffer);
router.put('/:id/complete', protect, completeOffer);
router.put('/:id/status', protect, updateOfferStatus);
router.get('/:id', optionalAuth, getOfferById);

module.exports = router;
