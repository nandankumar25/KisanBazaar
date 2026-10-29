const Notification = require('../models/Notification');

/**
 * Safely create an in-app notification for a user with duplicate prevention
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  link = '',
  relatedOffer = null,
  relatedCropLot = null,
  relatedConversation = null,
  relatedTransaction = null,
  relatedMandiBooking = null,
  relatedTransport = null,
}) => {
  try {
    if (!recipient) return null;

    // Deduplication check: prevent identical notification within 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existing = await Notification.findOne({
      recipient,
      type,
      ...(relatedOffer ? { relatedOffer } : {}),
      ...(relatedTransport ? { relatedTransport } : {}),
      ...(relatedConversation ? { relatedConversation } : {}),
      createdAt: { $gte: fiveSecondsAgo },
    });

    if (existing) {
      return existing;
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      relatedOffer,
      relatedCropLot,
      relatedConversation,
      relatedTransaction,
      relatedMandiBooking,
      relatedTransport,
    });
  } catch (err) {
    console.error('Failed to create in-app notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
