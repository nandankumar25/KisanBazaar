const express = require('express');
const router = express.Router();
const {
  getMandiDemands,
  getMyMandiDemands,
  createMandiDemand,
  updateMandiDemand,
  deleteMandiDemand,
} = require('../controllers/mandiDemandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getMandiDemands);

// Private Mandi Admin endpoints
router.get('/my-demands', protect, authorize('MANDI_ADMIN', 'ADMIN'), getMyMandiDemands);
router.post('/', protect, authorize('MANDI_ADMIN', 'ADMIN'), createMandiDemand);
router.put('/:id', protect, authorize('MANDI_ADMIN', 'ADMIN'), updateMandiDemand);
router.delete('/:id', protect, authorize('MANDI_ADMIN', 'ADMIN'), deleteMandiDemand);

module.exports = router;
