const express = require('express');
const router = express.Router();
const {
  createBooking,
  getFarmerBookings,
  getMandiBookings,
  getBookingById,
  reviewBooking,
  markArrived,
  recordQualityAndWeighing,
  completeSale,
  updatePaymentStatus,
  getMandiStats,
  cancelMandiBooking,
  completeMandiBooking,
  counterMandiBooking,
} = require('../controllers/mandiBookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(protect);

// Farmer creates booking request
router.post('/', authorize('FARMER', 'ADMIN'), createBooking);

// Farmer views their bookings
router.get('/farmer', authorize('FARMER', 'ADMIN'), getFarmerBookings);

// Mandi Admin dashboard statistics
router.get('/stats', authorize('MANDI_ADMIN', 'ADMIN'), getMandiStats);

// Mandi Admin views incoming bookings
router.get('/mandi', authorize('MANDI_ADMIN', 'ADMIN', 'FARMER'), getMandiBookings);

// Booking actions (Mandi Admin)
router.put('/:id/review', authorize('MANDI_ADMIN', 'ADMIN'), reviewBooking);
router.put('/:id/arrival', authorize('MANDI_ADMIN', 'ADMIN'), markArrived);
router.put('/:id/quality-weighing', authorize('MANDI_ADMIN', 'ADMIN'), recordQualityAndWeighing);
router.put('/:id/complete', authorize('MANDI_ADMIN', 'ADMIN'), completeSale);
router.put('/:id/payment', authorize('MANDI_ADMIN', 'ADMIN'), updatePaymentStatus);

// Farmer and Mandi actions on booking
router.put('/:id/cancel', authorize('FARMER', 'ADMIN', 'MANDI_ADMIN'), cancelMandiBooking);
router.put('/:id/complete-order', authorize('FARMER', 'ADMIN', 'MANDI_ADMIN'), completeMandiBooking);
router.put('/:id/counter', authorize('FARMER', 'ADMIN', 'MANDI_ADMIN'), counterMandiBooking);

// View single booking details
router.get('/:id', getBookingById);

module.exports = router;
