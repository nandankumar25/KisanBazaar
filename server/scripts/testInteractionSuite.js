const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const CropLot = require('../models/CropLot');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

async function runInteractionTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5006, resolve));
  const baseUrl = 'http://localhost:5006/api';

  console.log('====================================================');
  console.log('Starting Buyer–Farmer Interaction & Deal Test Suite');
  console.log('====================================================');

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
    // 0. Clean up test users and data
    const testEmails = ['interactive_farmer@test.com', 'interactive_buyer@test.com', 'interactive_buyer2@test.com'];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const userIds = existingUsers.map((u) => u._id);

    await CropLot.deleteMany({ farmer: { $in: userIds } });
    await Offer.deleteMany({ $or: [{ buyer: { $in: userIds } }, { 'cropLot.farmer': { $in: userIds } }] });
    await Transaction.deleteMany({ $or: [{ buyer: { $in: userIds } }, { farmer: { $in: userIds } }] });
    await Conversation.deleteMany({ participants: { $in: userIds } });
    await Message.deleteMany({ $or: [{ sender: { $in: userIds } }, { recipient: { $in: userIds } }] });
    await Notification.deleteMany({ $or: [{ recipient: { $in: userIds } }, { sender: { $in: userIds } }] });
    await User.deleteMany({ email: { $in: testEmails } });

    // 1. Register Farmer
    const farmerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Singh',
        email: 'interactive_farmer@test.com',
        password: 'FarmerPassword123',
        phone: '9876543210',
        role: 'FARMER',
        location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      }),
    });
    const farmerData = await farmerRes.json();
    assert(farmerRes.status === 201 && farmerData.success, 'Farmer registered successfully');
    const farmerUser = farmerData.data || farmerData.user;
    const farmerId = farmerUser._id;
    const farmerCookie = farmerRes.headers.get('set-cookie');
    const jwt = require('jsonwebtoken');
    const farmerToken = jwt.sign({ id: farmerId }, process.env.JWT_SECRET || 'kisanbazaar_jwt_secret_dev_2025', { expiresIn: '30d' });

    // 2. Register Buyer
    const buyerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Aggarwal',
        email: 'interactive_buyer@test.com',
        password: 'BuyerPassword123',
        phone: '9123456789',
        role: 'BUYER',
        location: { state: 'Delhi', district: 'North Delhi', city: 'Azadpur Mandi' },
      }),
    });
    const buyerData = await buyerRes.json();
    assert(buyerRes.status === 201 && buyerData.success, 'Buyer registered successfully');
    const buyerUser = buyerData.data || buyerData.user;
    const buyerId = buyerUser._id;
    const buyerCookie = buyerRes.headers.get('set-cookie');
    const buyerToken = jwt.sign({ id: buyerId }, process.env.JWT_SECRET || 'kisanbazaar_jwt_secret_dev_2025', { expiresIn: '30d' });

    // 3. Test Buyer Profile Update (Requirement 1: businessName, location, interestedCrops, preferredQuality, requiredQuantity, buyingRequirements)
    const updateProfileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        name: 'Pooja Aggarwal',
        buyerProfile: {
          businessName: 'Aggarwal Agro Trading Co',
          businessType: 'Wholesale Trader',
          requiredQuantity: 100,
          minQuantity: 20,
          maxQuantity: 500,
          interestedCrops: ['Wheat', 'Basmati Paddy', 'Mustard'],
          preferredQualityGrades: ['Grade A', 'Premium'],
          preferredLocations: ['Ludhiana', 'Karnal'],
          buyingRequirements: 'Moisture below 11%, prompt payment via NEFT upon weighment.',
        },
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200 && updateProfileData.success, 'Buyer profile updated successfully');
    assert(
      updateProfileData.user.buyerProfile.requiredQuantity === 100 &&
        updateProfileData.user.buyerProfile.buyingRequirements.includes('Moisture below 11%') &&
        updateProfileData.user.buyerProfile.businessName === 'Aggarwal Agro Trading Co',
      'Buyer profile saved requiredQuantity, buyingRequirements, and businessName in MongoDB'
    );

    // 4. Test Farmer viewing Buyer details (Requirement 1: Show buyer information to farmers)
    const buyerDetailsRes = await fetch(`${baseUrl}/buyers/${buyerId}`);
    const buyerDetailsData = await buyerDetailsRes.json();
    assert(buyerDetailsRes.status === 200 && buyerDetailsData.success, 'Buyer profile fetched for farmer view');
    assert(
      buyerDetailsData.data.buyerProfile.requiredQuantity === 100 &&
        buyerDetailsData.data.buyerProfile.businessName === 'Aggarwal Agro Trading Co',
      'Farmer can view full buyer procurement requirements'
    );

    // 5. Farmer creates a CropLot (100 quintals available)
    const cropLot = await CropLot.create({
      farmer: farmerId,
      crop: 'Wheat Sharbati',
      quantity: 100,
      expectedPrice: 2500,
      qualityGrade: 'Grade A',
      location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      status: 'AVAILABLE',
    });
    assert(cropLot && cropLot._id, 'Crop lot created with 100 quintals');

    // 6. Test Offer Quantity Validation (Requirement 3: Validate quantities against available crop quantity)
    const invalidOfferRes = await fetch(`${baseUrl}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        cropLot: cropLot._id,
        offeredPrice: 2300,
        quantity: 150, // exceeds 100 quintals
        message: 'Looking for 150 quintals',
      }),
    });
    const invalidOfferData = await invalidOfferRes.json();
    assert(
      invalidOfferRes.status === 400 && invalidOfferData.message.includes('exceed'),
      'Offer with quantity exceeding available lot is rejected by backend validation'
    );

    // 7. Submit valid offer (Requirement 3: Buyers can submit offers with price, quantity, message)
    const validOfferRes = await fetch(`${baseUrl}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        cropLot: cropLot._id,
        offeredPrice: 2200,
        quantity: 60,
        message: 'Can pick up tomorrow if accepted.',
      }),
    });
    const validOfferData = await validOfferRes.json();
    assert(validOfferRes.status === 201 && validOfferData.success, 'Valid offer created with status PENDING');
    const offerId = validOfferData.data._id;
    assert(validOfferData.data.status === 'PENDING', 'Initial offer status is PENDING');

    // Verify Farmer received notification for incoming offer (Requirement 5)
    const farmerNotifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerNotifData = await farmerNotifRes.json();
    assert(
      farmerNotifData.data.some((n) => n.type === 'OFFER_RECEIVED' || n.type === 'OFFER_NEW'),
      'Farmer received in-app notification for incoming offer'
    );

    // 8. Farmer Counter-Offer (Requirement 3: Farmer counters with price, quantity, message)
    const farmerCounterRes = await fetch(`${baseUrl}/offers/${offerId}/counter`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        counterPrice: 2400,
        counterQuantity: 60,
        counterMessage: 'Grain moisture is 9%, best price is ₹2,400.',
      }),
    });
    const farmerCounterData = await farmerCounterRes.json();
    assert(farmerCounterRes.status === 200 && farmerCounterData.success, 'Farmer successfully sent counter-offer');
    assert(
      farmerCounterData.data.status === 'COUNTERED' &&
        farmerCounterData.data.lastActionBy === 'FARMER' &&
        farmerCounterData.data.counterPrice === 2400 &&
        farmerCounterData.data.negotiationHistory.length === 2,
      'Offer status is COUNTERED with lastActionBy FARMER and history round saved in MongoDB'
    );

    // Verify Buyer received notification for counter-offer (Requirement 5)
    const buyerNotifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerNotifData = await buyerNotifRes.json();
    assert(
      buyerNotifData.data.some((n) => n.type === 'OFFER_COUNTERED' || n.type === 'OFFER_COUNTER'),
      'Buyer received in-app notification for farmer counter-offer'
    );

    // 9. Buyer Counter-Counter Offer (Requirement 3: Buyer can counter the farmer counter-offer)
    const buyerCounterRes = await fetch(`${baseUrl}/offers/${offerId}/counter`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        counterPrice: 2350,
        counterQuantity: 60,
        counterMessage: 'Splitting the difference at ₹2,350 with immediate payment.',
      }),
    });
    const buyerCounterData = await buyerCounterRes.json();
    assert(buyerCounterRes.status === 200 && buyerCounterData.success, 'Buyer counter-counter offer accepted by backend');
    assert(
      buyerCounterData.data.status === 'COUNTERED' &&
        buyerCounterData.data.lastActionBy === 'BUYER' &&
        buyerCounterData.data.counterPrice === 2350 &&
        buyerCounterData.data.negotiationHistory.length === 3,
      'Offer recorded multi-round negotiation history (3 rounds) with lastActionBy BUYER'
    );

    // 10. Farmer Accepts Offer (Requirement 3 & 4: Farmer accepts -> Deal Confirmation)
    const acceptOfferRes = await fetch(`${baseUrl}/offers/${offerId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
    });
    const acceptOfferData = await acceptOfferRes.json();
    assert(acceptOfferRes.status === 200 && acceptOfferData.success, 'Farmer accepted offer');
    assert(acceptOfferData.data.status === 'ACCEPTED', 'Offer status set to ACCEPTED');

    // Verify CropLot was RESERVED
    const updatedCropLot = await CropLot.findById(cropLot._id);
    assert(updatedCropLot.status === 'RESERVED', 'CropLot status updated to RESERVED');

    // Verify Deal (Transaction) was auto-created in MongoDB with agreed terms
    const deal = await Transaction.findOne({ offer: offerId });
    assert(deal !== null, 'Deal (Transaction) auto-created in MongoDB upon offer acceptance');
    assert(
      deal.pricePerQuintal === 2350 &&
        deal.quantity === 60 &&
        deal.farmer.toString() === farmerId.toString() &&
        deal.buyer.toString() === buyerId.toString() &&
        deal.transactionStatus === 'CONFIRMED',
      'Confirmed deal contains agreed negotiated price (₹2,350), quantity (60), crop lot, and CONFIRMED status'
    );

    // 11. Deal Duplication Prevention (Requirement 4: Prevent duplicate deal creation)
    const dupDealRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        offerId: offerId,
        cropLotId: cropLot._id,
        farmerId: farmerId,
        buyerId: buyerId,
        quantity: 60,
        pricePerQuintal: 2350,
      }),
    });
    const dupDealData = await dupDealRes.json();
    assert(
      dupDealRes.status === 200 && dupDealData.data._id.toString() === deal._id.toString(),
      'Duplicate deal creation safely returns existing confirmed deal without error'
    );

    // 12. Offer Cancellation (Requirement 3: Status Cancelled)
    const buyer2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Buyer 2',
        email: 'interactive_buyer2@test.com',
        password: 'BuyerPassword123',
        role: 'BUYER',
      }),
    });
    const buyer2Data = await buyer2Res.json();
    const buyer2User = buyer2Data.data || buyer2Data.user;
    const buyer2Token = jwt.sign({ id: buyer2User._id }, process.env.JWT_SECRET || 'kisanbazaar_jwt_secret_dev_2025', { expiresIn: '30d' });

    const offer2 = await Offer.create({
      cropLot: cropLot._id,
      buyer: buyer2User._id,
      offeredPrice: 2000,
      quantity: 20,
      status: 'PENDING',
    });

    const cancelOfferRes = await fetch(`${baseUrl}/offers/${offer2._id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyer2Token}` },
    });
    const cancelOfferData = await cancelOfferRes.json();
    assert(
      cancelOfferRes.status === 200 && cancelOfferData.data.status === 'CANCELLED',
      'Buyer can cancel their pending offer with CANCELLED status'
    );

    // 13. Farmer–Buyer Messaging (Requirement 2: Real-time messaging, MongoDB persistence, read status)
    const sendMsgRes = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        recipientId: farmerId,
        text: 'Namaste Ramesh ji, what time can our transport truck arrive at Khanna Mandi tomorrow?',
        cropLotId: cropLot._id,
        offerId: offerId,
      }),
    });
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgRes.status === 201 && sendMsgData.success, 'Message sent successfully from Buyer to Farmer');
    const convId = sendMsgData.data.conversation;
    assert(sendMsgData.data.isRead === false, 'Initial message is unread');

    // Farmer checks conversations list
    const convListRes = await fetch(`${baseUrl}/messages/conversations`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const convListData = await convListRes.json();
    assert(
      convListData.data.length > 0 && convListData.data[0].unreadCount === 1,
      'Farmer sees conversation with unreadCount = 1'
    );

    // Farmer opens conversation messages (Requirement 2: Displays chat history with read/unread status)
    const convMsgsRes = await fetch(`${baseUrl}/messages/conversations/${convId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const convMsgsData = await convMsgsRes.json();
    assert(
      convMsgsData.data.length === 1 && convMsgsData.data[0].text.includes('Khanna Mandi'),
      'Farmer retrieved message history with crop lot context'
    );

    // Verify message marked read in MongoDB after recipient views it
    const updatedMsg = await Message.findById(sendMsgData.data._id);
    assert(updatedMsg.isRead === true, 'Message is marked as read after recipient opens thread');

    // 14. Notifications Management (Requirement 5: Mark all read, unread count)
    const unreadCountRes = await fetch(`${baseUrl}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const unreadCountData = await unreadCountRes.json();
    const countVal = typeof unreadCountData.data?.unreadCount === 'number' ? unreadCountData.data.unreadCount : unreadCountData.unreadCount;
    assert(typeof countVal === 'number', 'Unread notifications count API works');

    const markAllReadRes = await fetch(`${baseUrl}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const markAllReadData = await markAllReadRes.json();
    assert(markAllReadData.success === true, 'Mark all notifications as read works');

    console.log('====================================================');
    console.log(`Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    // Clean up
    await server.close();
    await mongoose.connection.close();

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite encountered error:', err);
    await server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runInteractionTests();
