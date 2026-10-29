const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Mandi = require('../models/Mandi');
const MandiBooking = require('../models/MandiBooking');
const CropLot = require('../models/CropLot');

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runFarmerSellAtMandiTest() {
  console.log('===============================================================');
  console.log('--- Testing Farmer "Sell Crop at This Mandi" Direct Request Flow ---');
  console.log('===============================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected:', mongoose.connection.host);

  try {
    // Step 1: Create a verified test Mandi and Mandi Admin
    const mandiEmail = 'sell_mandi_admin@kisanbazaar.com';
    const farmerEmail = 'sell_farmer_test@kisanbazaar.com';
    await User.deleteMany({ email: { $in: [mandiEmail, farmerEmail] } });

    const mandiAdmin = await User.create({
      name: 'Patiala Mandi Yard Officer',
      email: mandiEmail,
      password: 'Password123!',
      role: 'MANDI_ADMIN',
      isEmailVerified: true,
      phone: '9888877771',
    });

    const testMandi = await Mandi.create({
      name: 'Patiala Central Grain Yard',
      state: 'Punjab',
      district: 'Patiala',
      city: 'Patiala',
      address: 'Near Old Grain Market Gate 2',
      mandiAdmin: mandiAdmin._id,
      mandiType: 'Government',
      verificationStatus: 'VERIFIED',
      cropsSupported: ['Wheat', 'Rice', 'Maize'],
    });

    mandiAdmin.mandiProfile = {
      mandiId: testMandi._id,
      mandiName: testMandi.name,
      mandiType: testMandi.mandiType,
      verificationStatus: 'VERIFIED',
    };
    await mandiAdmin.save();

    // Step 2: Create a test Farmer
    const farmer = await User.create({
      name: 'Harpreet Singh Farmer',
      email: farmerEmail,
      password: 'Password123!',
      role: 'FARMER',
      isEmailVerified: true,
      phone: '9876501234',
    });

    // Count initial crop lots to prove NO crop lot is created by this mandi selling request
    const initialLotCount = await CropLot.countDocuments({ farmer: farmer._id });

    // Step 3: Farmer logs in
    const farmerLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: farmerEmail,
        password: 'Password123!',
      }),
    });
    const farmerLoginData = await farmerLoginRes.json();
    assert(farmerLoginRes.status === 200, 'Farmer logged in successfully');
    const farmerCookie = farmerLoginRes.headers.get('set-cookie');
    console.log('✓ PASS: Farmer logged in successfully');

    // Step 4: Farmer submits Sell Crop at Mandi request
    const arrivalDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const sellRequestRes = await fetch(`${baseUrl}/mandi-bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        mandi: testMandi._id,
        crop: 'Wheat',
        quantity: 75,
        qualityGrade: 'Grade A',
        expectedPrice: 2350,
        preferredArrivalDate: arrivalDate,
        farmerNotes: 'Fresh harvested Sharbati wheat, packed in 50kg standard jute bags.',
      }),
    });

    const sellRequestData = await sellRequestRes.json();
    assert(sellRequestRes.status === 201, 'Sell request created with 201 Created');
    assert(sellRequestData.success === true, 'Success flag is true');
    assert(sellRequestData.data?.bookingNumber, 'Booking number generated');
    assert(sellRequestData.data?.status === 'PENDING', 'Initial status is PENDING');
    assert(sellRequestData.data?.crop === 'Wheat', 'Crop name matches');
    assert(sellRequestData.data?.quantity === 75, 'Quantity is 75 quintals');
    assert(sellRequestData.data?.expectedPrice === 2350, 'Expected price is ₹2350/qtl');
    console.log(`✓ PASS: Farmer submitted sell request with PENDING status (Ref: ${sellRequestData.data.bookingNumber})`);

    // Step 5: Verify NO crop lot was created (distinct from open market crop lots)
    const afterLotCount = await CropLot.countDocuments({ farmer: farmer._id });
    assert(
      afterLotCount === initialLotCount,
      'Confirmed: No duplicate crop lot was created in the marketplace'
    );
    console.log('✓ PASS: Verified no unnecessary crop lot was created');

    // Step 6: Farmer queries their mandi requests
    const farmerBookingsRes = await fetch(`${baseUrl}/mandi-bookings/farmer`, {
      headers: { Cookie: farmerCookie },
    });
    const farmerBookingsData = await farmerBookingsRes.json();
    assert(farmerBookingsRes.status === 200, 'Farmer can fetch their mandi requests');
    const myRequest = farmerBookingsData.data.find(
      (b) => b._id === sellRequestData.data._id
    );
    assert(myRequest, 'Farmer request is found in farmer requests list');
    assert(myRequest.status === 'PENDING', 'Request status is visible to farmer as PENDING');
    console.log('✓ PASS: Request is visible to farmer with PENDING status');

    // Step 7: Mandi Admin logs in and reviews request
    const mandiLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mandiEmail,
        password: 'Password123!',
      }),
    });
    assert(mandiLoginRes.status === 200, 'Mandi Admin logged in successfully');
    const mandiCookie = mandiLoginRes.headers.get('set-cookie');

    // Mandi Admin accepts the request
    const reviewRes = await fetch(`${baseUrl}/mandi-bookings/${myRequest._id}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        action: 'ACCEPT',
        proposedPrice: 2350,
        tokenNumber: 'TKN-PAT-108',
        scheduledArrivalDate: arrivalDate,
      }),
    });
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 200, 'Mandi Admin accepted the request');
    console.log('✓ PASS: Mandi Admin accepted the selling request and assigned token TKN-PAT-108');

    // Step 8: Farmer verifies status updated to ACCEPTED/SCHEDULED
    const updatedFarmerRes = await fetch(`${baseUrl}/mandi-bookings/farmer`, {
      headers: { Cookie: farmerCookie },
    });
    const updatedFarmerData = await updatedFarmerRes.json();
    const updatedRequest = updatedFarmerData.data.find((b) => b._id === myRequest._id);
    assert(
      ['ACCEPTED', 'SCHEDULED'].includes(updatedRequest.status),
      `Farmer sees updated status: ${updatedRequest.status}`
    );
    assert(
      updatedRequest.tokenNumber === 'TKN-PAT-108',
      'Farmer sees the assigned arrival token number'
    );
    console.log(`✓ PASS: Farmer sees live updated status (${updatedRequest.status}) and Token Number (${updatedRequest.tokenNumber})`);

    // Clean up test records
    await MandiBooking.deleteMany({ mandi: testMandi._id });
    await Mandi.findByIdAndDelete(testMandi._id);
    await User.deleteMany({ email: { $in: [mandiEmail, farmerEmail] } });
    console.log('✓ PASS: Cleaned up test data');

    console.log('===============================================================');
    console.log('All "Sell Crop at This Mandi" direct request tests passed!');
    console.log('===============================================================');
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runFarmerSellAtMandiTest();