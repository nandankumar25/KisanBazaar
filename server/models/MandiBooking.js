const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Deduction amount cannot be negative'],
    },
  },
  { _id: false }
);

const mandiBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    tokenNumber: {
      type: String,
      trim: true,
      default: '',
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
      required: [true, 'Mandi reference is required'],
      index: true,
    },
    mandiAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
    },
    crop: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity in quintals is required'],
      min: [1, 'Quantity must be at least 1 quintal'],
    },
    qualityGrade: {
      type: String,
      trim: true,
      default: 'Grade A',
    },
    expectedPrice: {
      type: Number,
      required: [true, 'Expected price per quintal is required'],
      min: [0, 'Expected price cannot be negative'],
    },
    preferredArrivalDate: {
      type: Date,
      required: [true, 'Preferred arrival date is required'],
    },
    availableDate: {
      type: Date,
    },
    scheduledArrivalDate: {
      type: Date,
    },
    proposedPrice: {
      type: Number,
      min: [0, 'Proposed price cannot be negative'],
    },
    farmerNotes: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    mandiNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'ACCEPTED',
          'SCHEDULED',
          'ARRIVED',
          'QUALITY_CHECKED',
          'COMPLETED',
          'REJECTED',
        ],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },

    // Quality Inspection & Weighing Slip
    weighingSlipNumber: {
      type: String,
      trim: true,
      default: '',
    },
    actualReceivedQuantity: {
      type: Number,
      min: [0, 'Received quantity cannot be negative'],
    },
    finalQualityGrade: {
      type: String,
      trim: true,
      default: '',
    },
    acceptedPricePerQuintal: {
      type: Number,
      min: [0, 'Accepted price cannot be negative'],
    },
    deductions: [deductionSchema],
    totalDeductions: {
      type: Number,
      default: 0,
      min: [0, 'Total deductions cannot be negative'],
    },
    grossAmount: {
      type: Number,
      min: [0, 'Gross amount cannot be negative'],
    },
    finalPayableAmount: {
      type: Number,
      min: [0, 'Final payable amount cannot be negative'],
    },
    qualityInspectionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    saleCompletedAt: {
      type: Date,
    },

    // Payment Settlement
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
      index: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMode: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Cheque', 'Cash', ''],
      default: '',
    },
    paymentNotes: {
      type: String,
      trim: true,
      default: '',
    },

    // Transport linkage
    transportRequested: {
      type: Boolean,
      default: false,
    },
    transportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Convenient virtual aliases matching frontend & test queries
mandiBookingSchema.virtual('actualQuantity').get(function () {
  return this.actualReceivedQuantity;
});

mandiBookingSchema.virtual('cropName').get(function () {
  return this.crop;
});

mandiBookingSchema.virtual('estimatedQuantity').get(function () {
  return this.quantity;
});

mandiBookingSchema.virtual('agreedPricePerQuintal').get(function () {
  return this.acceptedPricePerQuintal;
});

mandiBookingSchema.virtual('proposedPricePerQuintal').get(function () {
  return this.proposedPrice;
});

mandiBookingSchema.virtual('expectedPricePerQuintal').get(function () {
  return this.expectedPrice;
});

// Indexes
mandiBookingSchema.index({ farmer: 1, status: 1 });
mandiBookingSchema.index({ mandi: 1, status: 1 });
mandiBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MandiBooking', mandiBookingSchema);
