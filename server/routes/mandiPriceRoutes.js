const express = require('express');
const router = express.Router();
const {
  getMandiPrices,
  getCropPriceTrends,
  getMandiPriceById,
  createMandiPrice,
  updateMandiPrice,
  deleteMandiPrice,
} = require('../controllers/mandiPriceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getMandiPrices);
router.get('/trends/:crop', getCropPriceTrends);
router.get('/:id', getMandiPriceById);

// Protected Mandi Admin / Admin price management
router.post('/', protect, authorize('MANDI_ADMIN', 'ADMIN'), createMandiPrice);
router.put('/:id', protect, authorize('MANDI_ADMIN', 'ADMIN'), updateMandiPrice);
router.delete('/:id', protect, authorize('MANDI_ADMIN', 'ADMIN'), deleteMandiPrice);

module.exports = router;
