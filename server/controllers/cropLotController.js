const CropLot = require('../models/CropLot');

// @desc    Get all crop lots with optional filters
// @route   GET /api/crop-lots
// @access  Public
const getCropLots = async (req, res, next) => {
  try {
    const { crop, qualityGrade, state, district, city, status, farmer } = req.query;

    const filter = {};

    // Default status to 'AVAILABLE' unless status is provided or set to 'ALL'
    if (status && status !== 'ALL') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'AVAILABLE';
    }

    if (farmer) {
      filter.farmer = farmer;
    }
    if (crop) {
      filter.crop = { $regex: new RegExp(crop, 'i') };
    }
    if (qualityGrade) {
      filter.qualityGrade = { $regex: new RegExp(qualityGrade, 'i') };
    }
    if (state) {
      filter['location.state'] = { $regex: new RegExp(state, 'i') };
    }
    if (district) {
      filter['location.district'] = { $regex: new RegExp(district, 'i') };
    }
    if (city) {
      filter['location.city'] = { $regex: new RegExp(city, 'i') };
    }

    const cropLots = await CropLot.find(filter)
      .populate('farmer', 'name email phone location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cropLots.length,
      data: cropLots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single crop lot by ID
// @route   GET /api/crop-lots/:id
// @access  Public
const getCropLotById = async (req, res, next) => {
  try {
    const cropLot = await CropLot.findById(req.params.id).populate(
      'farmer',
      'name email phone location'
    );

    if (!cropLot) {
      return res.status(404).json({
        success: false,
        message: 'Crop lot not found',
      });
    }

    res.status(200).json({
      success: true,
      data: cropLot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new crop lot
// @route   POST /api/crop-lots
// @access  Private (FARMER only)
const createCropLot = async (req, res, next) => {
  try {
    const lotData = { ...req.body };
    if (req.user) {
      lotData.farmer = req.user._id;
    }

    if (!lotData.farmer) {
      return res.status(400).json({
        success: false,
        message: 'Farmer identity is required.',
      });
    }

    const newCropLot = await CropLot.create(lotData);

    const populatedLot = await CropLot.findById(newCropLot._id).populate(
      'farmer',
      'name email phone location'
    );

    res.status(201).json({
      success: true,
      data: populatedLot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a crop lot
// @route   PUT /api/crop-lots/:id
// @access  Private (FARMER only - owner or ADMIN)
const updateCropLot = async (req, res, next) => {
  try {
    const existingLot = await CropLot.findById(req.params.id);
    if (!existingLot) {
      return res.status(404).json({
        success: false,
        message: 'Crop lot not found',
      });
    }

    // Ownership check: only owner farmer or ADMIN can update
    if (req.user && req.user.role !== 'ADMIN' && existingLot.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this crop lot.',
      });
    }

    const updatedLot = await CropLot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farmer', 'name email phone location');

    res.status(200).json({
      success: true,
      data: updatedLot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a crop lot
// @route   DELETE /api/crop-lots/:id
// @access  Private (FARMER only - owner or ADMIN)
const deleteCropLot = async (req, res, next) => {
  try {
    const cropLot = await CropLot.findById(req.params.id);

    if (!cropLot) {
      return res.status(404).json({
        success: false,
        message: 'Crop lot not found',
      });
    }

    // Ownership check: only owner farmer or ADMIN can delete
    if (req.user && req.user.role !== 'ADMIN' && cropLot.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this crop lot.',
      });
    }

    await CropLot.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Crop lot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCropLots,
  getCropLotById,
  createCropLot,
  updateCropLot,
  deleteCropLot,
};
