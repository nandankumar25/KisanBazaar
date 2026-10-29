const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const locationSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      trim: true,
      default: 'Punjab',
    },
    district: {
      type: String,
      trim: true,
      default: 'Ludhiana',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    village: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const buyerProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, default: '' },
    businessType: { type: String, trim: true, default: 'Independent Buyer' },
    interestedCrops: [{ type: String, trim: true }],
    minQuantity: { type: Number, default: 10 },
    maxQuantity: { type: Number, default: 500 },
    requiredQuantity: { type: Number, default: 50 },
    preferredQualityGrades: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    buyingRequirements: { type: String, trim: true, default: '' },
    verified: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const transporterProfileSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, trim: true, default: 'Mini Truck (Tata Ace)' },
    vehicleNumber: { type: String, trim: true, default: '' },
    capacity: { type: Number, default: 25 }, // in quintals
    pricePerKm: { type: Number, default: 35 },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const farmerProfileSchema = new mongoose.Schema(
  {
    farmSize: { type: Number, default: 0 }, // in acres
    primaryCrops: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    farmingType: { type: String, trim: true, default: 'Conventional' },
  },
  { _id: false }
);

const mandiProfileSchema = new mongoose.Schema(
  {
    mandiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandi' },
    mandiName: { type: String, trim: true, default: '' },
    mandiType: { type: String, enum: ['Government', 'Private'], default: 'Government' },
    operatingHours: { type: String, trim: true, default: '08:00 AM - 06:00 PM' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'MANDI_ADMIN'],
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'Role is required'],
      default: 'FARMER',
    },
    location: {
      type: locationSchema,
      default: () => ({ state: 'Punjab', district: 'Ludhiana', city: '', village: '' }),
    },
    buyerProfile: {
      type: buyerProfileSchema,
      default: () => ({}),
    },
    transporterProfile: {
      type: transporterProfileSchema,
      default: () => ({}),
    },
    farmerProfile: {
      type: farmerProfileSchema,
      default: () => ({}),
    },
    mandiProfile: {
      type: mandiProfileSchema,
      default: () => ({}),
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: undefined,
    },
    verificationTokenExpires: {
      type: Date,
      default: undefined,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpires;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.__v;
  return userObject;
};

// Indexes
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
