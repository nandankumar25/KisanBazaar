const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Mandi = require('../models/Mandi');
const { generateTokenAndSetCookie, clearAuthCookie } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID;
const getClientUrl = (req) => {
  if (req && req.headers && req.headers.origin) {
    return req.headers.origin;
  }
  return process.env.CLIENT_URL || 'http://localhost:3000';
};

/**
 * @desc    Register a new user (FARMER, BUYER, TRANSPORTER only)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'FARMER',
      phone = '',
      location,
      buyerProfile,
      transporterProfile,
      mandiProfile,
      mandiName,
      mandiType = 'Government',
      operatingHours = '08:00 AM - 06:00 PM',
      address = '',
      cropsSupported = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Role Escalation Protection: Public registration must never allow ADMIN
    const normalizedRole = role.toUpperCase().trim();
    const allowedPublicRoles = ['FARMER', 'BUYER', 'TRANSPORTER', 'MANDI_ADMIN'];
    if (!allowedPublicRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Public registration is only allowed for FARMER, BUYER, TRANSPORTER, or MANDI_ADMIN roles. Registration as ADMIN is strictly prohibited.',
      });
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    // Generate cryptographic email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const userLocation = location || { state: 'Punjab', district: 'Ludhiana', city: '', village: '' };

    // Create user record
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      phone: phone.trim(),
      location: userLocation,
      buyerProfile: normalizedRole === 'BUYER' ? (buyerProfile || {}) : undefined,
      transporterProfile: normalizedRole === 'TRANSPORTER' ? (transporterProfile || {}) : undefined,
      isEmailVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: verificationExpires,
    });

    // If registering as MANDI_ADMIN, create associated Mandi in PENDING status
    if (normalizedRole === 'MANDI_ADMIN') {
      const finalMandiName = mandiName || mandiProfile?.mandiName || `${name.trim()} Mandi`;
      const finalAddress = address || mandiProfile?.address || `${userLocation.city || userLocation.district || 'Market Yard'}, ${userLocation.state}`;
      
      const newMandi = await Mandi.create({
        name: finalMandiName.trim(),
        state: userLocation.state || 'Punjab',
        district: userLocation.district || 'Ludhiana',
        city: userLocation.city || userLocation.district || 'Ludhiana',
        address: finalAddress.trim(),
        mandiAdmin: user._id,
        mandiType: ['Government', 'Private'].includes(mandiType) ? mandiType : 'Government',
        contactPhone: phone.trim(),
        contactEmail: email.toLowerCase().trim(),
        operatingHours: operatingHours || '08:00 AM - 06:00 PM',
        cropsSupported: Array.isArray(cropsSupported) && cropsSupported.length > 0 ? cropsSupported : ['Wheat', 'Rice', 'Maize', 'Mustard', 'Potato'],
        verificationStatus: 'PENDING',
        isActive: false, // Inactive until Admin approves
      });

      user.mandiProfile = {
        mandiId: newMandi._id,
        mandiName: newMandi.name,
        mandiType: newMandi.mandiType,
        operatingHours: newMandi.operatingHours,
        verificationStatus: 'PENDING',
      };
      await user.save();
    }

    // Send verification email via Resend
    const verificationUrl = `${getClientUrl(req)}/verify-email/${rawVerificationToken}`;
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl,
      token: rawVerificationToken,
    });

    // Issue HttpOnly JWT session cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please create an account first.',
      });
    }

    // Check if account was created exclusively via Google OAuth without a password
    if (!user.password && user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'This account was created with Google Sign-In. Please sign in using Google.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Issue HttpOnly JWT cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google Sign-In / Registration via Google Identity Services ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential, role, isRegistration = false, action } = req.body;
    const googleClientId = getGoogleClientId();

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token credential is required.',
      });
    }

    if (!googleClientId) {
      return res.status(500).json({
        success: false,
        message: 'Google Client ID is not configured on the server.',
      });
    }

    // Verify Google ID token audience and authenticity
    const googleClient = new OAuth2Client(googleClientId);
    let payload = null;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        message: 'Google token verification failed: ' + verifyErr.message,
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google profile payload.',
      });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.email.split('@')[0];
    const googleId = payload.sub;
    const avatar = payload.picture || '';

    // Check if user already exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const isRegisterRequest = isRegistration === true || action === 'register';

      // If user is not registered and request is a login attempt, reject
      if (!isRegisterRequest) {
        return res.status(404).json({
          success: false,
          message: 'Account not found. Please register first.',
        });
      }

      // Explicit registration flow via Google OAuth
      const normalizedRole = (role || 'FARMER').toUpperCase().trim();
      const allowedPublicRoles = ['FARMER', 'BUYER', 'TRANSPORTER', 'MANDI_ADMIN'];
      const assignedRole = allowedPublicRoles.includes(normalizedRole) ? normalizedRole : 'FARMER';

      const userData = {
        name,
        email,
        googleId,
        avatar,
        role: assignedRole,
        isEmailVerified: true, // Google verifies user email
        location: { state: 'Punjab', district: 'Ludhiana', city: '', village: '' },
      };

      if (assignedRole === 'MANDI_ADMIN') {
        userData.mandiProfile = {
          mandiName: req.body.mandiName || `${name}'s Mandi Yard`,
          mandiType: req.body.mandiType || 'Government',
          operatingHours: req.body.operatingHours || '08:00 AM - 06:00 PM',
          contactPhone: req.body.contactPhone || '',
          verificationStatus: 'PENDING',
        };
      }

      user = await User.create(userData);

      if (assignedRole === 'MANDI_ADMIN') {
        const Mandi = require('../models/Mandi');
        const mandi = await Mandi.create({
          name: userData.mandiProfile.mandiName,
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          address: 'Market Yard Complex, Punjab',
          mandiAdmin: user._id,
          mandiType: userData.mandiProfile.mandiType,
          operatingHours: userData.mandiProfile.operatingHours,
          contactPhone: userData.mandiProfile.contactPhone,
          verificationStatus: 'PENDING',
        });
        user.mandiProfile.mandi = mandi._id;
        await user.save();
      }
    } else {
      // Existing registered user - preserve existing database role!
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
      }
    }

    // Issue HttpOnly JWT session cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Google Sign-In successful.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify user email via cryptographic token
 * @route   GET /api/auth/verify-email/:token or POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.body.token;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification link.',
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Refresh auth cookie session
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now fully active.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email to user
 * @route   POST /api/auth/resend-verification
 * @access  Public / Protected
 */
