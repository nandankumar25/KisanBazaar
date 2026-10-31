const dotenv = require('dotenv');
dotenv.config();
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

async function runMessagingAndNotificationTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5007, resolve));
  const baseUrl = 'http://localhost:5007/api';

  console.log('====================================================');
  console.log('Messages & Notifications End-to-End Test Suite');
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
    // 0. Clean up previous test users and artifacts
    const testEmails = ['test_msg_farmer@test.com', 'test_msg_buyer@test.com'];
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
    const farmerRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kisan Test Farmer',
        email: 'test_msg_farmer@test.com',
        password: 'Password123',
        phone: '9811122233',
        role: 'FARMER',
        location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      }),
    });
    const farmerData = await farmerRegRes.json();
    assert(farmerRegRes.ok && farmerData.success, 'Farmer registered successfully');
    const farmerUser = farmerData.data || farmerData.user;
    const farmerId = farmerUser._id;

    // 2. Register Buyer
    const buyerRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Agro Test Buyer',
        email: 'test_msg_buyer@test.com',
        password: 'Password123',
        phone: '9822233344',
        role: 'BUYER',
        location: { state: 'Delhi', district: 'Central', city: 'New Delhi' },
        buyerProfile: { businessName: 'Agro Procure Ltd', gstNumber: '07AAAAA0000A1Z5' },
      }),
    });
    const buyerData = await buyerRegRes.json();
    assert(buyerRegRes.ok && buyerData.success, 'Buyer registered successfully');
    const buyerUser = buyerData.data || buyerData.user;
    const buyerId = buyerUser._id;

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'kisanbazaar_fallback_dev_secret_key_2026';
    const farmerToken = jwt.sign({ id: farmerId }, secret, { expiresIn: '7d' });
    const buyerToken = jwt.sign({ id: buyerId }, secret, { expiresIn: '7d' });

    const farmerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${farmerToken}`,
    };
    const buyerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    };

    // 3. Initiate or get conversation between Farmer and Buyer
    const initConvRes = await fetch(`${baseUrl}/messages/with/${buyerId}`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const initConvData = await initConvRes.json();
    assert(initConvRes.ok && initConvData.success, 'Farmer successfully initiated conversation with Buyer');
    assert(initConvData.data?._id, 'Conversation has valid MongoDB ID');
    const conversationId = initConvData.data._id;

    // 4. Farmer sends message to Buyer
    const sendMsgRes = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        conversationId,
        recipientId: buyerId,
        text: 'Hello Buyer, I have 50 quintals of premium Basmati rice available.',
      }),
    });
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgRes.ok && sendMsgData.success, 'Farmer successfully sent message');
    assert(sendMsgData.data?.text.includes('50 quintals'), 'Message text matches');

    // 5. Verify message persistence in MongoDB
    const persistedMsg = await Message.findById(sendMsgData.data._id);
    assert(persistedMsg && persistedMsg.text.includes('50 quintals'), 'Message confirmed persisted in MongoDB');

    // 6. Buyer checks unread message count
    const buyerUnreadMsgRes = await fetch(`${baseUrl}/messages/unread-count`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerUnreadMsgData = await buyerUnreadMsgRes.json();
    assert(buyerUnreadMsgData.success && (buyerUnreadMsgData.unreadCount === 1 || buyerUnreadMsgData.data?.unreadCount === 1), 'Buyer has 1 unread message');

    // 7. Buyer checks conversation list
    const buyerConvListRes = await fetch(`${baseUrl}/messages/conversations`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerConvListData = await buyerConvListRes.json();
    assert(buyerConvListData.success && buyerConvListData.data?.length === 1, 'Buyer sees 1 conversation in list');
    const buyerConvItem = buyerConvListData.data[0];
    assert(buyerConvItem.unreadCount === 1, 'Conversation displays unreadCount = 1 for Buyer');
    assert(buyerConvItem.otherUser?.name === 'Kisan Test Farmer', 'Conversation otherUser correctly populated as Farmer');

    // 8. Verify Chat Messages are separated from Notifications
    // Chat icon unread count is 1, but notification bell does NOT show chat messages
    const buyerUnreadMsgRes1 = await fetch(`${baseUrl}/messages/unread-count`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerUnreadMsgData1 = await buyerUnreadMsgRes1.json();
    assert(buyerUnreadMsgData1.unreadCount === 1, 'Buyer chat icon badge displays unreadCount = 1');

    const buyerNotifCountRes = await fetch(`${baseUrl}/notifications/unread-count`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerNotifCountData = await buyerNotifCountRes.json();
    assert(buyerNotifCountData.unreadCount === 0, 'Notification bell unread count is 0 (chat message NOT in bell)');

    const buyerNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerNotifsData = await buyerNotifsRes.json();
    const msgNotification = buyerNotifsData.data?.find((n) => n.type === 'MESSAGE');
    assert(!msgNotification, 'Chat message notification is NOT displayed in notification bell dropdown');

    // 9. Buyer opens conversation: loads messages and marks them as read
    const buyerOpenConvRes = await fetch(`${baseUrl}/messages/conversations/${conversationId}`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerOpenConvData = await buyerOpenConvRes.json();
    assert(buyerOpenConvRes.ok && buyerOpenConvData.success, 'Buyer loaded conversation messages');
    assert(buyerOpenConvData.data?.length === 1, 'Loaded 1 message in conversation');

    // 10. Verify message is now marked as read in MongoDB
    const updatedMsg = await Message.findById(sendMsgData.data._id);
    assert(updatedMsg.isRead === true, 'Message isRead is now true in MongoDB');

    // 11. Buyer re-checks unread message count (should be 0)
    const buyerUnreadMsgRes2 = await fetch(`${baseUrl}/messages/unread-count`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const buyerUnreadMsgData2 = await buyerUnreadMsgRes2.json();
    assert(buyerUnreadMsgData2.unreadCount === 0, 'Buyer unread message count is now 0 after reading');

    // 12. Buyer replies to Farmer
    const replyRes = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        conversationId,
        recipientId: farmerId,
        text: 'Interested! What is your expected price per quintal?',
      }),
    });
    const replyData = await replyRes.json();
    assert(replyRes.ok && replyData.success, 'Buyer successfully sent reply message');

    // 13. Farmer checks conversation messages: verifies reply is present
    const farmerOpenConvRes = await fetch(`${baseUrl}/messages/conversations/${conversationId}`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerOpenConvData = await farmerOpenConvRes.json();
    assert(farmerOpenConvData.data?.length === 2, 'Farmer sees 2 messages in conversation');
    assert(farmerOpenConvData.data[1].text.includes('expected price'), 'Reply message verified');

    // 14. Verify Farmer chat badge is updated, but notification bell does NOT show chat message
    const farmerUnreadMsgRes = await fetch(`${baseUrl}/messages/unread-count`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerUnreadMsgData = await farmerUnreadMsgRes.json();
    assert(farmerUnreadMsgData.unreadCount === 0, 'Farmer unread count is 0 after opening conversation');

    const farmerNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerNotifsData = await farmerNotifsRes.json();
    const farmerMsgNotif = farmerNotifsData.data?.find((n) => n.type === 'MESSAGE');
    assert(!farmerMsgNotif, 'Farmer notification bell does NOT contain chat message notification');

    // 15. Buyer tests markAllNotificationsAsRead
    const markAllRes = await fetch(`${baseUrl}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: buyerHeaders,
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.ok && markAllData.success, 'markAllNotificationsAsRead returned success');

    const finalBuyerNotifCountRes = await fetch(`${baseUrl}/notifications/unread-count`, {
      method: 'GET',
      headers: buyerHeaders,
    });
    const finalBuyerNotifCountData = await finalBuyerNotifCountRes.json();
    assert(finalBuyerNotifCountData.unreadCount === 0, 'Final buyer unread notification count is 0');

    // Cleanup test data
    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);
    await Notification.deleteMany({ $or: [{ recipient: farmerId }, { recipient: buyerId }] });
    await User.deleteMany({ _id: { $in: [farmerId, buyerId] } });
    console.log('✓ Cleaned up test database records');
  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log('====================================================');
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runMessagingAndNotificationTests();
