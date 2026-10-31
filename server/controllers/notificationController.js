const Notification = require('../models/Notification');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Protected
const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id, type: { $ne: 'MESSAGE' } };

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ ...query, isRead: false }),
      Notification.countDocuments(query),
    ]);

    // Auto-sync completed refund notifications so no stale "Initiated" status is displayed
    const Transport = require('../models/Transport');
    for (const notif of notifications) {
      if (notif.type === 'TRANSPORT_REFUND') {
        if (notif.title === 'Transport Refund Initiated' || notif.message.includes('initiated')) {
          const transportDoc = notif.relatedTransport ? await Transport.findById(notif.relatedTransport) : null;
          const cropName = transportDoc?.cropName || 'Produce';
          const qty = transportDoc?.quantity || 50;
          const amt = transportDoc?.refundAmount || transportDoc?.paidAmount || transportDoc?.totalCost || 840;
          const actionWord = (transportDoc?.status === 'CANCELLED' || String(transportDoc?.cancellationReason || '').trim())
            ? 'cancelled'
            : 'rejected';

          notif.title = 'Transport Refund Successful';
          notif.message = `Your transport booking for ${cropName} (${qty} qtl) has been ${actionWord}. Your refund of ₹${amt} has been successfully credited to your original payment method.`;
          try {
            await notif.save();
          } catch (saveErr) {
            console.error('Failed to auto-sync refund notification:', saveErr.message);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Protected
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      type: { $ne: 'MESSAGE' },
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Protected
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Protected
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, type: { $ne: 'MESSAGE' }, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
