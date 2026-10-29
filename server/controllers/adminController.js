const User = require('../models/User');
const CropLot = require('../models/CropLot');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const Transporter = require('../models/Transporter');
const Mandi = require('../models/Mandi');
const Notification = require('../models/Notification');

/**
 * @desc    Get system-wide metrics and stats for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private (ADMIN only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      farmersCount,
      buyersCount,
      transportersCount,
      mandiAdminsCount,
      adminsCount,
      totalCropLots,
      totalOffers,
      totalTransactions,
      totalTransporters,
      totalMandis,
      pendingMandisCount,
      verifiedMandisCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'FARMER' }),
      User.countDocuments({ role: 'BUYER' }),
      User.countDocuments({ role: 'TRANSPORTER' }),
      User.countDocuments({ role: 'MANDI_ADMIN' }),
      User.countDocuments({ role: 'ADMIN' }),
      CropLot.countDocuments(),
      Offer.countDocuments(),
      Transaction.countDocuments(),
      Transporter.countDocuments(),
      Mandi.countDocuments(),
      Mandi.countDocuments({ verificationStatus: 'PENDING' }),
      Mandi.countDocuments({ verificationStatus: 'VERIFIED' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          farmers: farmersCount,
          buyers: buyersCount,
          transporters: transportersCount,
          mandiAdmins: mandiAdminsCount,
          admins: adminsCount,
        },
        market: {
          cropLots: totalCropLots,
          offers: totalOffers,
          transactions: totalTransactions,
          transporters: totalTransporters,
          mandis: totalMandis,
          pendingMandis: pendingMandisCount,
          verifiedMandis: verifiedMandisCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users list with role filtering
 * @route   GET /api/admin/users
 * @access  Private (ADMIN only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    const validRoles = ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'MANDI_ADMIN'];
    if (role && validRoles.includes(role.toUpperCase())) {
      filter.role = role.toUpperCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's role or status
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (ADMIN only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    const validRoles = ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'MANDI_ADMIN'];
    if (!role || !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required (FARMER, BUYER, TRANSPORTER, ADMIN, MANDI_ADMIN).',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    targetUser.role = role.toUpperCase();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${targetUser.role}.`,
      data: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (ADMIN only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account.',
      });
    }

    const user = await User.findByIdAndDelete(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User account removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all mandis with verification status filtering for Admin Dashboard
 * @route   GET /api/admin/mandis
 * @access  Private (ADMIN only)
 */
const getAdminMandis = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status.toUpperCase())) {
      filter.verificationStatus = status.toUpperCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    const mandis = await Mandi.find(filter)
      .populate('mandiAdmin', 'name email phone location')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: mandis.length,
      data: mandis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify or reject a mandi registration
 * @route   PUT /api/admin/mandis/:id/verify
 * @access  Private (ADMIN only)
 */
const verifyMandi = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const mandiId = req.params.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'APPROVE' or 'REJECT'.",
      });
    }

    const mandi = await Mandi.findById(mandiId);
    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'Mandi record not found.',
      });
    }

    if (action === 'APPROVE') {
      mandi.verificationStatus = 'VERIFIED';
      mandi.isActive = true;
      mandi.verifiedBy = req.user._id;
      mandi.verifiedAt = new Date();
      mandi.rejectionReason = '';
      await mandi.save();

      // Update associated user's profile if linked
      if (mandi.mandiAdmin) {
        await User.findByIdAndUpdate(mandi.mandiAdmin, {
          'mandiProfile.verificationStatus': 'VERIFIED',
          'mandiProfile.verifiedAt': mandi.verifiedAt,
          'mandiProfile.verifiedBy': req.user._id,
        });

        // Send Notification to Mandi Admin
        await Notification.create({
          recipient: mandi.mandiAdmin,
          sender: req.user._id,
          type: 'MANDI_VERIFIED',
          title: 'Mandi Account Approved & Verified',
          message: `Congratulations! ${mandi.name} has been verified and approved by the platform administration. You can now publish live crop prices and receive farmer sale requests.`,
          link: '/mandi-dashboard',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Mandi '${mandi.name}' verified and approved successfully.`,
        data: mandi,
      });
    } else {
      // REJECT
      mandi.verificationStatus = 'REJECTED';
      mandi.isActive = false;
      mandi.rejectionReason = rejectionReason || 'Verification failed. Requirements not satisfied.';
      await mandi.save();

      if (mandi.mandiAdmin) {
        await User.findByIdAndUpdate(mandi.mandiAdmin, {
          'mandiProfile.verificationStatus': 'REJECTED',
          'mandiProfile.rejectionReason': mandi.rejectionReason,
        });

        await Notification.create({
          recipient: mandi.mandiAdmin,
          sender: req.user._id,
          type: 'MANDI_BOOKING_REJECTED',
          title: 'Mandi Verification Request Rejected',
          message: `Your verification request for ${mandi.name} was rejected: ${mandi.rejectionReason}`,
          link: '/mandi-dashboard',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Mandi '${mandi.name}' has been marked as REJECTED.`,
        data: mandi,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminMandis,
  verifyMandi,
};
