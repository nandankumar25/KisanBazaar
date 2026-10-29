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
}, { _id: false });

const transporterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Transporter name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 quintal'],
    },
    pricePerKm: {
      type: Number,
      required: [true, 'Price per km is required'],
      min: [0, 'Price per km cannot be negative'],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    location: {
      type: locationSchema,
      required: [true, 'Location details are required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transporterSchema.index({ 'location.state': 1, 'location.district': 1 });
transporterSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Transporter', transporterSchema);
