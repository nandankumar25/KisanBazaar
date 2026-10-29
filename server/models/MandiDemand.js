const mongoose = require('mongoose');

const mandiDemandSchema = new mongoose.Schema(
  {
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
      required: [true, 'Mandi reference is required'],
      index: true,
    },
    mandiAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mandi Admin reference is required'],
      index: true,
    },
    crop: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    requiredQuantity: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [1, 'Required quantity must be at least 1 quintal'],
    },
    purchasedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Purchased quantity cannot be negative'],
    },
    qualityRequirements: {
      type: String,
      trim: true,
      default: 'Grade A / FAQ (Fair Average Quality)',
    },
    minPrice: {
      type: Number,
      required: [true, 'Minimum expected price is required'],
      min: [0, 'Price cannot be negative'],
    },
    maxPrice: {
      type: Number,
      required: [true, 'Maximum expected price is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: {
      type: String,
      default: 'quintal',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining quantity
mandiDemandSchema.virtual('remainingQuantity').get(function () {
  return Math.max(0, this.requiredQuantity - (this.purchasedQuantity || 0));
});

mandiDemandSchema.set('toJSON', { virtuals: true });
mandiDemandSchema.set('toObject', { virtuals: true });

mandiDemandSchema.index({ mandi: 1, crop: 1, status: 1 });

module.exports = mongoose.model('MandiDemand', mandiDemandSchema);
