const Mandi = require('../models/Mandi');
const User = require('../models/User');

// @desc    Get all active verified mandis with optional filters
// @route   GET /api/mandis
// @access  Public
const getMandis = async (req, res, next) => {
  try {
    const { state, district, city, crop } = req.query;

    // Only return verified and active mandis to farmers and public
    const filter = {
      isActive: true,
      $or: [{ verificationStatus: 'VERIFIED' }, { verificationStatus: { $exists: false } }],
    };

    if (state) {
      filter.state = { $regex: new RegExp(state, 'i') };
    }
    if (district) {
      filter.district = { $regex: new RegExp(district, 'i') };
    }
    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }
    if (crop) {
      filter.cropsSupported = { $regex: new RegExp(crop, 'i') };
    }

    const mandis = await Mandi.find(filter)
      .populate('mandiAdmin', 'name email phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: mandis.length,
      data: mandis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mandi by ID
// @route   GET /api/mandis/:id
// @access  Public
const getMandiById = async (req, res, next) => {
  try {
    const mandi = await Mandi.findById(req.params.id).populate('mandiAdmin', 'name email phone');

    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'Mandi not found',
      });
    }

    res.status(200).json({
      success: true,
      data: mandi,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated mandi admin's mandi details
// @route   GET /api/mandis/my-mandi
// @access  Private (MANDI_ADMIN only)
const getMyMandi = async (req, res, next) => {
  try {
    let mandi = await Mandi.findOne({ mandiAdmin: req.user._id });

    // Fallback check by mandiProfile.mandiId
    if (!mandi && req.user.mandiProfile?.mandiId) {
      mandi = await Mandi.findById(req.user.mandiProfile.mandiId);
    }

    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'No mandi record found associated with this account.',
      });
    }

    res.status(200).json({
      success: true,
      data: mandi,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current authenticated mandi admin's mandi details
// @route   PUT /api/mandis/my-mandi
// @access  Private (MANDI_ADMIN only)
const updateMyMandi = async (req, res, next) => {
  try {
    let mandi = await Mandi.findOne({ mandiAdmin: req.user._id });
    if (!mandi && req.user.mandiProfile?.mandiId) {
      mandi = await Mandi.findById(req.user.mandiProfile.mandiId);
    }

    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'No mandi record found to update.',
      });
    }

    const {
      name,
      address,
      city,
      district,
      state,
      contactPhone,
      contactEmail,
      operatingHours,
      cropsSupported,
      mandiType,
    } = req.body;

    if (name) mandi.name = name.trim();
    if (address) mandi.address = address.trim();
    if (city) mandi.city = city.trim();
    if (district) mandi.district = district.trim();
    if (state) mandi.state = state.trim();
    if (contactPhone !== undefined) mandi.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) mandi.contactEmail = contactEmail.trim().toLowerCase();
    if (operatingHours !== undefined) mandi.operatingHours = operatingHours.trim();
    if (mandiType && ['Government', 'Private'].includes(mandiType)) mandi.mandiType = mandiType;
    if (Array.isArray(cropsSupported)) {
      mandi.cropsSupported = cropsSupported.map((c) => String(c).trim()).filter(Boolean);
    }

    await mandi.save();

    // Also sync user's mandiProfile
    await User.findByIdAndUpdate(req.user._id, {
      'mandiProfile.mandiName': mandi.name,
      'mandiProfile.mandiType': mandi.mandiType,
      'mandiProfile.operatingHours': mandi.operatingHours,
    });

    res.status(200).json({
      success: true,
      message: 'Mandi details updated successfully.',
      data: mandi,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMandis,
  getMandiById,
  getMyMandi,
  updateMyMandi,
};
