const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runPublishPriceFlowTest() {
  console.log('========================================================');
  console.log('--- Testing Save & Publish Mandi Price Flow & Validation ---');
  console.log('========================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected:', mongoose.connection.host);

  try {
    // Step 1: Ensure a test Mandi Admin and verified Mandi exist
    const testEmail = 'mandi_publisher_test@kisanbazaar.com';
    await User.deleteMany({ email: testEmail });

    const mandiAdmin = await User.create({
      name: 'Mandi Rep Publisher',
      email: testEmail,
      password: 'Password123!',
      role: 'MANDI_ADMIN',
      isEmailVerified: true,
      phone: '9876543299',
    });

    const mandi = await Mandi.create({
      name: 'Publish Test Grain Yard',
      state: 'Punjab',
      district: 'Patiala',
      city: 'Patiala',
      address: 'Main Gate Market Yard',
      mandiAdmin: mandiAdmin._id,
      mandiType: 'Government',
      verificationStatus: 'VERIFIED',
      cropsSupported: ['Wheat', 'Mustard', 'Barley'],
    });

    mandiAdmin.mandiProfile = {
      mandiId: mandi._id,
      mandiName: mandi.name,
      mandiType: mandi.mandiType,
      verificationStatus: 'VERIFIED',
    };
    await mandiAdmin.save();

    // Log in as Mandi Admin to get auth cookie
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Mandi Admin logged in successfully');
    const authCookie = loginRes.headers.get('set-cookie');

    // Step 2: Test validation - minPrice > maxPrice
    const invalidMinMaxRes = await fetch(`${baseUrl}/mandi-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        crop: 'Mustard',
        variety: 'Pusa',
        qualityGrade: 'Grade A',
        minPrice: 6000,
        maxPrice: 5000,
        modalPrice: 5500,
      }),
    });
    const invalidMinMaxData = await invalidMinMaxRes.json();
    assert(invalidMinMaxRes.status === 400, 'Rejects minPrice > maxPrice with 400');
    assert(
      invalidMinMaxData.message.includes('Minimum price cannot be greater than maximum price'),
      `Correct error message returned: ${invalidMinMaxData.message}`
    );
    console.log('✓ PASS: Rejected minPrice > maxPrice validation with clear error message');

    // Step 3: Test validation - modalPrice outside min-max range
    const invalidModalRes = await fetch(`${baseUrl}/mandi-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        crop: 'Mustard',
        variety: 'Pusa',
        qualityGrade: 'Grade A',
        minPrice: 5000,
        maxPrice: 6000,
        modalPrice: 6500,
      }),
    });
    const invalidModalData = await invalidModalRes.json();
    assert(invalidModalRes.status === 400, 'Rejects modalPrice outside range with 400');
    assert(
      invalidModalData.message.includes('Modal price must fall within'),
      `Correct error message returned: ${invalidModalData.message}`
    );
    console.log('✓ PASS: Rejected out-of-range modalPrice validation with clear error message');

    // Step 4: Test validation - missing crop or zero/negative prices
    const invalidZeroRes = await fetch(`${baseUrl}/mandi-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        crop: '',
        minPrice: 0,
        maxPrice: 5000,
        modalPrice: 2500,
      }),
    });
    assert(invalidZeroRes.status === 400, 'Rejects missing crop with 400');
    console.log('✓ PASS: Rejected missing/empty crop name with 400');

    // Step 5: Test successful Save & Publish Price
    const validPublishRes = await fetch(`${baseUrl}/mandi-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        mandi: mandi._id,
        crop: 'Mustard',
        variety: 'Pusa Bold',
        qualityGrade: 'Grade A',
        minPrice: 5200,
        maxPrice: 5600,
        modalPrice: 5450,
      }),
    });
    const validPublishData = await validPublishRes.json();
    assert(validPublishRes.status === 201, 'Valid price published with 201 Created');
    assert(validPublishData.success === true, 'Success flag is true');
    assert(validPublishData.data?.crop === 'Mustard', 'Crop name matches');
    assert(validPublishData.data?.variety === 'Pusa Bold', 'Variety is stored and returned');
    assert(validPublishData.data?.minPrice === 5200, 'Min price matches');
    assert(validPublishData.data?.maxPrice === 5600, 'Max price matches');
    assert(validPublishData.data?.modalPrice === 5450, 'Modal price matches');
    assert(validPublishData.data?.priceSource === 'MANDI_ENTRY', 'Price source is MANDI_ENTRY');
    assert(validPublishData.data?.isOfficiallyVerified === false, 'isOfficiallyVerified is false');
    assert(validPublishData.data?.mandi?._id.toString() === mandi._id.toString(), 'Associated with correct Mandi');
    console.log('✓ PASS: Successfully published live mandi rate with variety, correct prices, and schema fields');

    // Step 6: Verify price is in MongoDB and returned in price list
    const pricesListRes = await fetch(`${baseUrl}/mandi-prices?mandi=${mandi._id}`);
    const pricesListData = await pricesListRes.json();
    assert(pricesListRes.status === 200, 'GET /api/mandi-prices succeeds');
    const found = pricesListData.data.find((p) => p._id === validPublishData.data._id);
    assert(found, 'Newly published price is retrieved in mandi price list');
    assert(found.variety === 'Pusa Bold', 'Retrieved price contains variety');
    console.log('✓ PASS: Published price immediately visible in GET /api/mandi-prices table');

    // Step 7: Clean up test data
    await MandiPrice.deleteMany({ mandi: mandi._id });
    await Mandi.findByIdAndDelete(mandi._id);
    await User.findByIdAndDelete(mandiAdmin._id);
    console.log('✓ PASS: Cleaned up test database records');

    console.log('========================================================');
    console.log('All Save & Publish Price tests passed successfully!');
    console.log('========================================================');
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPublishPriceFlowTest();