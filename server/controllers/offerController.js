const Offer = require('../models/Offer');
const CropLot = require('../models/CropLot');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create an offer for a crop lot
// @route   POST /api/offers
// @access  Protected (BUYER, ADMIN)
const createOffer = async (req, res, next) => {
  try {
    const { cropLot: cropLotId, offeredPrice, quantity, message } = req.body;
    const buyerId = req.user
      ? (req.user.role === 'ADMIN' || req.user.role === 'FARMER') && req.body.buyer
        ? req.body.buyer
        : req.user._id
      : req.body.buyer;

    if (!cropLotId || !buyerId || offeredPrice === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cropLot, buyer, offeredPrice, and quantity.',
      });
    }

    const numPrice = Number(offeredPrice);
    const numQty = Number(quantity);

    if (numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offered price must be greater than zero.',
      });
    }

    if (numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero.',
      });
    }

    // Check crop lot exists and status is AVAILABLE
    const cropLot = await CropLot.findById(cropLotId).populate('farmer', 'name email phone location');
    if (!cropLot) {
      return res.status(404).json({
        success: false,
        message: 'Crop lot not found.',
      });
    }

    if (cropLot.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Cannot place offer on crop lot with status ${cropLot.status}. Only AVAILABLE crop lots can receive offers.`,
      });
    }

    if (numQty > cropLot.quantity) {
      return res.status(400).json({
        success: false,
        message: `Offered quantity (${numQty} quintals) exceeds available crop lot quantity (${cropLot.quantity} quintals).`,
      });
    }

    // Check buyer exists
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer user not found.',
      });
    }

    if (buyer.role !== 'BUYER') {
      return res.status(400).json({
        success: false,
        message: 'Buyer specified for the offer must have BUYER role.',
      });
    }

    const newOffer = await Offer.create({
      cropLot: cropLotId,
      buyer: buyerId,
      offeredPrice: numPrice,
      quantity: numQty,
      message: message ? message.trim() : '',
      status: 'PENDING',
      lastActionBy: req.user && req.user.role === 'FARMER' ? 'FARMER' : 'BUYER',
      negotiationHistory: [
        {
          actionBy: req.user ? req.user._id : buyerId,
          role: req.user && req.user.role === 'FARMER' ? 'FARMER' : 'BUYER',
          action: 'OFFER',
          price: numPrice,
          quantity: numQty,
          message: message ? message.trim() : '',
          timestamp: new Date(),
        },
      ],
    });

    // Notify recipient of incoming offer
    if (req.user && req.user.role === 'FARMER') {
      await createNotification({
        recipient: buyerId,
        sender: req.user._id,
        type: 'OFFER_RECEIVED',
        title: 'New Crop Offer Received from Farmer',
        message: `${req.user.name} proposed an offer of ₹${numPrice}/quintal for ${numQty} quintals of ${cropLot.crop}.`,
        link: '/my-offers',
        relatedOffer: newOffer._id,
        relatedCropLot: cropLot._id,
      });
    } else if (cropLot.farmer) {
      const farmerId = cropLot.farmer._id || cropLot.farmer;
      await createNotification({
        recipient: farmerId,
        sender: buyerId,
        type: 'OFFER_RECEIVED',
        title: 'New Crop Offer Received',
        message: `${buyer.name} offered ₹${numPrice}/quintal for ${numQty} quintals of ${cropLot.crop}.`,
        link: '/offers',
        relatedOffer: newOffer._id,
        relatedCropLot: cropLot._id,
      });
    }

    const populatedOffer = await Offer.findById(newOffer._id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      });

    res.status(201).json({
      success: true,
      message: 'Offer submitted successfully.',
      data: populatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get offers with optional filters (buyer, cropLot, status, farmer)
// @route   GET /api/offers
// @access  Public
const getOffers = async (req, res, next) => {
  try {
    const { buyer, cropLot, status, farmer } = req.query;

    const filter = {};

    if (buyer) filter.buyer = buyer;
    if (cropLot) filter.cropLot = cropLot;
    if (status) filter.status = status;

    if (farmer) {
      const farmerCropLots = await CropLot.find({ farmer }).select('_id');
      const cropLotIds = farmerCropLots.map((lot) => lot._id);
      filter.cropLot = { $in: cropLotIds };
    }

    const offers = await Offer.find(filter)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single offer by ID
// @route   GET /api/offers/:id
// @access  Public
const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept offer or counter-offer
// @route   PUT /api/offers/:id/accept
// @access  Protected
const acceptOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept offer with status '${offer.status}'. Only PENDING or COUNTERED offers can be accepted.`,
      });
    }

    const cropLot = await CropLot.findById(offer.cropLot).populate('farmer', 'name email phone location');
    if (!cropLot) {
      return res.status(404).json({
        success: false,
        message: 'Associated crop lot not found',
      });
    }

    if (cropLot.status !== 'AVAILABLE' && cropLot.status !== 'RESERVED') {
      return res.status(400).json({
        success: false,
        message: `Crop lot is currently ${cropLot.status} and cannot be accepted.`,
      });
    }

    const farmerId = cropLot.farmer?._id?.toString() || cropLot.farmer?.toString();
    const buyerId = offer.buyer?.toString();
    const currentUserId = req.user ? req.user._id.toString() : null;

    // Authorization:
    // If offer is PENDING:
    //   - if offer.lastActionBy === 'FARMER': Buyer can accept.
    //   - if offer.lastActionBy === 'BUYER': Farmer can accept.
    // If offer is COUNTERED:
    //   - if offer.lastActionBy === 'FARMER': Buyer can accept.
    //   - if offer.lastActionBy === 'BUYER': Farmer can accept.
    if (req.user && req.user.role !== 'ADMIN') {
      if (offer.status === 'PENDING') {
        if (offer.lastActionBy === 'FARMER') {
          if (currentUserId !== buyerId) {
            return res.status(403).json({
              success: false,
              message: 'Only the buyer can accept this offer.',
            });
          }
        } else {
          if (currentUserId !== farmerId) {
            return res.status(403).json({
              success: false,
              message: 'Only the crop lot owner can accept this initial offer.',
            });
          }
        }
      } else if (offer.status === 'COUNTERED') {
        if (offer.lastActionBy === 'FARMER' && currentUserId !== buyerId) {
          return res.status(403).json({
            success: false,
            message: 'Only the buyer can accept the farmer counter-offer.',
          });
        }
        if (offer.lastActionBy === 'BUYER' && currentUserId !== farmerId) {
          return res.status(403).json({
            success: false,
            message: 'Only the farmer can accept the buyer counter-offer.',
          });
        }
      }
    }

    // Determine final agreed values
    let finalPrice = offer.offeredPrice;
    let finalQuantity = offer.quantity;

    if (offer.status === 'COUNTERED' && offer.counterPrice && offer.counterQuantity) {
      finalPrice = offer.counterPrice;
      finalQuantity = offer.counterQuantity;
      offer.offeredPrice = finalPrice;
      offer.quantity = finalQuantity;
    }

    offer.status = 'ACCEPTED';
    offer.respondedAt = new Date();

    offer.negotiationHistory.push({
      actionBy: req.user ? req.user._id : (currentUserId === farmerId ? farmerId : buyerId),
      role: req.user ? req.user.role : (currentUserId === farmerId ? 'FARMER' : 'BUYER'),
      action: 'ACCEPT',
      price: finalPrice,
      quantity: finalQuantity,
      message: 'Offer accepted and finalized into a deal.',
      timestamp: new Date(),
    });

    await offer.save();

    // Mark crop lot as RESERVED
    cropLot.status = 'RESERVED';
    await cropLot.save();

    // Automatically create or verify Deal Transaction
    let existingDeal = await Transaction.findOne({ offer: offer._id });
    if (!existingDeal) {
      const gross = Math.round(finalPrice * finalQuantity * 100) / 100;
      existingDeal = await Transaction.create({
        offer: offer._id,
        cropLot: cropLot._id,
        farmer: farmerId,
        buyer: buyerId,
        quantity: finalQuantity,
        pricePerQuintal: finalPrice,
        grossAmount: gross,
        totalAmount: gross,
        transportCost: 0,
        netAmount: gross,
        destination: cropLot.location?.district ? `${cropLot.location.district} Mandi` : 'Local Mandi / Warehouse',
        deliveryTerms: 'Direct Farmgate Pickup / Mandi Delivery',
        transactionStatus: 'CONFIRMED',
        paymentStatus: 'PENDING',
      });
    }

    // Notify the other party
    const recipientId = currentUserId === farmerId ? buyerId : farmerId;
    const actorName = req.user ? req.user.name : (currentUserId === farmerId ? 'Farmer' : 'Buyer');
    await createNotification({
      recipient: recipientId,
      sender: req.user ? req.user._id : undefined,
      type: 'OFFER_ACCEPTED',
      title: 'Offer Accepted & Deal Confirmed!',
      message: `${actorName} accepted the offer for ${cropLot.crop} at ₹${finalPrice}/quintal (${finalQuantity} quintals). A confirmed deal has been generated.`,
      link: '/transactions',
      relatedOffer: offer._id,
      relatedCropLot: cropLot._id,
      relatedTransaction: existingDeal._id,
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar');

    res.status(200).json({
      success: true,
      message: 'Offer accepted successfully. Deal confirmed and created!',
      data: populatedOffer,
      deal: existingDeal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject offer or counter-offer
// @route   PUT /api/offers/:id/reject
// @access  Protected
const rejectOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject offer with status '${offer.status}'. Only PENDING or COUNTERED offers can be rejected.`,
      });
    }

    const cropLot = await CropLot.findById(offer.cropLot).populate('farmer', 'name email');
    const farmerId = cropLot?.farmer?._id?.toString() || cropLot?.farmer?.toString();
    const buyerId = offer.buyer?.toString();
    const currentUserId = req.user ? req.user._id.toString() : null;

    if (req.user && req.user.role !== 'ADMIN') {
      const isFarmer = currentUserId === farmerId;
      const isBuyer = currentUserId === buyerId;
      if (!isFarmer && !isBuyer) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reject this offer.',
        });
      }
    }

    offer.status = 'REJECTED';
    offer.respondedAt = new Date();

    offer.negotiationHistory.push({
      actionBy: req.user ? req.user._id : (currentUserId === farmerId ? farmerId : buyerId),
      role: req.user ? req.user.role : (currentUserId === farmerId ? 'FARMER' : 'BUYER'),
      action: 'REJECT',
      price: offer.counterPrice || offer.offeredPrice,
      quantity: offer.counterQuantity || offer.quantity,
      message: req.body.message || 'Offer was rejected.',
      timestamp: new Date(),
    });

    await offer.save();

    // Notify the other party
    const recipientId = currentUserId === farmerId ? buyerId : farmerId;
    const actorName = req.user ? req.user.name : 'Counterpart';
    await createNotification({
      recipient: recipientId,
      sender: req.user ? req.user._id : undefined,
      type: 'OFFER_REJECTED',
      title: 'Offer Declined',
      message: `${actorName} declined the offer for ${cropLot?.crop || 'the crop lot'}.`,
      link: currentUserId === farmerId ? '/my-offers' : '/offers',
      relatedOffer: offer._id,
      relatedCropLot: cropLot?._id,
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar');

    res.status(200).json({
      success: true,
      message: 'Offer rejected successfully.',
      data: populatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Counter offer (Farmer can counter PENDING or buyer's counter; Buyer can counter farmer's counter)
// @route   PUT /api/offers/:id/counter
// @access  Protected
const counterOffer = async (req, res, next) => {
  try {
    const { counterPrice, counterQuantity, counterMessage } = req.body;

    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot counter an offer with status '${offer.status}'. Only active PENDING or COUNTERED offers can be countered.`,
      });
    }

    const numPrice = Number(counterPrice);
    const numQty = Number(counterQuantity);

    if (!numPrice || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Counter price must be greater than zero.',
      });
    }

    if (!numQty || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Counter quantity must be greater than zero.',
      });
    }

    const cropLot = await CropLot.findById(offer.cropLot).populate('farmer', 'name email phone location');
    if (!cropLot) {
      return res.status(404).json({
        success: false,
        message: 'Associated crop lot not found',
      });
    }

    if (numQty > cropLot.quantity) {
      return res.status(400).json({
        success: false,
        message: `Counter quantity (${numQty} quintals) exceeds total crop lot quantity (${cropLot.quantity} quintals).`,
      });
    }

    const farmerId = cropLot.farmer?._id?.toString() || cropLot.farmer?.toString();
    const buyerId = offer.buyer?.toString();
    const currentUserId = req.user ? req.user._id.toString() : null;

    let actingRole = req.user ? req.user.role : 'FARMER';
    if (actingRole === 'ADMIN') {
      actingRole = currentUserId === buyerId ? 'BUYER' : 'FARMER';
    }

    // Role-specific validations:
    // Farmer can counter when offer is PENDING or last action was from BUYER
    // Buyer can counter when offer is COUNTERED and last action was from FARMER
    if (req.user && req.user.role !== 'ADMIN') {
      if (currentUserId === farmerId) {
        actingRole = 'FARMER';
        if (offer.status === 'COUNTERED' && offer.lastActionBy === 'FARMER') {
          return res.status(400).json({
            success: false,
            message: 'You have already submitted a counter-offer. Awaiting the buyer response.',
          });
        }
      } else if (currentUserId === buyerId) {
        actingRole = 'BUYER';
        if (offer.status !== 'COUNTERED' || offer.lastActionBy !== 'FARMER') {
          return res.status(400).json({
            success: false,
            message: 'You can only counter-offer in response to a counter-offer from the farmer.',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to counter this offer.',
        });
      }
    }

    offer.counterPrice = numPrice;
    offer.counterQuantity = numQty;
    offer.counterMessage = counterMessage ? counterMessage.trim() : '';
    offer.status = 'COUNTERED';
    offer.lastActionBy = actingRole;
    offer.respondedAt = new Date();

    offer.negotiationHistory.push({
      actionBy: req.user ? req.user._id : (actingRole === 'FARMER' ? farmerId : buyerId),
      role: actingRole,
      action: 'COUNTER',
      price: numPrice,
      quantity: numQty,
      message: counterMessage ? counterMessage.trim() : '',
      timestamp: new Date(),
    });

    await offer.save();

    // Send notification to the opposite party
    const recipientId = actingRole === 'FARMER' ? buyerId : farmerId;
    const senderName = req.user ? req.user.name : (actingRole === 'FARMER' ? 'Farmer' : 'Buyer');
    await createNotification({
      recipient: recipientId,
      sender: req.user ? req.user._id : undefined,
      type: 'OFFER_COUNTERED',
      title: 'Counter-Offer Received',
      message: `${senderName} submitted a counter-offer of ₹${numPrice}/quintal for ${numQty} quintals of ${cropLot.crop}.`,
      link: actingRole === 'FARMER' ? '/my-offers' : '/offers',
      relatedOffer: offer._id,
      relatedCropLot: cropLot._id,
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar');

    res.status(200).json({
      success: true,
      message: 'Counter offer submitted successfully.',
      data: populatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending or countered offer by buyer
// @route   PUT /api/offers/:id/cancel
// @access  Protected (BUYER, ADMIN)
const cancelOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found.',
      });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an offer with status '${offer.status}'.`,
      });
    }

    const buyerId = offer.buyer?.toString();
    const cropLot = await CropLot.findById(offer.cropLot).populate('farmer', 'name email');
    const farmerId = cropLot?.farmer?._id?.toString() || cropLot?.farmer?.toString();
    const currentUserId = req.user ? req.user._id.toString() : null;

    if (req.user && req.user.role !== 'ADMIN') {
      const isAuthorizedToCancel =
        (offer.lastActionBy === 'FARMER' && currentUserId === farmerId) ||
        (offer.lastActionBy === 'BUYER' && currentUserId === buyerId);
      if (!isAuthorizedToCancel) {
        return res.status(403).json({
          success: false,
          message: 'Only the user who proposed the offer/counter can cancel it.',
        });
      }
    }

    offer.status = 'CANCELLED';
    offer.lastActionBy = 'BUYER';
    offer.respondedAt = new Date();

    offer.negotiationHistory.push({
      actionBy: req.user ? req.user._id : buyerId,
      role: 'BUYER',
      action: 'CANCEL',
      price: offer.counterPrice || offer.offeredPrice,
      quantity: offer.counterQuantity || offer.quantity,
      message: req.body.message || 'Offer was cancelled by the buyer.',
      timestamp: new Date(),
    });

    await offer.save();

    // If farmer was waiting, notify them
    if (cropLot?.farmer) {
      const farmerId = cropLot.farmer._id || cropLot.farmer;
      await createNotification({
        recipient: farmerId,
        sender: req.user ? req.user._id : undefined,
        type: 'OFFER_CANCELLED',
        title: 'Offer Cancelled',
        message: `The offer on ${cropLot.crop} was cancelled by the buyer.`,
        link: '/offers',
        relatedOffer: offer._id,
        relatedCropLot: cropLot._id,
      });
    }

    const populatedOffer = await Offer.findById(offer._id)
      .populate('buyer', 'name email phone location buyerProfile')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      })
      .populate('negotiationHistory.actionBy', 'name role avatar');

    res.status(200).json({
      success: true,
      message: 'Offer cancelled successfully.',
      data: populatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark offer & deal as completed / order delivered (by Buyer)
// @route   PUT /api/offers/:id/complete
// @access  Protected
const completeOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('buyer', 'name email phone location')
      .populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: 'name email phone location' },
      });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!['ACCEPTED', 'COMPLETED'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `Only accepted offers can be marked as completed. Current status: ${offer.status}`,
      });
    }

    // Update offer status and delivery
    offer.status = 'COMPLETED';
    offer.deliveryStatus = 'DELIVERED';
    offer.negotiationHistory.push({
      actionBy: req.user?._id || offer.buyer?._id || offer.buyer,
      role: 'BUYER',
      action: 'ACCEPT',
      price: offer.offeredPrice,
      quantity: offer.quantity,
      message: 'Order delivered. Deal marked as completed.',
      timestamp: new Date(),
    });
    await offer.save();

    // Update related Transaction: mark COMPLETED and automatically PAID
    try {
      const transList = await Transaction.find({
        $or: [{ offer: offer._id }, { cropLot: offer.cropLot?._id || offer.cropLot }],
      });
      for (const t of transList) {
        t.transactionStatus = 'COMPLETED';
        t.paymentStatus = 'PAID';
        const paidTotal = t.netAmount || t.grossAmount || t.totalAmount || (offer.offeredPrice * offer.quantity);
        t.amountPaid = paidTotal;
        t.remainingAmount = 0;
        t.paymentHistory.push({
          amount: paidTotal,
          paymentMethod: 'Auto Settled on Delivery',
          note: 'Order delivered. Payment marked as paid automatically.',
          date: new Date(),
        });
        await t.save();
      }
    } catch (tErr) {
      // silent
    }

    // Update related CropLot (mark sold or adjust quantity)
    if (offer.cropLot) {
      const cropLot = await CropLot.findById(offer.cropLot._id || offer.cropLot);
      if (cropLot) {
        if (cropLot.quantity > offer.quantity) {
          cropLot.quantity = Math.max(0, Math.round((cropLot.quantity - offer.quantity) * 100) / 100);
          cropLot.status = 'AVAILABLE';
        } else {
          cropLot.status = 'SOLD';
        }
        await cropLot.save();
      }
    }

    // Update related Transport if any
    try {
      await Transport.updateMany(
        { $or: [{ offer: offer._id }, { cropLot: offer.cropLot?._id || offer.cropLot }] },
        { status: 'COMPLETED' }
      );
    } catch (tErr) {
      // silent
    }

    // Send notification to Farmer: "Order Delivered"
    const farmerId = offer.cropLot?.farmer?._id || offer.cropLot?.farmer;
    const buyerName = req.user?.name || offer.buyer?.name || 'Buyer';
    const cropName = offer.cropLot?.crop || 'Crop';
    const quantity = offer.quantity;

    if (farmerId) {
      await Notification.create({
        recipient: farmerId,
        sender: req.user?._id || offer.buyer?._id,
        type: 'DEAL_CONFIRMED',
        title: 'Order Delivered',
        message: `Buyer ${buyerName} has marked your deal for ${cropName} (${quantity} quintals) as completed. Order delivered successfully!`,
        link: '/offers',
        relatedOffer: offer._id,
        relatedCropLot: offer.cropLot?._id || offer.cropLot,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order marked as completed. Order delivered notification sent to farmer.',
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update offer status (legacy backward compatibility)
// @route   PUT /api/offers/:id/status
// @access  Protected
const updateOfferStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status === 'ACCEPTED') {
      return acceptOffer(req, res, next);
    } else if (status === 'REJECTED') {
      return rejectOffer(req, res, next);
    } else if (status === 'COUNTERED') {
      return counterOffer(req, res, next);
    } else if (status === 'CANCELLED') {
      return cancelOffer(req, res, next);
    } else if (status === 'COMPLETED') {
      return completeOffer(req, res, next);
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid status update.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOffer,
  getOffers,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  cancelOffer,
  completeOffer,
  updateOfferStatus,
};
