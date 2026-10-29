const mongoose = require('mongoose');

const mandiSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mandi name is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Punjab',
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    mandiAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    mandiType: {
      type: String,
      enum: ['Government', 'Private'],
      default: 'Government',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    operatingHours: {
      type: String,
      trim: true,
      default: '08:00 AM - 06:00 PM',
    },
    cropsSupported: [
      {
        type: String,
        trim: true,
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mandiSchema.index({ state: 1, district: 1, city: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ verificationStatus: 1, isActive: 1 });

module.exports = mongoose.model('Mandi', mandiSchema);
