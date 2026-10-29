const mongoose = require('mongoose');

const mandiPriceSchema = new mongoose.Schema(
  {
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
      required: [true, 'Mandi reference is required'],
    },
    crop: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
      default: '',
    },
    qualityGrade: {
      type: String,
      trim: true,
      default: 'FAQ (Fair Average Quality)',
    },
    minPrice: {
      type: Number,
      required: [true, 'Minimum price is required'],
      min: [0, 'Price cannot be negative'],
    },
    maxPrice: {
      type: Number,
      required: [true, 'Maximum price is required'],
      min: [0, 'Price cannot be negative'],
    },
    modalPrice: {
      type: Number,
      required: [true, 'Modal price is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: {
      type: String,
      default: 'quintal',
      trim: true,
    },
    priceSource: {
      type: String,
      enum: ['MANDI_ENTRY', 'GOVT_MSP', 'AGMARKNET'],
      default: 'MANDI_ENTRY',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isOfficiallyVerified: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: [true, 'Price date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mandiPriceSchema.index({ crop: 1, date: -1 });
mandiPriceSchema.index({ mandi: 1, crop: 1, date: -1 });

module.exports = mongoose.model('MandiPrice', mandiPriceSchema);
