const Transporter = require('../models/Transporter');

// @desc    Get all transporters with filters
// @route   GET /api/transporters
// @access  Public
const getTransporters = async (req, res, next) => {
  try {
    const { state, district, city, vehicleType, minimumCapacity, isAvailable } = req.query;

    const filter = {};

    // Default to available transporters unless specified otherwise
    if (isAvailable === 'false') {
      filter.isAvailable = false;
    } else if (isAvailable !== 'ALL') {
      filter.isAvailable = true;
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
    if (vehicleType) {
      filter.vehicleType = { $regex: new RegExp(vehicleType, 'i') };
    }
    if (minimumCapacity) {
      filter.capacity = { $gte: Number(minimumCapacity) };
    }

    const transporters = await Transporter.find(filter).sort({ rating: -1, pricePerKm: 1 });

    res.status(200).json({
      success: true,
      count: transporters.length,
      data: transporters,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transporter by ID
// @route   GET /api/transporters/:id
// @access  Public
const getTransporterById = async (req, res, next) => {
  try {
    const transporter = await Transporter.findById(req.params.id);

    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: 'Transporter not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transporter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate transport cost
// @route   POST /api/transporters/calculate-cost
// @access  Public
const calculateTransportCost = async (req, res, next) => {
  try {
    const { transporterId, distanceKm, quantity } = req.body;

    if (!transporterId || distanceKm === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide transporterId, distanceKm, and quantity.',
      });
    }

    const numDistance = Number(distanceKm);
    const numQuantity = Number(quantity);

    if (numDistance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Distance in KM must be greater than zero.',
      });
    }

    if (numQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero.',
      });
    }

    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: 'Transporter not found.',
      });
    }

    if (!transporter.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected transporter is currently unavailable.',
      });
    }

    if (transporter.capacity < numQuantity) {
      return res.status(400).json({
        success: false,
        message: `Transporter capacity (${transporter.capacity} quintals) is less than required crop quantity (${numQuantity} quintals).`,
      });
    }

    const pricePerKm = transporter.pricePerKm;
    const totalTransportCost = pricePerKm * numDistance;
    const costPerQuintal = totalTransportCost / numQuantity;

    res.status(200).json({
      success: true,
      data: {
        transporter,
        distanceKm: numDistance,
        quantity: numQuantity,
        pricePerKm,
        totalTransportCost,
        costPerQuintal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transporter profile/vehicle
// @route   POST /api/transporters
// @access  Private (TRANSPORTER, ADMIN)
const createTransporter = async (req, res, next) => {
  try {
    const { name, phone, vehicleType, vehicleNumber, capacity, pricePerKm, location, isAvailable } = req.body;

    if (!name || !phone || !vehicleType || !vehicleNumber || !capacity || pricePerKm === undefined || !location?.state || !location?.district) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required vehicle details and location (state, district).',
      });
    }

    const transporter = await Transporter.create({
      name,
      phone,
      vehicleType,
      vehicleNumber,
      capacity: Number(capacity),
      pricePerKm: Number(pricePerKm),
      location,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: transporter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transporter profile
// @route   PUT /api/transporters/:id
// @access  Private (TRANSPORTER, ADMIN)
const updateTransporter = async (req, res, next) => {
  try {
    let transporter = await Transporter.findById(req.params.id);
    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: 'Transporter record not found',
      });
    }

    if (req.user.role !== 'ADMIN' && (!transporter.user || transporter.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this transporter profile',
      });
    }

    transporter = await Transporter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: transporter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's transporter profile
// @route   GET /api/transporters/me
// @access  Private (TRANSPORTER)
const getMyTransporters = async (req, res, next) => {
  try {
    const transporters = await Transporter.find({ user: req.user._id });
    res.status(200).json({
      success: true,
      data: transporters,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransporters,
  getTransporterById,
  calculateTransportCost,
  createTransporter,
  updateTransporter,
  getMyTransporters,
};

