const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: {
        values: [
          'MESSAGE',
          'OFFER_RECEIVED',
          'OFFER_NEW',
          'OFFER_COUNTERED',
          'OFFER_COUNTER',
          'OFFER_ACCEPTED',
          'OFFER_REJECTED',
          'OFFER_CANCELLED',
          'DEAL_CONFIRMED',
          'TRANSPORT_UPDATE',
          'TRANSPORT_BOOKING',
          'TRANSPORT_CANCELLED',
          'TRANSPORT_REFUND',
          'MANDI_BOOKING_NEW',
          'MANDI_BOOKING_ACCEPTED',
          'MANDI_BOOKING_SCHEDULED',
          'MANDI_BOOKING_QUALITY_CHECKED',
          'MANDI_BOOKING_COMPLETED',
          'MANDI_BOOKING_REJECTED',
          'MANDI_VERIFIED',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    relatedOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
    },
    relatedCropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
    },
    relatedConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    relatedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    relatedMandiBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MandiBooking',
    },
    relatedTransport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
