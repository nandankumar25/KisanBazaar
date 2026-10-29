const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');
const MandiDemand = require('../models/MandiDemand');
const MandiBooking = require('../models/MandiBooking');

async function runMandiTestSuite() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5006, resolve));
  const baseUrl = 'http://localhost:5006/api';

  console.log('\n======================================================');
  console.log('--- Starting Mandi Admin Complete Workflow Test Suite ---');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Clean up test data from any previous runs
    const testEmails = [
      'admin_mandi_test@kisanbazaar.com',
      'mandi_rep_test@kisanbazaar.com',
      'farmer_mandi_test@kisanbazaar.com',
    ];
    await User.deleteMany({ email: { $in: testEmails } });
    await Mandi.deleteMany({ name: 'Test APMC Yard Ludhiana' });

    // Step 1: Create an Admin user for verification testing
    const adminUser = await User.create({
      name: 'Super Admin Test',
      email: 'admin_mandi_test@kisanbazaar.com',
      password: 'AdminPassword123',
      role: 'ADMIN',
      isEmailVerified: true,
      phone: '9888877771',
      location: { state: 'Punjab', district: 'Ludhiana' },
    });

    // Login as Admin to get cookie
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin_mandi_test@kisanbazaar.com',
        password: 'AdminPassword123',
      }),
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    assert(adminLoginRes.status === 200, 'Super Admin logged in successfully');

    // Step 2: Mandi Representative Registration
    const mandiRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Harpreet Singh',
        email: 'mandi_rep_test@kisanbazaar.com',
        password: 'MandiPassword123',
        phone: '9876501234',
        role: 'MANDI_ADMIN',
        location: { state: 'Punjab', district: 'Ludhiana', city: 'Ludhiana' },
        mandiName: 'Test APMC Yard Ludhiana',
        mandiType: 'Government',
        operatingHours: '08:00 AM - 05:00 PM',
        address: 'Gate 1, Grain Market Yard, GT Road',
      }),
    });
    const mandiRegData = await mandiRegRes.json();
    assert(
      mandiRegRes.status === 201 && (mandiRegData.data?.role === 'MANDI_ADMIN' || mandiRegData.user?.role === 'MANDI_ADMIN'),
      'Mandi Admin registered with MANDI_ADMIN role and Mandi Profile'
    );

    // Verify Mandi created in DB in PENDING status
    const createdMandi = await Mandi.findOne({ name: 'Test APMC Yard Ludhiana' });
    assert(
      createdMandi && createdMandi.verificationStatus === 'PENDING',
      'Mandi record created in PENDING verification status'
    );

    // Step 3: Public Mandi endpoint hides PENDING mandis
    const publicMandisRes = await fetch(`${baseUrl}/mandis`);
    const publicMandisData = await publicMandisRes.json();
    const isPendingMandiInPublic = publicMandisData.data?.some(
      (m) => m._id === createdMandi._id.toString()
    );
    assert(
      !isPendingMandiInPublic,
      'Unverified / Pending mandi is hidden from public Mandi listings'
    );

    // Step 4: Admin verifies and approves the Mandi
    const verifyRes = await fetch(`${baseUrl}/admin/mandis/${createdMandi._id}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    const verifyData = await verifyRes.json();
    assert(
      verifyRes.status === 200 && verifyData.data?.verificationStatus === 'VERIFIED',
      'Super Admin approved Mandi -> verificationStatus changed to VERIFIED'
    );

    // Step 5: Mandi is now visible in public verified listings
    const publicMandisResAfter = await fetch(`${baseUrl}/mandis`);
    const publicMandisDataAfter = await publicMandisResAfter.json();
    const isApprovedMandiInPublic = publicMandisDataAfter.data?.some(
      (m) => m._id === createdMandi._id.toString()
    );
    assert(
      isApprovedMandiInPublic,
      'Verified Mandi is now returned in public /api/mandis for farmers'
    );

    // Step 6: Log in as Mandi Admin
    // Verify email for test login convenience
    await User.updateOne({ email: 'mandi_rep_test@kisanbazaar.com' }, { isEmailVerified: true });
    const mandiLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mandi_rep_test@kisanbazaar.com',
        password: 'MandiPassword123',
      }),
    });
    const mandiCookie = mandiLoginRes.headers.get('set-cookie');
    assert(mandiLoginRes.status === 200, 'Mandi Admin logged in successfully');

    // Step 7: Mandi Admin publishes Live Mandi Prices
    const createPriceRes = await fetch(`${baseUrl}/mandi-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        crop: 'Wheat',
        variety: 'Sharbati',
        qualityGrade: 'Grade A',
        minPrice: 2400,
        maxPrice: 2650,
        modalPrice: 2550,
      }),
    });
    const createPriceData = await createPriceRes.json();
    assert(
      createPriceRes.status === 201 && createPriceData.data?.modalPrice === 2550,
      'Mandi Admin published live crop price (Wheat: ₹2550/Qtl modal)'
    );

    // Step 8: Mandi Admin publishes Procurement Demand
    const createDemandRes = await fetch(`${baseUrl}/mandi-demands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        crop: 'Wheat',
        requiredQuantity: 1000,
        qualityRequirements: 'Moisture < 12%, clean luster',
        minExpectedPrice: 2450,
        maxExpectedPrice: 2600,
      }),
    });
    const createDemandData = await createDemandRes.json();
    assert(
      createDemandRes.status === 201 && createDemandData.data?.requiredQuantity === 1000,
      'Mandi Admin published procurement demand (1000 Quintals Wheat)'
    );

    // Step 9: Register & Login a Farmer
    const farmerUser = await User.create({
      name: 'Gurpreet Singh',
      email: 'farmer_mandi_test@kisanbazaar.com',
      password: 'FarmerPassword123',
      role: 'FARMER',
      isEmailVerified: true,
      phone: '9812345678',
      location: { state: 'Punjab', district: 'Ludhiana', village: 'Sahnewal' },
    });

    const farmerLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'farmer_mandi_test@kisanbazaar.com',
        password: 'FarmerPassword123',
      }),
    });
    const farmerCookie = farmerLoginRes.headers.get('set-cookie');
    assert(farmerLoginRes.status === 200, 'Farmer logged in successfully');

    // Step 10: Farmer submits Crop Sale Booking request
    const createBookingRes = await fetch(`${baseUrl}/mandi-bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        mandiId: createdMandi._id,
        cropName: 'Wheat',
        estimatedQuantity: 60,
        qualityGrade: 'Grade A',
        expectedPricePerQuintal: 2550,
        preferredArrivalDate: new Date(Date.now() + 86400000).toISOString(),
        farmerNotes: 'Bringing 60 quintals in tractor trolley',
      }),
    });
    const createBookingData = await createBookingRes.json();
    assert(
      createBookingRes.status === 201 && createBookingData.data?.status === 'PENDING',
      'Farmer submitted crop sale request in PENDING status'
    );
    const bookingId = createBookingData.data._id;

    // Step 11: Mandi Admin reviews, accepts, and schedules arrival with Token Number
    const reviewBookingRes = await fetch(`${baseUrl}/mandi-bookings/${bookingId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        action: 'ACCEPT',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        tokenNumber: 'TKN-LUD-7821',
        proposedPricePerQuintal: 2550,
        mandiNotes: 'Proceed directly to Gate 2 weighbridge',
      }),
    });
    const reviewBookingData = await reviewBookingRes.json();
    assert(
      reviewBookingRes.status === 200 &&
        reviewBookingData.data?.status === 'ACCEPTED' &&
        reviewBookingData.data?.tokenNumber === 'TKN-LUD-7821',
      'Mandi Admin accepted request and assigned Token Number TKN-LUD-7821'
    );

    // Step 12: Mandi Admin marks arrival when farmer arrives at yard
    const arrivalRes = await fetch(`${baseUrl}/mandi-bookings/${bookingId}/arrival`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        gateEntryNumber: 'GATE-09',
        mandiNotes: 'Vehicle inspected, parked at weighbridge',
      }),
    });
    const arrivalData = await arrivalRes.json();
    assert(
      arrivalRes.status === 200 && arrivalData.data?.status === 'ARRIVED',
      'Farmer arrival marked at Mandi yard (status: ARRIVED)'
    );

    // Step 13: Mandi Admin performs quality check and weighbridge measurement
    const qualityRes = await fetch(`${baseUrl}/mandi-bookings/${bookingId}/quality-weighing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        actualQuantity: 62.5, // 62.5 Quintals weighed
        qualityGrade: 'Grade A',
        agreedPricePerQuintal: 2550,
        deductions: [{ reason: 'Unloading fee', amount: 250 }],
        mandiNotes: 'Moisture checked 11.2%, excellent quality',
      }),
    });
    const qualityData = await qualityRes.json();
    // 62.5 * 2550 = 159,375 - 250 = 159,125
    assert(
      qualityRes.status === 200 &&
        qualityData.data?.status === 'QUALITY_CHECKED' &&
        qualityData.data?.finalPayableAmount === 159125,
      'Weighment (62.5 Qtl), Grade A, and net payable amount ₹159,125 calculated correctly'
    );

    // Step 14: Mandi Admin completes the crop sale
    const completeRes = await fetch(`${baseUrl}/mandi-bookings/${bookingId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({}),
    });
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200 && completeData.data?.status === 'COMPLETED',
      'Crop sale successfully completed (status: COMPLETED)'
    );

    // Step 15: Mandi Admin updates payment settlement
    const paymentRes = await fetch(`${baseUrl}/mandi-bookings/${bookingId}/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: mandiCookie,
      },
      body: JSON.stringify({
        paymentStatus: 'PAID',
        paymentMode: 'Bank Transfer',
        paymentReference: 'UTR-HDFC-99128381',
        paymentNotes: 'Settled via RTGS to farmer account',
      }),
    });
    const paymentData = await paymentRes.json();
    assert(
      paymentRes.status === 200 &&
        paymentData.data?.paymentStatus === 'PAID' &&
        paymentData.data?.paymentReference === 'UTR-HDFC-99128381',
      'Payment marked PAID with verified UTR reference'
    );

    // Step 16: Mandi Admin statistics verification
    const statsRes = await fetch(`${baseUrl}/mandi-bookings/stats`, {
      headers: { Cookie: mandiCookie },
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 &&
        statsData.data?.totalRequests >= 1 &&
        statsData.data?.completedSales >= 1 &&
        statsData.data?.totalQuantityPurchasedQuintals >= 62.5,
      'Mandi Admin dashboard metrics accurately calculated from database records'
    );

    // Clean up test data
    await User.deleteMany({ email: { $in: testEmails } });
    await Mandi.deleteMany({ name: 'Test APMC Yard Ludhiana' });
    await MandiBooking.deleteMany({ _id: bookingId });
    await MandiPrice.deleteMany({ crop: 'Wheat', modalPrice: 2550 });
    await MandiDemand.deleteMany({ crop: 'Wheat', requiredQuantity: 1000 });

  } catch (err) {
    console.error('Test Suite encountered error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.connection.close();
  }

  console.log('\n------------------------------------------------------');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------\n');

  process.exit(failed > 0 ? 1 : 0);
}

runMandiTestSuite();
