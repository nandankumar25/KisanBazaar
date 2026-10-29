const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');
const CropLot = require('../models/CropLot');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all transactions with optional filters
// @route   GET /api/transactions
// @access  Public
const getTransactions = async (req, res, next) => {
  try {
    const { farmer, buyer, cropLot, offer, status, paymentStatus } = req.query;

    const filter = {};

    if (farmer && mongoose.Types.ObjectId.isValid(farmer)) filter.farmer = farmer;
    if (buyer && mongoose.Types.ObjectId.isValid(buyer)) filter.buyer = buyer;
    if (cropLot && mongoose.Types.ObjectId.isValid(cropLot)) filter.cropLot = cropLot;
    if (offer && mongoose.Types.ObjectId.isValid(offer)) filter.offer = offer;
    if (status) filter.transactionStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const transactions = await Transaction.find(filter)
      .populate('farmer', 'name email phone location')
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
      .populate('offer', 'offeredPrice quantity status createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Public
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('farmer', 'name email phone location')
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
      .populate('offer', 'offeredPrice quantity status createdAt');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transaction (from an ACCEPTED offer or direct payload)
// @route   POST /api/transactions
// @access  Public
const createTransaction = async (req, res, next) => {
  try {
    const {
      offerId,
      cropLot: directCropLot,
      farmer: directFarmer,
      buyer: directBuyer,
      quantity: directQuantity,
      pricePerQuintal: directPrice,
      transportCost = 0,
      destination = '',
    } = req.body;

    let offerDoc = null;
    let finalCropLotId = directCropLot;
    let finalFarmerId = directFarmer;
    let finalBuyerId = directBuyer;
    let finalQuantity = Number(directQuantity);
    let finalPrice = Number(directPrice);

    if (offerId) {
      // Find offer and validate
      offerDoc = await Offer.findById(offerId).populate({
        path: 'cropLot',
        populate: { path: 'farmer', select: '_id name email' },
      });

      if (!offerDoc) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found.',
        });
      }

      if (offerDoc.status !== 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          message: `Cannot create a transaction for an offer with status '${offerDoc.status}'. Only ACCEPTED offers can proceed to transaction.`,
        });
      }

      // Check for duplicate transaction for this offer
      const existingTransaction = await Transaction.findOne({ offer: offerId })
        .populate('farmer', 'name email phone location')
        .populate('buyer', 'name email phone location buyerProfile')
        .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
        .populate('offer', 'offeredPrice quantity status createdAt');

      if (existingTransaction) {
        if (transportCost !== undefined && Number(transportCost) >= 0) {
          existingTransaction.transportCost = Number(transportCost);
        }
        if (destination) {
          existingTransaction.destination = destination;
        }
        await existingTransaction.save();

        return res.status(200).json({
          success: true,
          message: 'Confirmed deal retrieved successfully (duplicate creation prevented).',
          data: existingTransaction,
        });
      }

      finalCropLotId = offerDoc.cropLot._id;
      finalFarmerId = offerDoc.cropLot.farmer?._id || offerDoc.cropLot.farmer;
      finalBuyerId = offerDoc.buyer;
      finalQuantity = Number(offerDoc.quantity);
      finalPrice = Number(offerDoc.offeredPrice);
    }

    if (!finalCropLotId || !finalFarmerId || !finalBuyerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing essential deal information (cropLot, farmer, or buyer).',
      });
    }

    if (!finalQuantity || finalQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction quantity must be greater than zero.',
      });
    }

    if (!finalPrice || finalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per quintal must be greater than zero.',
      });
    }

    const numTransportCost = Number(transportCost) || 0;
    if (numTransportCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Transport cost cannot be negative.',
      });
    }

    const calculatedGross = Math.round(finalPrice * finalQuantity * 100) / 100;
    if (numTransportCost > calculatedGross) {
      return res.status(400).json({
        success: false,
        message: `Transport cost (₹${numTransportCost}) cannot exceed gross deal amount (₹${calculatedGross}).`,
      });
    }

    const calculatedNet = Math.round((calculatedGross - numTransportCost) * 100) / 100;

    const newTransaction = await Transaction.create({
      offer: offerDoc ? offerDoc._id : undefined,
      cropLot: finalCropLotId,
      farmer: finalFarmerId,
      buyer: finalBuyerId,
      quantity: finalQuantity,
      pricePerQuintal: finalPrice,
      grossAmount: calculatedGross,
      totalAmount: calculatedGross,
      transportCost: numTransportCost,
      netAmount: calculatedNet,
      destination: destination || '',
      amountPaid: 0,
      remainingAmount: calculatedNet,
      paymentStatus: 'PENDING',
      transactionStatus: 'CREATED',
      transactionDate: Date.now(),
    });

    const populatedTransaction = await Transaction.findById(newTransaction._id)
      .populate('farmer', 'name email phone location')
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
      .populate('offer', 'offeredPrice quantity status createdAt');

    // Notify farmer and buyer
    await createNotification({
      recipient: finalFarmerId,
      sender: req.user ? req.user._id : undefined,
      type: 'DEAL_CONFIRMED',
      title: 'Confirmed Deal Created',
      message: `A confirmed deal for ${finalQuantity} quintals at ₹${finalPrice}/quintal has been recorded.`,
      link: `/transaction/${newTransaction._id}`,
      relatedTransaction: newTransaction._id,
      relatedOffer: offerDoc ? offerDoc._id : undefined,
    });

    await createNotification({
      recipient: finalBuyerId,
      sender: req.user ? req.user._id : undefined,
      type: 'DEAL_CONFIRMED',
      title: 'Confirmed Deal Created',
      message: `A confirmed deal for ${finalQuantity} quintals at ₹${finalPrice}/quintal has been recorded.`,
      link: `/transaction/${newTransaction._id}`,
      relatedTransaction: newTransaction._id,
      relatedOffer: offerDoc ? offerDoc._id : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a demo payment for a transaction
// @route   POST /api/transactions/:id/payment
// @access  Public
const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'Demo Bank Transfer', note = '' } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.',
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
      });
    }

    if (req.user && req.user.role !== 'ADMIN') {
      const isBuyer = transaction.buyer.toString() === req.user._id.toString();
      const isFarmer = transaction.farmer.toString() === req.user._id.toString();
      if (!isBuyer && !isFarmer) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to record payment for this transaction.',
        });
      }
    }

    if (transaction.transactionStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment on a cancelled transaction.',
      });
    }

    if (transaction.paymentStatus === 'PAID' || transaction.remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This transaction is already fully paid.',
      });
    }

    if (paymentAmount > transaction.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) exceeds the remaining balance (₹${transaction.remainingAmount.toLocaleString('en-IN')}).`,
      });
    }

    // Update financial amounts
    const updatedPaid = Math.round((transaction.amountPaid + paymentAmount) * 100) / 100;
    const updatedRemaining = Math.max(0, Math.round((transaction.netAmount - updatedPaid) * 100) / 100);

    transaction.amountPaid = updatedPaid;
    transaction.remainingAmount = updatedRemaining;

    // Auto-update payment status
    if (updatedRemaining === 0 || updatedPaid >= transaction.netAmount) {
      transaction.paymentStatus = 'PAID';
      transaction.transactionStatus = 'COMPLETED';

      // Safely handle CropLot inventory update
      const cropLot = await CropLot.findById(transaction.cropLot);
      if (cropLot) {
        if (cropLot.quantity > transaction.quantity) {
          // Partial lot sale: reduce quantity and keep remaining available
          cropLot.quantity = Math.max(0, Math.round((cropLot.quantity - transaction.quantity) * 100) / 100);
          cropLot.status = 'AVAILABLE';
        } else {
          // Entire lot sold
          cropLot.status = 'SOLD';
        }
        await cropLot.save();
      }
    } else {
      transaction.paymentStatus = 'PARTIAL';
      if (transaction.transactionStatus === 'CREATED') {
        transaction.transactionStatus = 'IN_PROGRESS';
      }
    }

    // Append to payment history
    transaction.paymentHistory.push({
      amount: paymentAmount,
      paymentDate: Date.now(),
      paymentMethod,
      note,
    });

    await transaction.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('farmer', 'name email phone location')
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
      .populate('offer', 'offeredPrice quantity status createdAt');

    res.status(200).json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully.`,
      data: populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction lifecycle status
