const MandiPrice = require('../models/MandiPrice');
const Mandi = require('../models/Mandi');

// @desc    Get all mandi prices with optional filters
// @route   GET /api/mandi-prices
// @access  Public
const getMandiPrices = async (req, res, next) => {
  try {
    const { crop, mandi, state, district, date, priceSource } = req.query;

    const filter = {};

    if (crop) {
      filter.crop = { $regex: new RegExp(crop, 'i') };
    }
    if (mandi) {
      filter.mandi = mandi;
    }
    if (priceSource) {
      filter.priceSource = priceSource;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    // Handle state / district filtering via Mandi sub-query if provided
    if (state || district) {
      const mandiFilter = {};
      if (state) mandiFilter.state = { $regex: new RegExp(state, 'i') };
      if (district) mandiFilter.district = { $regex: new RegExp(district, 'i') };

      const matchingMandis = await Mandi.find(mandiFilter).select('_id');
      const mandiIds = matchingMandis.map((m) => m._id);
      filter.mandi = { $in: mandiIds };
    }

    const mandiPrices = await MandiPrice.find(filter)
      .populate('mandi', 'name state district city address mandiType operatingHours verificationStatus')
      .populate('reportedBy', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: mandiPrices.length,
      data: mandiPrices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical price trends for a crop
// @route   GET /api/mandi-prices/trends/:crop
// @access  Public
const getCropPriceTrends = async (req, res, next) => {
  try {
    const { crop } = req.params;

    const prices = await MandiPrice.find({
      crop: { $regex: new RegExp(`^${crop}$`, 'i') },
    })
      .populate('mandi', 'name state district city')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      crop: crop,
      count: prices.length,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mandi price record by ID
// @route   GET /api/mandi-prices/:id
// @access  Public
const getMandiPriceById = async (req, res, next) => {
  try {
    const priceRecord = await MandiPrice.findById(req.params.id)
      .populate('mandi', 'name state district city address cropsSupported mandiType operatingHours verificationStatus')
      .populate('reportedBy', 'name email');

    if (!priceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Mandi price record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: priceRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/create a new mandi crop price
// @route   POST /api/mandi-prices
// @access  Private (MANDI_ADMIN, ADMIN)
const createMandiPrice = async (req, res, next) => {
  try {
    let mandiId = req.body.mandi || req.body.mandiId;

    // Resolve verified mandi for MANDI_ADMIN or ADMIN
    let targetMandi = null;
    if (req.user.role === 'MANDI_ADMIN') {
      targetMandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!targetMandi && req.user.mandiProfile?.mandiId) {
        targetMandi = await Mandi.findById(req.user.mandiProfile.mandiId);
      }
      if (!targetMandi && mandiId) {
        targetMandi = await Mandi.findById(mandiId);
      }
      if (!targetMandi) {
        return res.status(403).json({
          success: false,
          message: 'No registered mandi found for your account.',
        });
      }
      if (targetMandi.verificationStatus !== 'VERIFIED') {
        return res.status(403).json({
          success: false,
          message: 'Your mandi is still pending verification by the administrator. Only verified mandis can publish live prices.',
        });
      }
      mandiId = targetMandi._id;
    } else if (req.user.role === 'ADMIN') {
      if (mandiId) {
        targetMandi = await Mandi.findById(mandiId);
      }
      if (!targetMandi) {
        targetMandi = await Mandi.findOne({ mandiAdmin: req.user._id });
        if (!targetMandi && req.user.mandiProfile?.mandiId) {
          targetMandi = await Mandi.findById(req.user.mandiProfile.mandiId);
        }
        if (!targetMandi) {
          targetMandi = await Mandi.findOne({ verificationStatus: 'VERIFIED' });
        }
      }
      if (!targetMandi) {
        return res.status(400).json({
          success: false,
          message: 'Mandi ID is required for publishing prices.',
        });
      }
      mandiId = targetMandi._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only Mandi Admins or Platform Admins can publish mandi prices.',
      });
    }

    const {
      crop,
      variety = '',
      minPrice,
      maxPrice,
      modalPrice,
      qualityGrade = 'FAQ (Fair Average Quality)',
      unit = 'quintal',
      date,
    } = req.body;

    if (!crop || minPrice === undefined || maxPrice === undefined || modalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Crop name, min price, max price, and modal price are required.',
      });
    }

    const numMin = Number(minPrice);
    const numMax = Number(maxPrice);
    const numModal = Number(modalPrice);

    if (isNaN(numMin) || numMin <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price must be a valid number greater than 0.',
      });
    }

    if (isNaN(numMax) || numMax <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Maximum price must be a valid number greater than 0.',
      });
    }

    if (isNaN(numModal) || numModal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Modal price must be a valid number greater than 0.',
      });
    }

    if (numMin > numMax) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price cannot be greater than maximum price.',
      });
    }

    if (numModal < numMin || numModal > numMax) {
      return res.status(400).json({
        success: false,
        message: 'Modal price must fall within the minimum and maximum price range.',
      });
    }

    const newPrice = await MandiPrice.create({
      mandi: mandiId,
      crop: crop.trim(),
      variety: variety ? variety.trim() : '',
      qualityGrade: qualityGrade ? qualityGrade.trim() : 'FAQ (Fair Average Quality)',
      minPrice: numMin,
      maxPrice: numMax,
      modalPrice: numModal,
      unit: unit ? unit.trim() : 'quintal',
      priceSource: 'MANDI_ENTRY',
      reportedBy: req.user._id,
      isOfficiallyVerified: false,
      date: date ? new Date(date) : new Date(),
    });

    const populated = await MandiPrice.findById(newPrice._id).populate(
      'mandi',
      'name state district city address mandiType operatingHours verificationStatus'
    );

    res.status(201).json({
      success: true,
      message: 'Mandi price published successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a published mandi price
// @route   PUT /api/mandi-prices/:id
// @access  Private (MANDI_ADMIN, ADMIN)
const updateMandiPrice = async (req, res, next) => {
  try {
    const priceRecord = await MandiPrice.findById(req.params.id);
    if (!priceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Mandi price record not found.',
      });
    }

    // Authorization check: If MANDI_ADMIN, verify price belongs to their mandi
    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!mandi || priceRecord.mandi.toString() !== mandi._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to update prices for your own mandi.',
        });
      }
    }

    const { crop, variety, minPrice, maxPrice, modalPrice, qualityGrade, unit, date } = req.body;

    if (crop) priceRecord.crop = crop.trim();
    if (variety !== undefined) priceRecord.variety = variety.trim();
    if (qualityGrade) priceRecord.qualityGrade = qualityGrade.trim();
    if (unit) priceRecord.unit = unit.trim();
    if (date) priceRecord.date = new Date(date);
    if (minPrice !== undefined) priceRecord.minPrice = Number(minPrice);
    if (maxPrice !== undefined) priceRecord.maxPrice = Number(maxPrice);
    if (modalPrice !== undefined) priceRecord.modalPrice = Number(modalPrice);

    if (priceRecord.minPrice > priceRecord.maxPrice) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price cannot exceed maximum price.',
      });
    }

    await priceRecord.save();

    const populated = await MandiPrice.findById(priceRecord._id).populate(
      'mandi',
      'name state district city mandiType operatingHours'
    );

    res.status(200).json({
      success: true,
      message: 'Mandi price updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a mandi price
// @route   DELETE /api/mandi-prices/:id
// @access  Private (MANDI_ADMIN, ADMIN)
const deleteMandiPrice = async (req, res, next) => {
  try {
    const priceRecord = await MandiPrice.findById(req.params.id);
    if (!priceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Mandi price record not found.',
      });
    }

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
      if (!mandi || priceRecord.mandi.toString() !== mandi._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete prices belonging to your own mandi.',
        });
      }
    }

    await MandiPrice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Mandi price record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMandiPrices,
  getCropPriceTrends,
  getMandiPriceById,
  createMandiPrice,
  updateMandiPrice,
  deleteMandiPrice,
};
