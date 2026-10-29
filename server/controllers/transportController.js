const Transport = require('../models/Transport');
const Transporter = require('../models/Transporter');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a transport booking record
// @route   POST /api/transports
// @access  Public
const createTransport = async (req, res, next) => {
  try {
    const newTransport = await Transport.create(req.body);

    const populatedTransport = await Transport.findById(newTransport._id)
      .populate('farmer', 'name email phone location')
      .populate('transporter', 'name phone vehicleType vehicleNumber pricePerKm rating user')
      .populate('cropLot', 'crop quantity qualityGrade location expectedPrice')
      .populate('mandiBooking', 'bookingNumber crop quantity status scheduledArrivalDate');

    // Notify the selected transporter about the booking (Requirements 1, 7, 8, 9)
    try {
      let recipientUserId = null;
      if (populatedTransport.transporter?.user) {
        recipientUserId = populatedTransport.transporter.user._id || populatedTransport.transporter.user;
      } else if (populatedTransport.transporter?.phone) {
        const matchingUser = await User.findOne({ phone: populatedTransport.transporter.phone });
        if (matchingUser) recipientUserId = matchingUser._id;
      }

      if (!recipientUserId) {
        const transporterDoc = await Transporter.findById(newTransport.transporter);
        if (transporterDoc?.user) {
          recipientUserId = transporterDoc.user;
        } else if (transporterDoc?.phone) {
          const matchingUser = await User.findOne({ phone: transporterDoc.phone });
          if (matchingUser) recipientUserId = matchingUser._id;
        }
      }

      // Requirement 1: Send the notification only to the transporter whose vehicle was selected
      if (recipientUserId) {
        // Requirement 7: Prevent duplicate notifications when triggered multiple times
        const existingNotif = await Notification.findOne({
          recipient: recipientUserId,
          type: 'TRANSPORT_BOOKING',
          $or: [
            { relatedTransport: newTransport._id },
            { message: { $regex: newTransport._id.toString() } },
          ],
        });

        if (!existingNotif) {
          const farmerName = populatedTransport.farmer?.name || 'Farmer';
          const cropName = populatedTransport.cropName || populatedTransport.cropLot?.crop || 'Crop';
          const quantity = populatedTransport.quantity || populatedTransport.cropLot?.quantity || 0;
          const pickupLoc = populatedTransport.pickupLocation || 'Farm Yard';
          const destinationMandi = populatedTransport.destination || 'Mandi Yard';
          const pickupDateTime = populatedTransport.bookingDate 
            ? new Date(populatedTransport.bookingDate).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Scheduled Date';
          const vehicleDetails = `${populatedTransport.vehicleType || populatedTransport.transporter?.vehicleType || 'Truck'} (${populatedTransport.vehicleNumber || populatedTransport.transporter?.vehicleNumber || 'Verified'})`;
          const agreedFare = `₹${Number(populatedTransport.totalCost).toLocaleString('en-IN')}`;
          const bookingId = populatedTransport._id.toString();
          const bookingRef = `#${bookingId.slice(-6).toUpperCase()}`;

          const notifTitle = `New Transport Booking Received - ${bookingRef}`;
          const notifMessage = `Farmer: ${farmerName} | Crop: ${cropName} (${quantity} qtl) | Pickup: ${pickupLoc} on ${pickupDateTime} | Destination: ${destinationMandi} | Vehicle: ${vehicleDetails} | Agreed Fare: ${agreedFare} | Booking ID: ${bookingId}`;

          await Notification.create({
            recipient: recipientUserId,
            sender: newTransport.farmer,
            type: 'TRANSPORT_BOOKING',
            title: notifTitle,
            message: notifMessage,
            link: `/transporter-dashboard?bookingId=${newTransport._id}`,
            relatedTransport: newTransport._id,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to notify transporter:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      data: populatedTransport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transport booking status (e.g. ACCEPTED, REJECTED, IN_TRANSIT, COMPLETED, CANCELLED)
// @route   PUT /api/transports/:id/status
// @access  Public
const updateTransportStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const transport = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone')
      .populate('transporter', 'name phone vehicleType vehicleNumber');

    if (!transport) {
      return res.status(404).json({ success: false, message: 'Transport record not found' });
    }

    if (status) {
      transport.status = status;
    }
    if (rejectionReason) {
      transport.rejectionReason = rejectionReason;
    }

    await transport.save();

    const farmerUserId = transport.farmer?._id || transport.farmer;
    const transporterName = transport.transporter?.name || 'Assigned Transporter';
    const cropName = transport.cropName || 'crop';
    const quantity = transport.quantity || 0;
    const vehicleType = transport.vehicleType || transport.transporter?.vehicleType || 'Truck';
    const vehicleNumber = transport.vehicleNumber || transport.transporter?.vehicleNumber || '';
    const fare = Number(transport.totalCost || 0).toLocaleString('en-IN');
    const bookingId = transport._id.toString();

    // After transporter accepts booking, notify the farmer (Requirement 6, 8)
    if (status === 'ACCEPTED' && farmerUserId) {
      try {
        const existingAcceptNotif = await Notification.findOne({
          recipient: farmerUserId,
          type: 'TRANSPORT_UPDATE',
          title: `Transport Booking Accepted - #${bookingId.slice(-6).toUpperCase()}`,
        });

        if (!existingAcceptNotif) {
          await Notification.create({
            recipient: farmerUserId,
            sender: req.user?._id,
            type: 'TRANSPORT_UPDATE',
            title: `Transport Booking Accepted - #${bookingId.slice(-6).toUpperCase()}`,
            message: `Transporter ${transporterName} has ACCEPTED your booking for ${cropName} (${quantity} qtl). Vehicle: ${vehicleType} (${vehicleNumber}). Scheduled Pickup: ${new Date(transport.bookingDate).toLocaleDateString()}. Agreed Fare: ₹${fare}. Booking ID: #${bookingId}.`,
            link: '/dashboard',
            relatedTransport: transport._id,
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify farmer of transport acceptance:', notifErr.message);
      }
    }

    // After transporter rejects booking, notify the farmer (Requirement 5, 6)
    if (status === 'REJECTED' && farmerUserId) {
      try {
        const existingRejectNotif = await Notification.findOne({
          recipient: farmerUserId,
          type: 'TRANSPORT_UPDATE',
          title: `Transport Booking Rejected - #${bookingId.slice(-6).toUpperCase()}`,
        });

        if (!existingRejectNotif) {
          const reason = transport.rejectionReason || 'Transporter vehicle unavailable';
          await Notification.create({
            recipient: farmerUserId,
            sender: req.user?._id,
            type: 'TRANSPORT_UPDATE',
            title: `Transport Booking Rejected - #${bookingId.slice(-6).toUpperCase()}`,
            message: `Transporter ${transporterName} was unable to accept your booking for ${cropName} (${quantity} qtl). Reason: ${reason}. Booking ID: #${bookingId}. Please select another available vehicle.`,
            link: `/transport?crop=${encodeURIComponent(cropName)}&quantity=${quantity}&destination=${encodeURIComponent(transport.destination || '')}`,
            relatedTransport: transport._id,
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify farmer of transport rejection:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Transport status updated to ${status}`,
      data: transport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transport payment (e.g. COD cash collected by transporter)
// @route   PUT /api/transports/:id/payment
// @access  Public
const updateTransportPayment = async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone')
      .populate('transporter', 'name phone vehicleType vehicleNumber');

    if (!transport) {
      return res.status(404).json({ success: false, message: 'Transport record not found' });
    }

    const { paymentStatus, paidAmount, transactionReference } = req.body;

    if (paymentStatus) {
      transport.paymentStatus = paymentStatus;
    }
    if (paidAmount !== undefined) {
      transport.paidAmount = Number(paidAmount);
    } else if (paymentStatus === 'PAID') {
      transport.paidAmount = transport.totalCost;
    }

    if (transactionReference) {
      transport.transactionReference = transactionReference;
    }

    if (paymentStatus === 'PAID') {
      transport.paymentDate = new Date();
      transport.paymentGatewayStatus = transport.paymentMethod?.includes('Cash') || transport.paymentMethod?.includes('COD') ? 'COLLECTED_CASH' : 'SETTLED';

      // Notify farmer that payment was collected (Requirement 9)
      try {
        const farmerUserId = transport.farmer?._id || transport.farmer;
        if (farmerUserId) {
          await Notification.create({
            recipient: farmerUserId,
            sender: req.user?._id,
            type: 'TRANSPORT_UPDATE',
            title: 'Transport Cash Payment Collected',
            message: `Cash on Delivery payment of ₹${transport.totalCost.toLocaleString('en-IN')} for transport booking (${transport.cropName || 'crop'}) has been collected by the transporter. Payment status updated to PAID.`,
            link: '/dashboard',
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify farmer of payment collection:', notifErr.message);
      }
    }

    await transport.save();

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${transport.paymentStatus}`,
      data: transport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transports with optional filters
// @route   GET /api/transports
// @access  Public
const getTransports = async (req, res, next) => {
  try {
    const { farmer, transporter, status } = req.query;

    const filter = {};

    if (farmer) filter.farmer = farmer;
    if (transporter) filter.transporter = transporter;
    if (status) filter.status = status;

    const transports = await Transport.find(filter)
      .populate('farmer', 'name email phone location')
      .populate('transporter', 'name phone vehicleType vehicleNumber pricePerKm rating')
      .populate('cropLot', 'crop quantity qualityGrade location expectedPrice')
      .populate('mandiBooking', 'bookingNumber crop quantity status scheduledArrivalDate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transports.length,
      data: transports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transport record by ID
// @route   GET /api/transports/:id
// @access  Public
const getTransportById = async (req, res, next) => {
  try {
    const transportRecord = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone location')
      .populate('transporter', 'name phone vehicleType vehicleNumber pricePerKm rating')
      .populate('cropLot', 'crop quantity qualityGrade location expectedPrice')
      .populate('mandiBooking', 'bookingNumber crop quantity status scheduledArrivalDate');

    if (!transportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Transport record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transportRecord,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransport,
  getTransports,
  getTransportById,
  updateTransportStatus,
  updateTransportPayment,
};
