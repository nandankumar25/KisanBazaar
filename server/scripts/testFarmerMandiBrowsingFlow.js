const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');
const CropLot = require('../models/CropLot');
const User = require('../models/User');

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runMandiBrowsingFlowTest() {
  console.log('========================================================');
  console.log('--- Testing Farmer Mandi Browsing & Price Verification ---');
  console.log('========================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected:', mongoose.connection.host);

  try {
    // 1. Fetch all verified mandis
    const mandisRes = await fetch(`${baseUrl}/mandis`);
    const mandisData = await mandisRes.json();
    assert(mandisRes.status === 200, 'GET /api/mandis responds with 200');
    assert(Array.isArray(mandisData.data) && mandisData.data.length > 0, 'Verified mandis exist in the system');
    console.log(`✓ PASS: Found ${mandisData.data.length} verified mandis`);

    const testMandi = mandisData.data[0];
    console.log(`Testing with Mandi: ${testMandi.name} (ID: ${testMandi._id})`);

    // 2. Fetch Mandi details by ID (used by MandiDetails.jsx)
    const singleMandiRes = await fetch(`${baseUrl}/mandis/${testMandi._id}`);
    const singleMandiData = await singleMandiRes.json();
    assert(singleMandiRes.status === 200, 'GET /api/mandis/:id responds with 200');
    assert(singleMandiData.data.name === testMandi.name, 'Mandi name matches');
    assert(singleMandiData.data.city || singleMandiData.data.district, 'Mandi has location details');
    console.log(`✓ PASS: Mandi details verified (Name: ${singleMandiData.data.name}, Location: ${singleMandiData.data.city}, ${singleMandiData.data.state})`);

    // 3. Fetch Mandi prices for this specific mandi (used by MandiDetails.jsx)
    const pricesRes = await fetch(`${baseUrl}/mandi-prices?mandi=${testMandi._id}`);
    const pricesData = await pricesRes.json();
    assert(pricesRes.status === 200, 'GET /api/mandi-prices?mandi=:id responds with 200');
    console.log(`✓ PASS: Mandi prices query succeeded (Returned ${pricesData.data.length} price records)`);

    // 4. Test price structure when available
    if (pricesData.data.length > 0) {
      const samplePrice = pricesData.data[0];
      assert(samplePrice.crop, 'Price has crop name');
      assert(typeof samplePrice.modalPrice === 'number', 'Price has modal price');
      assert(typeof samplePrice.minPrice === 'number', 'Price has min price');
      assert(typeof samplePrice.maxPrice === 'number', 'Price has max price');
      console.log(`✓ PASS: Price data structure validated for crop: ${samplePrice.crop} (Modal: ₹${samplePrice.modalPrice}, Min: ₹${samplePrice.minPrice}, Max: ₹${samplePrice.maxPrice})`);
    }

    // 5. Test Mandi without prices (ensure clean empty response -> "Price currently unavailable")
    const emptyMandi = await Mandi.findOne({ name: /RamaMandi/i });
    if (emptyMandi) {
      const emptyPricesRes = await fetch(`${baseUrl}/mandi-prices?mandi=${emptyMandi._id}`);
      const emptyPricesData = await emptyPricesRes.json();
      assert(emptyPricesRes.status === 200, 'Empty mandi price query returns 200');
      assert(emptyPricesData.data.length === 0, 'No fake prices returned for mandi without published prices');
      console.log(`✓ PASS: Mandi without published prices returns 0 dummy records (correctly triggers "Price currently unavailable" badge)`);
    }

    // 6. Test Crop Lot creation with targetMandi reference
    const farmer = await User.findOne({ role: 'FARMER' });
    if (farmer) {
      const testLot = await CropLot.create({
        farmer: farmer._id,
        crop: 'Wheat',
        quantity: 50,
        unit: 'quintal',
        qualityGrade: 'Grade A',
        expectedPrice: 2450,
        targetMandi: testMandi._id,
        location: {
          state: testMandi.state,
          district: testMandi.district,
          city: testMandi.city,
          village: 'Near Mandi Gate',
        },
        description: `Pre-filled test lot for ${testMandi.name}`,
      });

      assert(testLot._id, 'CropLot created successfully');
      assert(testLot.targetMandi.toString() === testMandi._id.toString(), 'CropLot correctly stores targetMandi reference');
      console.log(`✓ PASS: Crop lot creation with pre-filled targetMandi verified (Lot ID: ${testLot._id})`);

      // Clean up test lot
      await CropLot.findByIdAndDelete(testLot._id);
      console.log('✓ PASS: Cleaned up test crop lot');
    }

    console.log('========================================================');
    console.log('All Farmer Mandi Browsing Flow tests passed successfully!');
    console.log('========================================================');
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMandiBrowsingFlowTest();