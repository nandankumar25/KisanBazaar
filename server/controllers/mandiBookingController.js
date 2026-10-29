const MandiBooking = require('../models/MandiBooking');
const Mandi = require('../models/Mandi');
const MandiDemand = require('../models/MandiDemand');
const CropLot = require('../models/CropLot');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to find caller's mandi
const getCallerMandi = async (user) => {
  let mandi = await Mandi.findOne({ mandiAdmin: user._id });
  if (!mandi && user.mandiProfile?.mandiId) {
    mandi = await Mandi.findById(user.mandiProfile.mandiId);
  }
  return mandi;
};

// @desc    Submit a new crop sale booking request to a mandi
// @route   POST /api/mandi-bookings
// @access  Private (FARMER, ADMIN)
const createBooking = async (req, res, next) => {
  try {
    const mandiId = req.body.mandi || req.body.mandiId;
    const cropLotId = req.body.cropLot || req.body.cropLotId;
    const crop = req.body.crop || req.body.cropName;
    const quantity = req.body.quantity !== undefined ? req.body.quantity : req.body.estimatedQuantity;
    const expectedPrice = req.body.expectedPrice !== undefined ? req.body.expectedPrice : req.body.expectedPricePerQuintal;
    const qualityGrade = req.body.qualityGrade || 'Grade A';
    const preferredArrivalDate = req.body.preferredArrivalDate || req.body.availableDate;
    const farmerNotes = req.body.farmerNotes || req.body.description || '';

    const numQty = Number(quantity);
    const numPrice = Number(expectedPrice);

    if (!mandiId || !crop || isNaN(numQty) || numQty <= 0 || isNaN(numPrice) || numPrice <= 0 || !preferredArrivalDate) {
      return res.status(400).json({
        success: false,
        message: 'Mandi, crop, valid quantity (>0), expected price (>0), and preferred arrival date are required.',
      });
    }

    const targetMandi = await Mandi.findById(mandiId);
    if (!targetMandi) {
      return res.status(404).json({
        success: false,
        message: 'Selected mandi not found.',
      });
    }

    // Ensure mandi is verified
    if (targetMandi.verificationStatus && targetMandi.verificationStatus.toUpperCase() !== 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be submitted to officially verified mandis.',
      });
    }

    // Verify crop lot ownership if supplied
    if (cropLotId) {
      const lot = await CropLot.findById(cropLotId);
      if (lot && lot.farmer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You can only create booking requests using your own crop lots.',
        });
      }
    }

    // Generate unique booking number
    const timestampStr = Date.now().toString().slice(-6);
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const bookingNumber = `MB-${timestampStr}-${randomDigits}`;
    const arrivalDateObj = new Date(preferredArrivalDate);

    const booking = await MandiBooking.create({
      bookingNumber,
      farmer: req.user._id,
      mandi: targetMandi._id,
      mandiAdmin: targetMandi.mandiAdmin,
      cropLot: cropLotId || undefined,
      crop: crop.trim(),
      quantity: numQty,
      qualityGrade: qualityGrade.trim(),
      expectedPrice: numPrice,
      preferredArrivalDate: arrivalDateObj,
      availableDate: arrivalDateObj,
      farmerNotes: farmerNotes.trim(),
      description: farmerNotes.trim(),
      status: 'PENDING',
      paymentStatus: 'PENDING',
    });

    // Notify Mandi Admin if available
    if (targetMandi.mandiAdmin) {
      await Notification.create({
        recipient: targetMandi.mandiAdmin,
        sender: req.user._id,
        type: 'MANDI_BOOKING_NEW',
        title: 'New Crop Sale Request',
        message: `Farmer ${req.user.name} submitted a request to sell ${quantity} quintals of ${crop} (Ref: ${bookingNumber}).`,
        link: '/mandi-dashboard',
        relatedMandiBooking: booking._id,
      });
    }

    const populated = await MandiBooking.findById(booking._id)
      .populate('mandi', 'name state district city address contactPhone operatingHours')
      .populate('farmer', 'name email phone location');

    res.status(201).json({
      success: true,
      message: 'Sell request submitted successfully. Waiting for mandi approval.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings submitted by the logged-in farmer
// @route   GET /api/mandi-bookings/farmer
// @access  Private (FARMER, ADMIN)
const getFarmerBookings = async (req, res, next) => {
  try {
    const filter = { farmer: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const bookings = await MandiBooking.find(filter)
      .populate('mandi', 'name state district city address contactPhone operatingHours verificationStatus')
      .populate('cropLot', 'crop quantity qualityGrade location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings received by the caller's mandi
// @route   GET /api/mandi-bookings/mandi
// @access  Private (MANDI_ADMIN, ADMIN)
const getMandiBookings = async (req, res, next) => {
  try {
    let mandiId = req.query.mandiId;

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await getCallerMandi(req.user);
      if (!mandi) {
        return res.status(404).json({
          success: false,
          message: 'No registered mandi found for your account.',
        });
      }
      mandiId = mandi._id;
    } else if (!mandiId) {
      // Super admin without mandiId query: return all
      const allFilter = {};
      if (req.query.status) allFilter.status = req.query.status.toUpperCase();
      const allBookings = await MandiBooking.find(allFilter)
        .populate('farmer', 'name email phone location')
        .populate('mandi', 'name city district state')
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: allBookings.length,
        data: allBookings,
      });
    }

    const filter = { mandi: mandiId };
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status.toUpperCase();
    }

    const bookings = await MandiBooking.find(filter)
      .populate('farmer', 'name email phone location')
      .populate('cropLot', 'crop quantity qualityGrade location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details by ID
// @route   GET /api/mandi-bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id)
      .populate('mandi', 'name state district city address contactPhone operatingHours verificationStatus')
      .populate('farmer', 'name email phone location')
      .populate('cropLot', 'crop quantity qualityGrade location expectedPrice');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Mandi booking record not found.',
      });
    }

    // Role-based visibility check: Farmer can view own; Mandi Admin can view own mandi's
    const isOwnerFarmer = booking.farmer._id.toString() === req.user._id.toString();
    const isMandiAdmin =
      req.user.role === 'MANDI_ADMIN' &&
      (booking.mandiAdmin?.toString() === req.user._id.toString() ||
        booking.mandi?._id.toString() === req.user.mandiProfile?.mandiId?.toString());
    const isSuperAdmin = req.user.role === 'ADMIN';

    if (!isOwnerFarmer && !isMandiAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking record.',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and Accept or Reject a booking request
// @route   PUT /api/mandi-bookings/:id/review
// @access  Private (MANDI_ADMIN, ADMIN)
const reviewBooking = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id).populate('mandi');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const {
      action,
      proposedPrice,
      scheduledArrivalDate,
      tokenNumber,
      rejectionReason = '',
      mandiNotes = '',
    } = req.body;

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'ACCEPT' or 'REJECT'.",
      });
    }

    if (action === 'ACCEPT') {
      booking.status = scheduledArrivalDate ? 'SCHEDULED' : 'ACCEPTED';
      booking.proposedPrice = proposedPrice ? Number(proposedPrice) : booking.expectedPrice;
      booking.scheduledArrivalDate = scheduledArrivalDate ? new Date(scheduledArrivalDate) : booking.preferredArrivalDate;
      
      // Assign token number if provided or generate default token
      if (tokenNumber && tokenNumber.trim()) {
        booking.tokenNumber = tokenNumber.trim();
      } else if (!booking.tokenNumber) {
        booking.tokenNumber = `TK-${booking._id.toString().slice(-4).toUpperCase()}`;
      }

      if (mandiNotes) booking.mandiNotes = mandiNotes.trim();
      await booking.save();

      // Notify Farmer
      await Notification.create({
        recipient: booking.farmer,
        sender: req.user._id,
        type: 'MANDI_BOOKING_ACCEPTED',
        title: 'Mandi Sale Request Accepted!',
        message: `Your request for ${booking.crop} (${booking.quantity} qtl) was accepted by ${booking.mandi.name}. Token: ${booking.tokenNumber}. Arrival Date: ${new Date(booking.scheduledArrivalDate).toLocaleDateString('en-IN')}.`,
        link: '/mandi-bookings',
        relatedMandiBooking: booking._id,
      });

      return res.status(200).json({
        success: true,
        message: `Booking accepted and assigned token #${booking.tokenNumber}.`,
        data: booking,
      });
    } else {
      // REJECT
      booking.status = 'REJECTED';
      booking.rejectionReason = rejectionReason || 'Mandi capacity full or specifications not met.';
      if (mandiNotes) booking.mandiNotes = mandiNotes.trim();
      await booking.save();

      await Notification.create({
        recipient: booking.farmer,
        sender: req.user._id,
        type: 'MANDI_BOOKING_REJECTED',
        title: 'Mandi Sale Request Declined',
        message: `Your request to sell ${booking.crop} at ${booking.mandi.name} was declined: ${booking.rejectionReason}`,
        link: '/mandi-bookings',
        relatedMandiBooking: booking._id,
      });

      return res.status(200).json({
        success: true,
        message: 'Booking request rejected.',
        data: booking,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Log physical arrival of crop vehicle at mandi gate
// @route   PUT /api/mandi-bookings/:id/arrival
// @access  Private (MANDI_ADMIN, ADMIN)
const markArrived = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id).populate('mandi');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const { weighingSlipNumber = '' } = req.body;

    booking.status = 'ARRIVED';
    if (weighingSlipNumber) {
      booking.weighingSlipNumber = weighingSlipNumber.trim();
    } else if (!booking.weighingSlipNumber) {
      booking.weighingSlipNumber = `WS-${Date.now().toString().slice(-5)}`;
    }

    await booking.save();

    await Notification.create({
      recipient: booking.farmer,
      sender: req.user._id,
      type: 'MANDI_BOOKING_SCHEDULED',
      title: 'Mandi Gate Arrival Confirmed',
      message: `Your vehicle has arrived at ${booking.mandi.name}. Gate Weighing Slip #${booking.weighingSlipNumber} issued.`,
      link: '/mandi-bookings',
      relatedMandiBooking: booking._id,
    });

    res.status(200).json({
      success: true,
      message: 'Crop arrival confirmed.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record actual weighing, quality inspection, deductions, and calculate payable amount
// @route   PUT /api/mandi-bookings/:id/quality-weighing
// @access  Private (MANDI_ADMIN, ADMIN)
const recordQualityAndWeighing = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id).populate('mandi');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const actualReceivedQuantity = req.body.actualReceivedQuantity !== undefined 
      ? req.body.actualReceivedQuantity 
      : req.body.actualQuantity;
    const acceptedPricePerQuintal = req.body.acceptedPricePerQuintal !== undefined 
      ? req.body.acceptedPricePerQuintal 
      : req.body.agreedPricePerQuintal;
    const finalQualityGrade = req.body.finalQualityGrade || req.body.qualityGrade || 'Grade A';
    const deductions = req.body.deductions || [];
    const qualityInspectionNotes = req.body.qualityInspectionNotes || req.body.mandiNotes || '';
    const weighingSlipNumber = req.body.weighingSlipNumber || req.body.gateEntryNumber;

    if (actualReceivedQuantity === undefined || acceptedPricePerQuintal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Actual received quantity and accepted price per quintal are required.',
      });
    }

    const numActualQty = Number(actualReceivedQuantity);
    const numPrice = Number(acceptedPricePerQuintal);

    if (numActualQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Actual received quantity must be greater than 0.',
      });
    }

    // Process deductions
    let parsedDeductions = [];
    if (Array.isArray(deductions)) {
      parsedDeductions = deductions
        .filter((d) => d && d.reason && d.amount !== undefined)
        .map((d) => ({
          reason: String(d.reason).trim(),
          amount: Math.max(0, Number(d.amount) || 0),
        }));
    }

    const totalDeductions = parsedDeductions.reduce((sum, d) => sum + d.amount, 0);
    const grossAmount = Math.round(numActualQty * numPrice);
    const finalPayableAmount = Math.max(0, grossAmount - totalDeductions);

    booking.actualReceivedQuantity = numActualQty;
    booking.finalQualityGrade = finalQualityGrade.trim();
    booking.acceptedPricePerQuintal = numPrice;
    booking.deductions = parsedDeductions;
    booking.totalDeductions = totalDeductions;
    booking.grossAmount = grossAmount;
    booking.finalPayableAmount = finalPayableAmount;
    booking.qualityInspectionNotes = qualityInspectionNotes.trim();
    if (weighingSlipNumber) booking.weighingSlipNumber = weighingSlipNumber.trim();

    booking.status = 'QUALITY_CHECKED';
    await booking.save();

    // Notify farmer of quality result
    await Notification.create({
      recipient: booking.farmer,
      sender: req.user._id,
      type: 'MANDI_BOOKING_QUALITY_CHECKED',
      title: 'Quality & Weighing Inspection Completed',
      message: `Inspection for ${booking.crop}: Accepted Weight ${numActualQty} qtl @ ₹${numPrice}/qtl. Deductions: ₹${totalDeductions}. Final Payable: ₹${finalPayableAmount.toLocaleString('en-IN')}.`,
      link: '/mandi-bookings',
      relatedMandiBooking: booking._id,
    });

    res.status(200).json({
      success: true,
      message: 'Quality inspection and weighing recorded successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize and complete crop sale
// @route   PUT /api/mandi-bookings/:id/complete
// @access  Private (MANDI_ADMIN, ADMIN)
const completeSale = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id).populate('mandi');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status !== 'QUALITY_CHECKED') {
      return res.status(400).json({
        success: false,
        message: 'Crop must undergo quality check and weighing before finalizing sale.',
      });
    }

    booking.status = 'COMPLETED';
    booking.saleCompletedAt = new Date();
    await booking.save();

    // If linked to CropLot, mark crop lot as SOLD
    if (booking.cropLot) {
      await CropLot.findByIdAndUpdate(booking.cropLot, { status: 'SOLD' });
    }

    // Update active mandi demand if matching crop exists
    try {
      const activeDemand = await MandiDemand.findOne({
        mandi: booking.mandi._id,
        crop: { $regex: new RegExp(`^${booking.crop}$`, 'i') },
        status: 'ACTIVE',
      });

      if (activeDemand) {
        activeDemand.purchasedQuantity = (activeDemand.purchasedQuantity || 0) + (booking.actualReceivedQuantity || booking.quantity);
        if (activeDemand.purchasedQuantity >= activeDemand.requiredQuantity) {
          activeDemand.status = 'FULFILLED';
        }
        await activeDemand.save();
      }
    } catch (e) {
      // Non-critical demand sync error
    }

    // Notify farmer of completion
    await Notification.create({
      recipient: booking.farmer,
      sender: req.user._id,
      type: 'MANDI_BOOKING_COMPLETED',
      title: 'Mandi Crop Sale Completed!',
      message: `Sale of ${booking.crop} (${booking.actualReceivedQuantity} qtl) has been finalized at ${booking.mandi.name}. Payable Amount: ₹${booking.finalPayableAmount.toLocaleString('en-IN')}.`,
      link: '/mandi-bookings',
      relatedMandiBooking: booking._id,
    });

    res.status(200).json({
      success: true,
      message: 'Mandi sale successfully completed.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment settlement status (Pending -> Paid)
// @route   PUT /api/mandi-bookings/:id/payment
// @access  Private (MANDI_ADMIN, ADMIN)
const updatePaymentStatus = async (req, res, next) => {
  try {
    const booking = await MandiBooking.findById(req.params.id).populate('mandi');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const { paymentStatus, paymentReference, paymentMode, paymentDate, paymentNotes } = req.body;

    if (!['PENDING', 'PAID'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be 'PENDING' or 'PAID'.",
      });
    }

    // Requirement: Do not mark a payment as Paid unless the payment is actually confirmed
    if (paymentStatus === 'PAID') {
      if (!paymentReference || !paymentReference.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference (UTR / Cheque / Transaction Ref) is required to confirm payment.',
        });
      }

      booking.paymentStatus = 'PAID';
      booking.paymentReference = paymentReference.trim();
      booking.paymentMode = paymentMode || 'Bank Transfer';
      booking.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      if (paymentNotes) booking.paymentNotes = paymentNotes.trim();
    } else {
      booking.paymentStatus = 'PENDING';
      booking.paymentReference = '';
      booking.paymentDate = null;
    }

    await booking.save();

    if (booking.paymentStatus === 'PAID') {
      await Notification.create({
        recipient: booking.farmer,
        sender: req.user._id,
        type: 'MANDI_BOOKING_COMPLETED',
        title: 'Mandi Payment Confirmed',
        message: `Payment of ₹${booking.finalPayableAmount.toLocaleString('en-IN')} has been disbursed for sale #${booking.bookingNumber}. Ref: ${booking.paymentReference}.`,
        link: '/mandi-bookings',
        relatedMandiBooking: booking._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${booking.paymentStatus}.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Mandi Admin Dashboard statistics (MongoDB aggregates)
// @route   GET /api/mandi-bookings/stats
// @access  Private (MANDI_ADMIN, ADMIN)
const getMandiStats = async (req, res, next) => {
  try {
    let mandiId = req.query.mandiId;

    if (req.user.role === 'MANDI_ADMIN') {
      const mandi = await getCallerMandi(req.user);
      if (!mandi) {
        return res.status(200).json({
          success: true,
          data: {
            totalRequests: 0,
            pendingRequests: 0,
            acceptedBookings: 0,
            completedSales: 0,
            dailyArrivals: 0,
            totalQuantityPurchased: 0,
            totalPayout: 0,
          },
        });
      }
      mandiId = mandi._id;
    }

    const filter = mandiId ? { mandi: mandiId } : {};

    // Get today's start date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalRequests,
      pendingRequests,
      acceptedBookings,
      completedSales,
      dailyArrivals,
      aggregates,
    ] = await Promise.all([
      MandiBooking.countDocuments(filter),
      MandiBooking.countDocuments({ ...filter, status: 'PENDING' }),
      MandiBooking.countDocuments({
        ...filter,
        status: { $in: ['ACCEPTED', 'SCHEDULED', 'ARRIVED', 'QUALITY_CHECKED'] },
      }),
      MandiBooking.countDocuments({ ...filter, status: 'COMPLETED' }),
      MandiBooking.countDocuments({
        ...filter,
        status: { $in: ['ARRIVED', 'QUALITY_CHECKED', 'COMPLETED'] },
        updatedAt: { $gte: startOfToday },
      }),
      MandiBooking.aggregate([
        { $match: { ...filter, status: 'COMPLETED' } },
        {
          $group: {
            _id: null,
            totalQuantityPurchased: { $sum: '$actualReceivedQuantity' },
            totalPayout: { $sum: '$finalPayableAmount' },
          },
        },
      ]),
    ]);

    const totalQty = aggregates[0]?.totalQuantityPurchased || 0;
    const totalPay = aggregates[0]?.totalPayout || 0;

    const statsData = {
      totalRequests,
      pendingRequests,
      acceptedBookings,
      completedSales,
      dailyArrivals,
      arrivedToday: dailyArrivals,
      totalQuantityPurchased: totalQty,
      totalQuantityPurchasedQuintals: totalQty,
      totalPayout: totalPay,
      totalPayableAmount: totalPay,
    };

    res.status(200).json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