// @route   PUT /api/transactions/:id/status
// @access  Public
const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
      });
    }

    if (req.user && req.user.role !== 'ADMIN') {
      const isBuyer = transaction.buyer.toString() === req.user._id.toString();
      const isFarmer = transaction.farmer.toString() === req.user._id.toString();
      if (!isBuyer && !isFarmer) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update status for this transaction.',
        });
      }
    }

    // Handle cancellation: revert crop lot to AVAILABLE if it was RESERVED
    if (status === 'CANCELLED' && transaction.transactionStatus !== 'CANCELLED') {
      const cropLot = await CropLot.findById(transaction.cropLot);
      if (cropLot && cropLot.status === 'RESERVED') {
        cropLot.status = 'AVAILABLE';
        await cropLot.save();
      }
    }

    // Handle completion
    if (status === 'COMPLETED' && transaction.transactionStatus !== 'COMPLETED') {
      const cropLot = await CropLot.findById(transaction.cropLot);
      if (cropLot) {
        if (cropLot.quantity > transaction.quantity) {
          cropLot.quantity = Math.max(0, Math.round((cropLot.quantity - transaction.quantity) * 100) / 100);
          cropLot.status = 'AVAILABLE';
        } else {
          cropLot.status = 'SOLD';
        }
        await cropLot.save();
      }
    }

    transaction.transactionStatus = status;
    await transaction.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('farmer', 'name email phone location')
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade location expectedPrice status')
      .populate('offer', 'offeredPrice quantity status createdAt');

    res.status(200).json({
      success: true,
      message: `Transaction status updated to ${status}.`,
      data: populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  recordPayment,
  updateTransactionStatus,
};
