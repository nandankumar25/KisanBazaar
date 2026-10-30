const Transport = require('../models/Transport');
const Transporter = require('../models/Transporter');
const Notification = require('../models/Notification');
const User = require('../models/User');
const paymentGatewayService = require('../services/paymentGatewayService');

// @desc    Create a transport booking record
// @route   POST /api/transports
// @access  Public
const createTransport = async (req, res, next) => {
  try {
    // Prevent duplicate active transport bookings for the same mandi sale request
    if (req.body.mandiBooking) {
      const existingActiveBooking = await Transport.findOne({
        mandiBooking: req.body.mandiBooking,
        status: { $in: ['BOOKED', 'ACCEPTED', 'IN_TRANSIT'] },
      });

      if (existingActiveBooking) {
        return res.status(400).json({
          success: false,
          message: 'An active transport booking already exists for this Mandi Sale Request. Please cancel the current booking before creating a new booking.',
          data: existingActiveBooking,
        });
      }
    }

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

    // After transporter rejects booking, notify the farmer and process refund if paid online
    if (status === 'REJECTED' && farmerUserId) {
      try {
        const isCod =
          String(transport.paymentMethod || '').includes('Cash') ||
          String(transport.paymentMethod || '').includes('COD');

        const isOnlinePaid =
          !isCod &&
          transport.paymentStatus === 'PAID' &&
          (Number(transport.paidAmount) > 0 || Number(transport.totalCost) > 0);

        const isAlreadyRefunding = ['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(transport.refundStatus);

        // Idempotency: initiate refund with payment gateway once
        if (isOnlinePaid && !isAlreadyRefunding) {
          await paymentGatewayService.initiateRefund(transport, rejectionReason || 'Transporter rejected booking');
        } else if (!isOnlinePaid && !isAlreadyRefunding) {
          transport.refundStatus = 'NOT_APPLICABLE';
          transport.refundAmount = 0;
          await transport.save();
        }

        const existingRejectNotif = await Notification.findOne({
          recipient: farmerUserId,
          type: 'TRANSPORT_UPDATE',
          title: `Transport Booking Rejected - #${bookingId.slice(-6).toUpperCase()}`,
        });

        if (!existingRejectNotif) {
          const reason = transport.rejectionReason || 'Transporter vehicle unavailable';
          let rejectMsg = `Your transport booking for ${cropName} (${quantity} qtl) has been rejected by the transporter (${transporterName}). Reason: ${reason}.`;

          const hasRefund = ['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(transport.refundStatus);
          if (hasRefund) {
            rejectMsg = `Your transport booking for ${cropName} (${quantity} qtl) has been rejected by the transporter. A refund of ₹${transport.refundAmount} has been initiated for your online payment. Refund Reference: ${transport.refundTransactionId}. Reason: ${reason}.`;
          } else {
            rejectMsg += ` As payment was Cash on Delivery (COD), no online refund is required. Please book another transporter.`;
          }

          await Notification.create({
            recipient: farmerUserId,
            sender: req.user?._id,
            type: 'TRANSPORT_UPDATE',
            title: `Transport Booking Rejected - #${bookingId.slice(-6).toUpperCase()}`,
            message: rejectMsg,
            link: hasRefund ? `/payment-status?transportId=${transport._id}` : `/transport?crop=${encodeURIComponent(cropName)}&quantity=${quantity}&destination=${encodeURIComponent(transport.destination || '')}&mandiBookingId=${transport.mandiBooking?._id || transport.mandiBooking || ''}`,
            relatedTransport: transport._id,
          });

          // Delayed Refund Notification: sent after exactly 20 seconds for online paid bookings
          if (isOnlinePaid) {
            const refundBookingId = transport._id;
            const senderUserId = req.user?._id;
            const refundCrop = cropName;
            const refundQty = quantity;
            const refundAmt = transport.refundAmount;

            setTimeout(async () => {
              try {
                // Prevent duplicate refund notifications
                const existingRefundNotif = await Notification.findOne({
                  recipient: farmerUserId,
                  type: 'TRANSPORT_REFUND',
                  relatedTransport: refundBookingId,
                });

                if (!existingRefundNotif) {
                  const currentDoc = await Transport.findById(refundBookingId);
                  const isSuccess = currentDoc && (currentDoc.refundStatus === 'REFUND_SUCCESSFUL' || currentDoc.refundStatus === 'REFUNDED');

                  const notifTitle = isSuccess ? 'Transport Refund Successful' : 'Transport Refund Initiated';
                  const notifMessage = isSuccess
                    ? `Your transport booking for ${refundCrop} (${refundQty} qtl) has been rejected. Your refund of ₹${refundAmt} has been successfully credited to your original payment method.`
                    : `Your transport booking for ${refundCrop} (${refundQty} qtl) has been rejected. Your online payment refund of ₹${refundAmt} has been initiated.`;

                  await Notification.create({
                    recipient: farmerUserId,
                    sender: senderUserId,
                    type: 'TRANSPORT_REFUND',
                    title: notifTitle,
                    message: notifMessage,
                    link: `/payment-status?transportId=${refundBookingId}`,
                    relatedTransport: refundBookingId,
                  });

                  // Record refund notification delivery timestamp and schedule timeline start at exactly 10s
                  const notifDeliveredAt = new Date();
                  const timelineStartAt = new Date(notifDeliveredAt.getTime() + 10000);
                  await Transport.findByIdAndUpdate(refundBookingId, {
                    refundNotificationSentAt: notifDeliveredAt,
                    refundTimelineStartAt: timelineStartAt,
                  });

                  // Exactly 10 seconds after refund notification delivery, start the refund lifecycle timeline!
                  setTimeout(async () => {
                    try {
                      const tDoc = await Transport.findById(refundBookingId);
                      if (tDoc && tDoc.refundStatus !== 'REFUND_FAILED') {
                        tDoc.refundStatus = 'REFUND_INITIATED';
                        tDoc.paymentGatewayStatus = 'REFUND_INITIATED';
                        tDoc.refundInitiatedAt = new Date();
                        await tDoc.save();
                      }
                    } catch (tErr) {
                      console.error('Failed to activate refund timeline at 10s:', tErr.message);
                    }
                  }, 10000);
                }
              } catch (delayErr) {
                console.error('Failed to send delayed refund notification:', delayErr.message);
              }
            }, 20000);
          }
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

// @desc    Cancel a transport booking (Farmer or Admin) and process automatic refund if paid online
// @route   PUT /api/transports/:id/cancel
// @access  Protected
const cancelTransport = async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone')
      .populate('transporter', 'name phone vehicleType vehicleNumber user');

    if (!transport) {
      return res.status(404).json({ success: false, message: 'Transport booking not found' });
    }

    // 1. Verify ownership
    const farmerId = transport.farmer?._id || transport.farmer;
    const isOwner = req.user && farmerId && farmerId.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this transport booking.',
      });
    }

    // 2. Safe idempotency check: if already cancelled, return cleanly
    if (transport.status === 'CANCELLED') {
      return res.status(200).json({
        success: true,
        message: 'Transport booking is already cancelled.',
        data: transport,
      });
    }

    // 3. Verify eligibility
    if (transport.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed transport trips cannot be cancelled.',
      });
    }

    if (transport.status === 'IN_TRANSIT') {
      return res.status(400).json({
        success: false,
        message: 'Transport is currently in transit and cannot be cancelled.',
      });
    }

    // 4. Update status and cancellation metadata
    transport.status = 'CANCELLED';
    transport.cancelledAt = new Date();
    transport.cancelledBy = req.user._id;
    if (req.body.cancellationReason || req.body.reason) {
      transport.cancellationReason = (req.body.cancellationReason || req.body.reason).trim();
    }

    // 5. Automatic Refund calculation with Payment Gateway
    const isCod =
      String(transport.paymentMethod || '').includes('Cash') ||
      String(transport.paymentMethod || '').includes('COD');

    const isOnlinePaid =
      !isCod &&
      transport.paymentStatus === 'PAID' &&
      (Number(transport.paidAmount) > 0 || Number(transport.totalCost) > 0);

    const isAlreadyRefunding = ['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(transport.refundStatus);

    if (isOnlinePaid && !isAlreadyRefunding) {
      await paymentGatewayService.initiateRefund(transport, transport.cancellationReason || 'Farmer cancelled transport booking');
    } else if (!isOnlinePaid && !isAlreadyRefunding) {
      transport.refundStatus = 'NOT_APPLICABLE';
      transport.refundAmount = 0;
      await transport.save();
    }

    const bookingId = transport._id.toString();
    const farmerName = transport.farmer?.name || 'Farmer';
    const cropName = transport.cropName || 'crop';
    const quantity = transport.quantity || 0;
    const reasonText = transport.cancellationReason || 'Farmer cancelled booking';

    // 6. Notify Transporter about cancellation immediately
    try {
      let recipientTransporterUserId = null;
      if (transport.transporter?.user) {
        recipientTransporterUserId = transport.transporter.user._id || transport.transporter.user;
      } else {
        const transDoc = await Transporter.findById(transport.transporter);
        if (transDoc?.user) recipientTransporterUserId = transDoc.user;
      }

      if (recipientTransporterUserId) {
        await Notification.create({
          recipient: recipientTransporterUserId,
          sender: req.user._id,
          type: 'TRANSPORT_CANCELLED',
          title: `Transport Booking Cancelled - #${bookingId.slice(-6).toUpperCase()}`,
          message: `Farmer ${farmerName} has cancelled the transport booking for ${cropName} (${quantity} qtl). Reason: ${reasonText}.`,
          link: `/transporter-dashboard?bookingId=${transport._id}`,
          relatedTransport: transport._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify transporter of cancellation:', notifErr.message);
    }

    // 7. Notify Farmer: First send cancellation notification immediately (t = 0s)
    try {
      await Notification.create({
        recipient: req.user._id,
        sender: req.user._id,
        type: 'TRANSPORT_CANCELLED',
        title: `Transport Booking Cancelled - #${bookingId.slice(-6).toUpperCase()}`,
        message: isOnlinePaid
          ? `Your transport booking for ${cropName} (${quantity} qtl) has been cancelled.`
          : `Your transport booking for ${cropName} (${quantity} qtl) has been cancelled successfully. Payment method was ${transport.paymentMethod || 'COD'}, so no refund is applicable.`,
        link: isOnlinePaid ? `/payment-status?transportId=${transport._id}` : '/dashboard',
        relatedTransport: transport._id,
      });

      // 8. 20 seconds later: Automatically send refund notification to farmer for online paid bookings
      if (isOnlinePaid) {
        const refundBookingId = transport._id;
        const farmerId = req.user._id;
        const refundCrop = cropName;
        const refundQty = quantity;
        const refundAmt = transport.refundAmount;

        setTimeout(async () => {
          try {
            // Prevent duplicate refund notifications
            const existingRefundNotif = await Notification.findOne({
              recipient: farmerId,
              type: 'TRANSPORT_REFUND',
              relatedTransport: refundBookingId,
            });

            if (!existingRefundNotif) {
              const currentDoc = await Transport.findById(refundBookingId);
              const isSuccess = currentDoc && (currentDoc.refundStatus === 'REFUND_SUCCESSFUL' || currentDoc.refundStatus === 'REFUNDED');

              const notifTitle = isSuccess ? 'Transport Refund Successful' : 'Transport Refund Initiated';
              const notifMessage = isSuccess
                ? `Your transport booking for ${refundCrop} (${refundQty} qtl) has been cancelled. Your refund of ₹${refundAmt} has been successfully credited to your original payment method.`
                : `Your transport booking for ${refundCrop} (${refundQty} qtl) has been cancelled. Your online payment refund of ₹${refundAmt} has been initiated.`;

              await Notification.create({
                recipient: farmerId,
                sender: farmerId,
                type: 'TRANSPORT_REFUND',
                title: notifTitle,
                message: notifMessage,
                link: `/payment-status?transportId=${refundBookingId}`,
                relatedTransport: refundBookingId,
              });

              // Record refund notification delivery timestamp and schedule timeline start at exactly 10s
              const notifDeliveredAt = new Date();
              const timelineStartAt = new Date(notifDeliveredAt.getTime() + 10000);
              await Transport.findByIdAndUpdate(refundBookingId, {
                refundNotificationSentAt: notifDeliveredAt,
                refundTimelineStartAt: timelineStartAt,
              });

              // Exactly 10 seconds after refund notification delivery, start the refund lifecycle timeline!
              setTimeout(async () => {
                try {
                  const tDoc = await Transport.findById(refundBookingId);
                  if (tDoc && tDoc.refundStatus !== 'REFUND_FAILED') {
                    tDoc.refundStatus = 'REFUND_INITIATED';
                    tDoc.paymentGatewayStatus = 'REFUND_INITIATED';
                    tDoc.refundInitiatedAt = new Date();
                    await tDoc.save();
                  }
                } catch (tErr) {
                  console.error('Failed to activate refund timeline at 10s on cancellation:', tErr.message);
                }
              }, 10000);
            }
          } catch (delayErr) {
            console.error('Failed to send delayed refund notification on cancellation:', delayErr.message);
          }
        }, 20000);
      }
    } catch (notifErr) {
      console.error('Failed to notify farmer of cancellation:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Transport booking cancelled successfully.',
      data: transport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live payment & refund status with real payment gateway verification
// @route   GET /api/transports/:id/payment-status
// @access  Public
const getTransportPaymentStatus = async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id)
      .populate('farmer', 'name email phone location')
      .populate('transporter', 'name phone vehicleType vehicleNumber rating completedTrips user')
      .populate('cropLot', 'cropName variety quantity netWeight availableQuantity pricePerQuintal images')
      .populate('mandiBooking');

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport booking record not found',
      });
    }

    // Query and sync status with actual payment gateway response
    const gatewayStatusResult = await paymentGatewayService.checkRefundStatus(transport);

    const isCod =
      String(transport.paymentMethod || '').includes('Cash') ||
      String(transport.paymentMethod || '').includes('COD');

    // Exactly 10 seconds after the refund notification is delivered, start the refund lifecycle timeline
    let isTimelineStarted = true;
    let secondsUntilTimelineStart = 0;

    if (transport.refundTimelineStartAt) {
      const now = Date.now();
      const targetTime = new Date(transport.refundTimelineStartAt).getTime();
      if (now < targetTime) {
        isTimelineStarted = false;
        secondsUntilTimelineStart = Math.max(0, Math.ceil((targetTime - now) / 1000));
      }
    } else if (transport.refundNotificationSentAt) {
      const now = Date.now();
      const targetTime = new Date(transport.refundNotificationSentAt).getTime() + 10000;
      if (now < targetTime) {
        isTimelineStarted = false;
        secondsUntilTimelineStart = Math.max(0, Math.ceil((targetTime - now) / 1000));
      }
    }

    const refundState = transport.refundStatus;
    const isFailed = refundState === 'REFUND_FAILED';

    // Stages confirmed states
    // Turn each stage green ONLY when its corresponding status is confirmed!
    const isStage1Confirmed = isTimelineStarted && ['REFUND_INITIATED', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_FAILED'].includes(refundState);
    const isStage2Confirmed = isTimelineStarted && ['REFUNDED', 'REFUND_SUCCESSFUL'].includes(refundState);
    const isStage2Processing = isTimelineStarted && refundState === 'REFUND_PROCESSING';
    const isStage3Confirmed = isTimelineStarted && ['REFUNDED', 'REFUND_SUCCESSFUL'].includes(refundState);

    // Connecting lines turn green only when stage status is confirmed!
    // Line 1 (Stage 1 -> Stage 2): turns green when Stage 1 is confirmed
    // Line 2 (Stage 2 -> Stage 3): turns green when Stage 2 is confirmed
    const line1Green = isStage1Confirmed;
    const line2Green = isStage2Confirmed;

    const timeline = [
      {
        id: 'INITIATED',
        title: 'Refund Initiated',
        status: isStage1Confirmed
          ? 'COMPLETED'
          : (!isTimelineStarted ? 'AWAITING_ACTIVATION' : 'PENDING'),
        isGreen: isStage1Confirmed,
        timestamp: isStage1Confirmed
          ? (transport.refundInitiatedAt || transport.refundTimelineStartAt || null)
          : null,
        description: !isTimelineStarted
          ? (secondsUntilTimelineStart > 0
              ? `Timeline activates in ${secondsUntilTimelineStart}s (10s after refund notification delivery).`
              : 'Awaiting timeline activation...')
          : 'Refund request registered and activated with payment gateway switch.',
      },
      {
        id: 'PROCESSING',
        title: 'Refund Processing',
        status: isStage2Confirmed
          ? 'COMPLETED'
          : (isStage2Processing
              ? 'IN_PROGRESS'
              : (isFailed ? 'FAILED' : 'PENDING')),
        isGreen: isStage2Confirmed,
        timestamp: isStage2Processing || isStage2Confirmed ? (transport.refundInitiatedAt || null) : null,
        description: isFailed
          ? 'Gateway encountered an issue during bank settlement processing.'
          : (isStage2Processing
              ? 'Payment gateway is communicating with beneficiary bank clearing network.'
              : isStage2Confirmed
              ? 'Beneficiary bank network successfully verified and cleared transaction.'
              : 'Awaiting bank clearing transmission.'),
      },
      {
        id: isFailed ? 'FAILED' : 'SUCCESSFUL',
        title: isFailed ? 'Refund Failed' : 'Refund Successful',
        status: isStage3Confirmed
          ? 'COMPLETED'
          : (isFailed ? 'FAILED' : 'PENDING'),
        isGreen: isStage3Confirmed,
        timestamp: transport.refundCompletedAt || null,
        description: isFailed
          ? (transport.refundReason || 'Gateway failed to credit source account: Issuer bank technical decline.')
          : (isStage3Confirmed
              ? `Amount of ₹${transport.refundAmount || transport.paidAmount} successfully credited back to original payment method.`
              : 'Funds will credit to original account upon bank settlement.'),
      },
    ];

    res.status(200).json({
      success: true,
      data: transport,
      gatewayResponse: gatewayStatusResult?.gatewayResponse || transport.gatewayResponse,
      timeline,
      isCod,
      isTimelineStarted,
      secondsUntilTimelineStart,
      line1Green,
      line2Green,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gateway refund status (for test verification / gateway webhooks)
// @route   POST /api/transports/:id/gateway-status
// @access  Public
const updateGatewayRefundStatus = async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport booking record not found',
      });
    }

    const { status, failureReason, gatewayMessage } = req.body;
    await paymentGatewayService.setGatewayRefundStatus(transport, {
      status,
      failureReason,
      gatewayMessage,
    });

    res.status(200).json({
      success: true,
      message: `Payment gateway response set to ${transport.refundStatus}`,
      data: transport,
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
  cancelTransport,
  getTransportPaymentStatus,
  updateGatewayRefundStatus,
};
