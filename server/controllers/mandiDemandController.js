const MandiDemand = require('../models/MandiDemand');
const Mandi = require('../models/Mandi');

// @desc    Get all active mandi crop demands
// @route   GET /api/mandi-demands
// @access  Public
const getMandiDemands = async (req, res, next) => {
  try {
    const { crop, mandi, state, status = 'ACTIVE' } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (crop) {
      filter.crop = { $regex: new RegExp(crop, 'i') };
    }
    if (mandi) {
      filter.mandi = mandi;
    }

    if (state) {
      const matchingMandis = await Mandi.find({
        state: { $regex: new RegExp(state, 'i') },
      }).select('_id');
      filter.mandi = { $in: matchingMandis.map((m) => m._id) };
    }

    const demands = await MandiDemand.find(filter)
      .populate('mandi', 'name state district city address contactPhone operatingHours verificationStatus')
      .populate('mandiAdmin', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: demands.length,
      data: demands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current mandi admin's published demands
// @route   GET /api/mandi-demands/my-demands
// @access  Private (MANDI_ADMIN, ADMIN)
const getMyMandiDemands = async (req, res, next) => {
  try {
    const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'No registered mandi found for your account.',
      });
    }

    const demands = await MandiDemand.find({ mandi: mandi._id })
      .populate('mandi', 'name city district state')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: demands.length,
      data: demands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a new crop demand
// @route   POST /api/mandi-demands
// @access  Private (MANDI_ADMIN, ADMIN)
const createMandiDemand = async (req, res, next) => {
  try {
    let mandiId = req.body.mandi;

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!mandi) {
        return res.status(403).json({
          success: false,
          message: 'No registered mandi found for your account.',
        });
      }
      if (mandi.verificationStatus !== 'VERIFIED') {
        return res.status(403).json({
          success: false,
          message: 'Only verified mandis can publish crop procurement demands.',
        });
      }
      mandiId = mandi._id;
    } else if (!mandiId) {
      return res.status(400).json({
        success: false,
        message: 'Mandi ID is required.',
      });
    }

    const {
      crop,
      requiredQuantity,
      purchasedQuantity = 0,
      qualityRequirements = 'Grade A / FAQ',
      minPrice,
      maxPrice,
      minExpectedPrice,
      maxExpectedPrice,
      unit = 'quintal',
      endDate,
      validUntil,
      notes = '',
    } = req.body;

    const finalMinPrice = minPrice !== undefined ? minPrice : (minExpectedPrice !== undefined ? minExpectedPrice : 0);
    const finalMaxPrice = maxPrice !== undefined ? maxPrice : (maxExpectedPrice !== undefined ? maxExpectedPrice : 0);

    if (!crop || !requiredQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Crop and required quantity are required.',
      });
    }

    const demand = await MandiDemand.create({
      mandi: mandiId,
      mandiAdmin: req.user._id,
      crop: crop.trim(),
      requiredQuantity: Number(requiredQuantity),
      purchasedQuantity: Number(purchasedQuantity) || 0,
      qualityRequirements: qualityRequirements.trim(),
      minPrice: Number(finalMinPrice),
      maxPrice: Number(finalMaxPrice),
      unit: unit.trim(),
      endDate: endDate ? new Date(endDate) : (validUntil ? new Date(validUntil) : undefined),
      notes: notes.trim(),
      status: 'ACTIVE',
    });

    const populated = await MandiDemand.findById(demand._id).populate(
      'mandi',
      'name state district city contactPhone'
    );

    res.status(201).json({
      success: true,
      message: 'Crop procurement demand published successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a crop demand
// @route   PUT /api/mandi-demands/:id
// @access  Private (MANDI_ADMIN, ADMIN)
const updateMandiDemand = async (req, res, next) => {
  try {
    const demand = await MandiDemand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Crop demand not found.',
      });
    }

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!mandi || demand.mandi.toString() !== mandi._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update demands for your own mandi.',
        });
      }
    }

    const {
      crop,
      requiredQuantity,
      purchasedQuantity,
      qualityRequirements,
      minPrice,
      maxPrice,
      status,
      endDate,
      notes,
    } = req.body;

    if (crop) demand.crop = crop.trim();
    if (requiredQuantity !== undefined) demand.requiredQuantity = Number(requiredQuantity);
    if (purchasedQuantity !== undefined) demand.purchasedQuantity = Number(purchasedQuantity);
    if (qualityRequirements !== undefined) demand.qualityRequirements = qualityRequirements.trim();
    if (minPrice !== undefined) demand.minPrice = Number(minPrice);
    if (maxPrice !== undefined) demand.maxPrice = Number(maxPrice);
    if (endDate !== undefined) demand.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) demand.notes = notes.trim();

    // Auto-update status if fulfilled
    if (demand.purchasedQuantity >= demand.requiredQuantity) {
      demand.status = 'FULFILLED';
    } else if (status && ['ACTIVE', 'FULFILLED', 'CLOSED'].includes(status)) {
      demand.status = status;
    }

    await demand.save();

    const populated = await MandiDemand.findById(demand._id).populate(
      'mandi',
      'name state district city contactPhone'
    );

    res.status(200).json({
      success: true,
      message: 'Crop demand updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close or delete a crop demand
// @route   DELETE /api/mandi-demands/:id
// @access  Private (MANDI_ADMIN, ADMIN)
const deleteMandiDemand = async (req, res, next) => {
  try {
    const demand = await MandiDemand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Crop demand not found.',
      });
    }

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!mandi || demand.mandi.toString() !== mandi._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage demands for your own mandi.',
        });
      }
    }

    await MandiDemand.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Crop demand removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMandiDemands,
  getMyMandiDemands,
  createMandiDemand,
  updateMandiDemand,
  deleteMandiDemand,
};
