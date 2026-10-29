const express = require('express');
const router = express.Router();
const {
  getCropLots,
  getCropLotById,
  createCropLot,
  updateCropLot,
  deleteCropLot,
} = require('../controllers/cropLotController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getCropLots)
  .post(protect, authorize('FARMER', 'ADMIN'), createCropLot);

router.route('/:id')
  .get(optionalAuth, getCropLotById)
  .put(protect, authorize('FARMER', 'ADMIN'), updateCropLot)
  .delete(protect, authorize('FARMER', 'ADMIN'), deleteCropLot);

module.exports = router;