const resendVerification = async (req, res, next) => {
  try {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : req.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Safe enumeration prevention message
      return res.status(200).json({
        success: true,
        message: 'If an unverified account exists with this email, a verification link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account has already verified its email address.',
      });
    }

    // Generate new verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = `${getClientUrl(req)}/verify-email/${rawToken}`;
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl,
      token: rawToken,
    });

    res.status(200).json({
      success: true,
      message: 'A fresh verification email has been dispatched. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Protect against account enumeration: return positive response regardless of existence
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email address, a password reset link has been dispatched.',
      });
    }

    // Generate cryptographic reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${getClientUrl(req)}/reset-password/${rawResetToken}`;
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      token: rawResetToken,
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email address, a password reset link has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using cryptographic token
 * @route   POST /api/auth/reset-password/:token or POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.body.token;
    const { password } = req.body;

    if (!rawToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link.',
      });
    }

    // Update password (pre-save hook will hash it with bcrypt)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Auto-login with new password
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You are now logged in.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
    data: req.user,
  });
};

/**
 * @desc    Logout user and clear HttpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Update current authenticated user's profile
 * @route   PUT /api/auth/profile
 * @access  Protected
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const {
      name,
      phone,
      location,
      avatar,
      buyerProfile,
      transporterProfile,
      farmerProfile,
      mandiProfile,
    } = req.body;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters long.',
        });
      }
      user.name = name.trim();
    }

    // Phone
    if (phone !== undefined) {
      user.phone = typeof phone === 'string' ? phone.trim() : '';
    }

    // Avatar URL string (if updating via external link)
    if (avatar !== undefined && typeof avatar === 'string') {
      user.avatar = avatar.trim();
    }

    // Location
    if (location && typeof location === 'object') {
      user.location = {
        state: location.state !== undefined ? String(location.state).trim() : user.location.state,
        district: location.district !== undefined ? String(location.district).trim() : user.location.district,
        city: location.city !== undefined ? String(location.city).trim() : user.location.city,
        village: location.village !== undefined ? String(location.village).trim() : user.location.village,
      };
    }

    // Role-specific profiles
    if (user.role === 'BUYER' && buyerProfile && typeof buyerProfile === 'object') {
      const parseArray = (val, fallback = []) => {
        if (Array.isArray(val)) return val.map((item) => String(item).trim()).filter(Boolean);
        if (typeof val === 'string') return val.split(',').map((item) => item.trim()).filter(Boolean);
        return fallback;
      };

      user.buyerProfile = {
        businessName: buyerProfile.businessName !== undefined ? String(buyerProfile.businessName).trim() : user.buyerProfile?.businessName || '',
        businessType: buyerProfile.businessType !== undefined ? String(buyerProfile.businessType).trim() : user.buyerProfile?.businessType || 'Independent Buyer',
        interestedCrops: parseArray(buyerProfile.interestedCrops, user.buyerProfile?.interestedCrops || []),
        minQuantity: buyerProfile.minQuantity !== undefined ? Math.max(0, Number(buyerProfile.minQuantity) || 0) : user.buyerProfile?.minQuantity ?? 10,
        maxQuantity: buyerProfile.maxQuantity !== undefined ? Math.max(0, Number(buyerProfile.maxQuantity) || 0) : user.buyerProfile?.maxQuantity ?? 500,
        requiredQuantity: buyerProfile.requiredQuantity !== undefined ? Math.max(0, Number(buyerProfile.requiredQuantity) || 0) : user.buyerProfile?.requiredQuantity ?? 50,
        preferredQualityGrades: parseArray(buyerProfile.preferredQualityGrades, user.buyerProfile?.preferredQualityGrades || ['Grade A']),
        preferredLocations: parseArray(buyerProfile.preferredLocations, user.buyerProfile?.preferredLocations || []),
        buyingRequirements: buyerProfile.buyingRequirements !== undefined ? String(buyerProfile.buyingRequirements).trim() : user.buyerProfile?.buyingRequirements || '',
        description: buyerProfile.description !== undefined ? String(buyerProfile.description).trim() : user.buyerProfile?.description || '',
        verified: user.buyerProfile?.verified ?? false,
      };
    }

    if (user.role === 'TRANSPORTER' && transporterProfile && typeof transporterProfile === 'object') {
      user.transporterProfile = {
        vehicleType: transporterProfile.vehicleType !== undefined ? String(transporterProfile.vehicleType).trim() : user.transporterProfile?.vehicleType || '',
        vehicleNumber: transporterProfile.vehicleNumber !== undefined ? String(transporterProfile.vehicleNumber).trim() : user.transporterProfile?.vehicleNumber || '',
        capacity: transporterProfile.capacity !== undefined ? Number(transporterProfile.capacity) || 0 : user.transporterProfile?.capacity || 25,
        pricePerKm: transporterProfile.pricePerKm !== undefined ? Number(transporterProfile.pricePerKm) || 0 : user.transporterProfile?.pricePerKm || 35,
        rating: user.transporterProfile?.rating || 5.0,
        isAvailable: transporterProfile.isAvailable !== undefined ? Boolean(transporterProfile.isAvailable) : (user.transporterProfile?.isAvailable !== undefined ? user.transporterProfile.isAvailable : true),
      };
    }

    if (user.role === 'FARMER' && farmerProfile && typeof farmerProfile === 'object') {
      user.farmerProfile = {
        farmSize: farmerProfile.farmSize !== undefined ? Number(farmerProfile.farmSize) || 0 : user.farmerProfile?.farmSize || 0,
        primaryCrops: Array.isArray(farmerProfile.primaryCrops)
          ? farmerProfile.primaryCrops
          : typeof farmerProfile.primaryCrops === 'string'
          ? farmerProfile.primaryCrops.split(',').map((c) => c.trim()).filter(Boolean)
          : user.farmerProfile?.primaryCrops || [],
        experienceYears: farmerProfile.experienceYears !== undefined ? Number(farmerProfile.experienceYears) || 0 : user.farmerProfile?.experienceYears || 0,
        farmingType: farmerProfile.farmingType !== undefined ? String(farmerProfile.farmingType).trim() : user.farmerProfile?.farmingType || 'Conventional',
      };
    }

    if (user.role === 'MANDI_ADMIN' && mandiProfile && typeof mandiProfile === 'object') {
      user.mandiProfile = {
        ...(user.mandiProfile || {}),
        mandiName: mandiProfile.mandiName !== undefined ? String(mandiProfile.mandiName).trim() : user.mandiProfile?.mandiName,
        mandiType: mandiProfile.mandiType !== undefined ? String(mandiProfile.mandiType).trim() : user.mandiProfile?.mandiType || 'Government',
        operatingHours: mandiProfile.operatingHours !== undefined ? String(mandiProfile.operatingHours).trim() : user.mandiProfile?.operatingHours || '08:00 AM - 06:00 PM',
      };

      if (user.mandiProfile?.mandiId) {
        await Mandi.findByIdAndUpdate(user.mandiProfile.mandiId, {
          name: user.mandiProfile.mandiName,
          mandiType: user.mandiProfile.mandiType,
          operatingHours: user.mandiProfile.operatingHours,
          contactPhone: user.phone,
        });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload profile photo / avatar
 * @route   POST /api/auth/avatar
 * @access  Protected
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select an image.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // If user previously had a local avatar, delete it to prevent storage bloat
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldAvatarFilename = path.basename(user.avatar);
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', oldAvatarFilename);
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (err) {
        console.warn('Could not remove previous avatar file:', err.message);
      }
    }

    // Relative URL path to stored avatar
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = relativeUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      avatar: user.avatar,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove profile photo / avatar
 * @route   DELETE /api/auth/avatar
 * @access  Protected
 */
const removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // If local file, delete it
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldAvatarFilename = path.basename(user.avatar);
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', oldAvatarFilename);
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (err) {
        console.warn('Could not remove avatar file:', err.message);
      }
    }

    user.avatar = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo removed.',
      avatar: '',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  updateProfile,
  uploadAvatar,
  removeAvatar,
};
