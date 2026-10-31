const mongoose = require('mongoose');

const negotiationRecordSchema = new mongoose.Schema(
  {
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['BUYER', 'FARMER', 'ADMIN'],
      required: true,
    },
    action: {
      type: String,
      enum: ['OFFER', 'COUNTER', 'ACCEPT', 'REJECT', 'CANCEL'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const offerSchema = new mongoose.Schema(
  {
    cropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
      required: [true, 'CropLot reference is required'],
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
    },
    offeredPrice: {
      type: Number,
      required: [true, 'Offered price is required'],
      min: [0, 'Offered price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'CANCELLED', 'COMPLETED'],
        message: '{VALUE} is not a valid offer status',
      },
      default: 'PENDING',
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'COMPLETED'],
      default: 'PENDING',
    },
    lastActionBy: {
      type: String,
      enum: ['BUYER', 'FARMER', 'ADMIN'],
      default: 'BUYER',
    },
    counterPrice: {
      type: Number,
      min: [0, 'Counter price cannot be negative'],
    },
    counterQuantity: {
      type: Number,
      min: [0.1, 'Counter quantity must be greater than zero'],
    },
    counterMessage: {
      type: String,
      trim: true,
      default: '',
    },
    negotiationHistory: [negotiationRecordSchema],
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
offerSchema.index({ status: 1 });
offerSchema.index({ cropLot: 1 });
offerSchema.index({ buyer: 1 });
offerSchema.index({ lastActionBy: 1 });

module.exports = mongoose.model('Offer', offerSchema);
