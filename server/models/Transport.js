const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transporter',
      required: [true, 'Transporter reference is required'],
    },
    cropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
      required: false,
    },
    mandiBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MandiBooking',
      required: false,
    },
    cropName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [0, 'Distance cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
    },
    costPerQuintal: {
      type: Number,
      required: [true, 'Cost per quintal is required'],
      min: [0, 'Cost per quintal cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'BOOKED', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
        message: '{VALUE} is not a valid transport status',
      },
      default: 'BOOKED',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
    },
    refundStatus: {
      type: String,
      enum: {
        values: ['NOT_APPLICABLE', 'REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'],
        message: '{VALUE} is not a valid refund status',
      },
      default: 'NOT_APPLICABLE',
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundTransactionId: {
      type: String,
      trim: true,
      default: '',
    },
    refundInitiatedAt: {
      type: Date,
    },
    refundCompletedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: [
          'UPI', 
          'Debit/Credit Card', 
          'Net Banking', 
          'Cash on Delivery (COD)', 
          'Cash on Delivery', 
          'COD', 
          ''
        ],
        message: '{VALUE} is not a valid payment method',
      },
      default: '',
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    paymentDate: {
      type: Date,
    },
    paymentGatewayStatus: {
      type: String,
      default: 'PENDING_INTEGRATION',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transportSchema.index({ farmer: 1 });
transportSchema.index({ transporter: 1 });
transportSchema.index({ status: 1 });

module.exports = mongoose.model('Transport', transportSchema);
