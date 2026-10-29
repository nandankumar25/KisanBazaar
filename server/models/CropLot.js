const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  village: {
    type: String,
    trim: true,
    default: '',
  },
}, { _id: false });

const cropLotSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    crop: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      default: 'quintal',
      trim: true,
    },
    qualityGrade: {
      type: String,
      required: [true, 'Quality grade is required'],
      trim: true,
    },
    location: {
      type: locationSchema,
      required: [true, 'Location details are required'],
    },
    expectedPrice: {
      type: Number,
      required: [true, 'Expected price is required'],
      min: [0, 'Expected price cannot be negative'],
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'SOLD', 'RESERVED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'AVAILABLE',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    targetMandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cropLotSchema.index({ crop: 1 });
cropLotSchema.index({ status: 1 });
cropLotSchema.index({ 'location.state': 1, 'location.district': 1 });
cropLotSchema.index({ farmer: 1 });

module.exports = mongoose.model('CropLot', cropLotSchema);
