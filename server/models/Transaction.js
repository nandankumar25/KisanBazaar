const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: 'Demo Bank Transfer',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const transactionSchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
    },
    mandiBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MandiBooking',
    },
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
    },
    cropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    pricePerQuintal: {
      type: Number,
      required: [true, 'Price per quintal is required'],
      min: [0.01, 'Price per quintal must be greater than zero'],
    },
    grossAmount: {
      type: Number,
      min: [0, 'Gross amount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
    },
    transportCost: {
      type: Number,
      default: 0,
      min: [0, 'Transport cost cannot be negative'],
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: [0, 'Net amount cannot be negative'],
    },
    destination: {
      type: String,
      trim: true,
      default: '',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'PARTIAL', 'PAID'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
    },
    transactionStatus: {
      type: String,
      enum: {
        values: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'INITIATED', 'CONFIRMED'],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'CREATED',
    },
    paymentHistory: [paymentHistorySchema],
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure consistent calculations and field aliases
transactionSchema.pre('validate', function (next) {
  if (this.pricePerQuintal && this.quantity) {
    const gross = Math.round(Number(this.pricePerQuintal) * Number(this.quantity) * 100) / 100;
    this.grossAmount = gross;
    this.totalAmount = gross; // maintain backward compatibility
  }

  const transport = Number(this.transportCost) || 0;
  const grossVal = Number(this.grossAmount) || Number(this.totalAmount) || 0;
  this.netAmount = Math.max(0, Math.round((grossVal - transport) * 100) / 100);

  const paid = Number(this.amountPaid) || 0;
  this.remainingAmount = Math.max(0, Math.round((this.netAmount - paid) * 100) / 100);

  next();
});

// Indexes
transactionSchema.index({ transactionStatus: 1 });
transactionSchema.index({ paymentStatus: 1 });
transactionSchema.index({ farmer: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ offer: 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
