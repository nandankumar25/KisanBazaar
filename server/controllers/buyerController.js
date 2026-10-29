const User = require('../models/User');
const CropLot = require('../models/CropLot');

// @desc    Get all users with role BUYER
// @route   GET /api/buyers
// @access  Public
const getBuyers = async (req, res, next) => {
  try {
    const { state, district, city, crop } = req.query;

    const filter = { role: 'BUYER' };

    if (state) {
      filter['location.state'] = { $regex: new RegExp(state, 'i') };
    }
    if (district) {
      filter['location.district'] = { $regex: new RegExp(district, 'i') };
    }
    if (city) {
      filter['location.city'] = { $regex: new RegExp(city, 'i') };
    }
    if (crop) {
      filter['buyerProfile.interestedCrops'] = { $regex: new RegExp(crop, 'i') };
    }

    const buyers = await User.find(filter)
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: buyers.length,
      data: buyers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer details by ID
// @route   GET /api/buyers/:id
// @access  Public
const getBuyerById = async (req, res, next) => {
  try {
    const buyer = await User.findOne({
      _id: req.params.id,
      role: 'BUYER',
    }).select('-password');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: buyer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Find buyers matching a specific crop lot
// @route   GET /api/buyers/match/:cropLotId
// @access  Public
const getMatchedBuyers = async (req, res, next) => {
  try {
    const cropLot = await CropLot.findById(req.params.cropLotId).populate('farmer', 'location');
    if (!cropLot) {
      return res.status(404).json({ success: false, message: 'Crop lot not found' });
    }

    const buyers = await User.find({ role: 'BUYER' }).select('-password');

    const matchedBuyers = [];

    buyers.forEach(buyer => {
      const profile = buyer.buyerProfile;
      if (!profile) return; // Skip buyers without profiles

      let score = 0;
      const matchReasons = [];

      // A. Crop match (+40)
      const isCropMatch = profile.interestedCrops.some(c => c.toLowerCase() === cropLot.crop.toLowerCase());
      if (isCropMatch) {
        score += 40;
        matchReasons.push('Crop matches buyer requirement');
      }

      // B. Quantity match (+25 / +10)
      if (profile.minQuantity && profile.maxQuantity) {
        if (cropLot.quantity >= profile.minQuantity && cropLot.quantity <= profile.maxQuantity) {
          score += 25;
          matchReasons.push('Quantity strictly matches buyer requirement');
        } else {
          // If within 30% margin, give partial score
          const margin = cropLot.quantity * 0.3;
          if (cropLot.quantity >= (profile.minQuantity - margin) && cropLot.quantity <= (profile.maxQuantity + margin)) {
            score += 10;
            matchReasons.push('Quantity is close to buyer requirement');
          }
        }
      }

      // C. Quality match (+20)
      const isQualityMatch = profile.preferredQualityGrades.some(q => q.toLowerCase() === cropLot.qualityGrade.toLowerCase());
      if (isQualityMatch) {
        score += 20;
        matchReasons.push('Quality grade matches');
      }

      // D. Location match (+15 max)
      const farmerLoc = cropLot.location;
      const buyerLoc = buyer.location;
      
      let locScore = 0;
      if (farmerLoc.state.toLowerCase() === buyerLoc.state.toLowerCase()) {
        if (farmerLoc.district.toLowerCase() === buyerLoc.district.toLowerCase()) {
          if (farmerLoc.city.toLowerCase() === buyerLoc.city.toLowerCase()) {
            locScore = 15;
            matchReasons.push('Same city location match');
          } else {
            locScore = 10;
            matchReasons.push('Same district location match');
          }
        } else {
          locScore = 5;
          matchReasons.push('Same state location match');
        }
      }

      // Add preferred location text check if location object didn't match fully
      if (locScore < 15 && profile.preferredLocations && profile.preferredLocations.length > 0) {
        const isInPreferred = profile.preferredLocations.some(l => 
          l.toLowerCase() === farmerLoc.city.toLowerCase() || 
          l.toLowerCase() === farmerLoc.district.toLowerCase() || 
          l.toLowerCase() === farmerLoc.state.toLowerCase()
        );
        if (isInPreferred) {
          locScore = Math.max(locScore, 10);
          if (!matchReasons.some(r => r.includes('location'))) {
             matchReasons.push('Preferred location matches');
          }
        }
      }
      
      score += locScore;

      // Ensure max 100
      score = Math.min(score, 100);

      // Only push if score > 0
      if (score > 0) {
        matchedBuyers.push({
          buyer,
          matchScore: score,
          matchReasons
        });
      }
    });

    // Sort by highest match score first
    matchedBuyers.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      count: matchedBuyers.length,
      data: matchedBuyers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBuyers,
  getBuyerById,
  getMatchedBuyers,
};
