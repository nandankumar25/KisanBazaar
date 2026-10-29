const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    cropLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropLot',
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ farmer: 1, buyer: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
