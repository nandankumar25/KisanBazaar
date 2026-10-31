const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const CropLot = require('../models/CropLot');
const Offer = require('../models/Offer');

// Helper to determine farmer vs buyer
const resolveRoles = async (userA, userB, cropLotId) => {
  let farmerId = null;
  let buyerId = null;

  if (cropLotId) {
    const lot = await CropLot.findById(cropLotId);
    if (lot && lot.farmer) {
      if (lot.farmer.toString() === userA._id.toString()) {
        farmerId = userA._id;
        buyerId = userB._id;
      } else if (lot.farmer.toString() === userB._id.toString()) {
        farmerId = userB._id;
        buyerId = userA._id;
      }
    }
  }

  if (!farmerId || !buyerId) {
    if (userA.role === 'FARMER' && userB.role === 'BUYER') {
      farmerId = userA._id;
      buyerId = userB._id;
    } else if (userA.role === 'BUYER' && userB.role === 'FARMER') {
      farmerId = userB._id;
      buyerId = userA._id;
    } else {
      // Fallback
      farmerId = userA._id;
      buyerId = userB._id;
    }
  }

  return { farmerId, buyerId };
};

// @desc    Send a message (and create/update conversation)
// @route   POST /api/messages
// @access  Protected
const sendMessage = async (req, res, next) => {
  try {
    let { recipientId, text, cropLotId, offerId, conversationId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    let conversation = null;

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findById(conversationId);
      // If recipientId wasn't passed directly, infer it from the conversation's participants
      if (conversation && (!recipientId || recipientId === 'undefined')) {
        const otherParticipant = conversation.participants.find(
          (p) => (p._id || p).toString() !== req.user._id.toString()
        );
        if (otherParticipant) {
          recipientId = (otherParticipant._id || otherParticipant).toString();
        } else if (conversation.farmer && conversation.farmer.toString() !== req.user._id.toString()) {
          recipientId = conversation.farmer.toString();
        } else if (conversation.buyer && conversation.buyer.toString() !== req.user._id.toString()) {
          recipientId = conversation.buyer.toString();
        }
      }
    }

    if (!recipientId || recipientId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message text are required.',
      });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a message to yourself.',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
      });
    }

    if (!conversation) {
      // Find existing conversation between these two participants
      const query = {
        participants: { $all: [req.user._id, recipient._id] },
      };
      if (cropLotId && mongoose.Types.ObjectId.isValid(cropLotId)) {
        query.cropLot = cropLotId;
      }

      conversation = await Conversation.findOne(query);

      // If still not found and no specific crop lot match, find any conversation between them
      if (!conversation) {
        conversation = await Conversation.findOne({
          participants: { $all: [req.user._id, recipient._id] },
        });
      }
    }

    // Create new conversation if none exists
    if (!conversation) {
      const { farmerId, buyerId } = await resolveRoles(req.user, recipient, cropLotId);

      conversation = await Conversation.create({
        participants: [req.user._id, recipient._id],
        farmer: farmerId,
        buyer: buyerId,
        cropLot: cropLotId && mongoose.Types.ObjectId.isValid(cropLotId) ? cropLotId : undefined,
        offer: offerId && mongoose.Types.ObjectId.isValid(offerId) ? offerId : undefined,
      });
    } else {
      // Update contextual references if provided
      if (cropLotId && !conversation.cropLot) {
        conversation.cropLot = cropLotId;
      }
      if (offerId && !conversation.offer) {
        conversation.offer = offerId;
      }
    }

    // Create the message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipient._id,
      text: text.trim(),
      cropLot: conversation.cropLot || (cropLotId && mongoose.Types.ObjectId.isValid(cropLotId) ? cropLotId : undefined),
      offer: conversation.offer || (offerId && mongoose.Types.ObjectId.isValid(offerId) ? offerId : undefined),
    });

    // Update conversation's lastMessage
    conversation.lastMessage = {
      text: text.trim(),
      sender: req.user._id,
      createdAt: new Date(),
    };
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role avatar')
      .populate('recipient', 'name role avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage,
      conversationId: conversation._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Protected
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email phone avatar role location buyerProfile')
      .populate('farmer', 'name email phone avatar location')
      .populate('buyer', 'name email phone avatar location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade expectedPrice location status')
      .populate('offer', 'offeredPrice quantity status')
      .populate('lastMessage.sender', 'name avatar')
      .sort({ updatedAt: -1 });

    // Calculate unread counts per conversation for current user
    const conversationIds = conversations.map((c) => c._id);
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          recipient: req.user._id,
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = {};
    unreadMessages.forEach((item) => {
      unreadMap[item._id.toString()] = item.count;
    });

    const formatted = conversations.map((conv) => {
      const convObj = conv.toObject();
      const otherParticipant = (conv.participants || []).find(
        (p) => (p._id || p).toString() !== req.user._id.toString()
      );
      const otherUser =
        otherParticipant ||
        (conv.farmer && conv.farmer._id.toString() === req.user._id.toString()
          ? conv.buyer
          : conv.farmer);
      convObj.otherUser = otherUser;
      convObj.unreadCount = unreadMap[conv._id.toString()] || 0;
      return convObj;
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id
// @access  Protected
const getConversationMessages = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email phone avatar role location buyerProfile')
      .populate('farmer', 'name email phone avatar location')
      .populate('buyer', 'name email phone avatar location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade expectedPrice location status')
      .populate('offer', 'offeredPrice quantity status');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const isParticipant =
      conversation.participants.some((p) => (p._id || p).toString() === req.user._id.toString()) ||
      req.user.role === 'ADMIN';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation.',
      });
    }

    // Mark unread messages received by current user as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name role avatar')
      .populate('recipient', 'name role avatar')
      .sort({ createdAt: 1 });

    const otherParticipant = (conversation.participants || []).find(
      (p) => (p._id || p).toString() !== req.user._id.toString()
    );
    const otherUser =
      otherParticipant ||
      (conversation.farmer && conversation.farmer._id.toString() === req.user._id.toString()
        ? conversation.buyer
        : conversation.farmer);

    res.status(200).json({
      success: true,
      data: messages,
      conversation,
      otherUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or initiate conversation with a specific user
// @route   GET /api/messages/with/:otherUserId
// @access  Protected
const getOrCreateConversationWithUser = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const { cropLot: cropLotId, offer: offerId } = req.query;

    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId) || otherUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partner user ID.',
      });
    }

    const otherUser = await User.findById(otherUserId).select(
      'name email phone avatar location role buyerProfile farmerProfile'
    );
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found.',
      });
    }

    let query = {
      participants: { $all: [req.user._id, otherUser._id] },
    };

    if (cropLotId && mongoose.Types.ObjectId.isValid(cropLotId)) {
      query.cropLot = cropLotId;
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name email phone avatar role location buyerProfile')
      .populate('farmer', 'name email phone avatar location')
      .populate('buyer', 'name email phone avatar location buyerProfile')
      .populate('cropLot', 'crop quantity unit qualityGrade expectedPrice location status')
      .populate('offer', 'offeredPrice quantity status');

    if (!conversation) {
      // Find any conversation between them
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, otherUser._id] },
      })
        .populate('participants', 'name email phone avatar role location buyerProfile')
        .populate('farmer', 'name email phone avatar location')
        .populate('buyer', 'name email phone avatar location buyerProfile')
        .populate('cropLot', 'crop quantity unit qualityGrade expectedPrice location status')
        .populate('offer', 'offeredPrice quantity status');
    }

    if (!conversation) {
      const { farmerId, buyerId } = await resolveRoles(req.user, otherUser, cropLotId);

      const newConv = await Conversation.create({
        participants: [req.user._id, otherUser._id],
        farmer: farmerId,
        buyer: buyerId,
        cropLot: cropLotId && mongoose.Types.ObjectId.isValid(cropLotId) ? cropLotId : undefined,
        offer: offerId && mongoose.Types.ObjectId.isValid(offerId) ? offerId : undefined,
      });

      conversation = await Conversation.findById(newConv._id)
        .populate('participants', 'name email phone avatar role location buyerProfile')
        .populate('farmer', 'name email phone avatar location')
        .populate('buyer', 'name email phone avatar location buyerProfile')
        .populate('cropLot', 'crop quantity unit qualityGrade expectedPrice location status')
        .populate('offer', 'offeredPrice quantity status');
    }

    res.status(200).json({
      success: true,
      data: conversation,
      otherUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total unread messages count for current user
// @route   GET /api/messages/unread-count
// @access  Protected
const getUnreadMessageCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
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

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  getOrCreateConversationWithUser,
  getUnreadMessageCount,
};
