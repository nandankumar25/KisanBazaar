const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Mandi = require('../models/Mandi');
const MandiBooking = require('../models/MandiBooking');
const Transporter = require('../models/Transporter');
const Transport = require('../models/Transport');
const Notification = require('../models/Notification');

async function runTransportCancellationTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5008, resolve));
  const baseUrl = 'http://localhost:5008/api';

  console.log('====================================================');
  console.log('Transport Cancellation & Automatic Refund Test Suite');
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

  const secret = process.env.JWT_SECRET || 'kisanbazaar_jwt_secret_key_2026';

  try {
    // 0. Cleanup previous test users
    const testEmails = ['tc_farmer@test.com', 'tc_transporter@test.com'];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const userIds = existingUsers.map((u) => u._id);

    await Transport.deleteMany({ farmer: { $in: userIds } });
    await MandiBooking.deleteMany({ farmer: { $in: userIds } });
    await Transporter.deleteMany({ user: { $in: userIds } });
    await Notification.deleteMany({ $or: [{ recipient: { $in: userIds } }, { sender: { $in: userIds } }] });
    await User.deleteMany({ email: { $in: testEmails } });

    // 1. Create Farmer & Transporter users
    const farmer = await User.create({
      name: 'Balwinder Singh',
      email: 'tc_farmer@test.com',
      password: 'Password123',
      phone: '9877711223',
      role: 'FARMER',
      location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      isVerified: true,
    });
    const farmerToken = jwt.sign({ id: farmer._id }, secret, { expiresIn: '7d' });
    const farmerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${farmerToken}`,
    };

    const transporterUser = await User.create({
      name: 'Gurpreet Transport Services',
      email: 'tc_transporter@test.com',
      password: 'Password123',
      phone: '9877799887',
      role: 'TRANSPORTER',
      location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      isVerified: true,
    });
    const transporterToken = jwt.sign({ id: transporterUser._id }, secret, { expiresIn: '7d' });
    const transporterHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${transporterToken}`,
    };

    const transporterDoc = await Transporter.create({
      user: transporterUser._id,
      name: 'Gurpreet Transport Services',
      phone: '9877799887',
      vehicleType: '14-Wheeler Heavy Truck',
      vehicleNumber: 'PB-10-CZ-8899',
      capacity: 250,
      pricePerKm: 24,
      isAvailable: true,
      location: { state: 'Punjab', district: 'Ludhiana', city: 'Khanna' },
      serviceAreas: ['Ludhiana', 'Khanna', 'Patiala'],
    });

    let mandi = await Mandi.findOne({ state: 'Punjab' });
    if (!mandi) {
      mandi = await Mandi.create({
        name: 'Khanna Grain Market Yard',
        state: 'Punjab',
        district: 'Ludhiana',
        city: 'Khanna',
        operatingHours: '08:00 AM - 06:00 PM',
        cropsSupported: ['Wheat', 'Paddy'],
      });
    }

    // Create a Mandi Sale Request
    const mandiBooking = await MandiBooking.create({
      bookingNumber: `MB-TC-${Date.now().toString().slice(-6)}`,
      farmer: farmer._id,
      mandi: mandi._id,
      crop: 'Wheat4',
      quantity: 50,
      expectedPrice: 2200,
      preferredArrivalDate: new Date(Date.now() + 86400000 * 2),
      status: 'ACCEPTED',
    });
    assert(mandiBooking && mandiBooking._id, 'Mandi Sale Request created and accepted');

    // ==============================================================
    // Test 1: Farmer Books Transport with Online Payment
    // ==============================================================
    const bookRes1 = await fetch(`${baseUrl}/transports`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        farmer: farmer._id,
        transporter: transporterDoc._id,
        mandiBooking: mandiBooking._id,
        cropName: 'Wheat4',
        quantity: 50,
        vehicleType: transporterDoc.vehicleType,
        vehicleNumber: transporterDoc.vehicleNumber,
        pickupLocation: 'Village Bhadla, Khanna',
        destination: mandi.name,
        distanceKm: 35,
        totalCost: 840,
        costPerQuintal: 16.8,
        status: 'BOOKED',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        paidAmount: 840,
        transactionReference: 'TR-UPI-887766',
        paymentGatewayStatus: 'SUCCESS',
      }),
    });
    const bookData1 = await bookRes1.json();
    assert(bookRes1.ok && bookData1.success, 'Farmer successfully booked transport with Online Payment (₹840)');
    const booking1 = bookData1.data;
    assert(booking1.paymentStatus === 'PAID' && booking1.paidAmount === 840, 'Payment status is PAID with paidAmount 840');

    // ==============================================================
    // Test 2: Prevent Duplicate Active Booking for Same Mandi Request
    // ==============================================================
    const duplicateRes = await fetch(`${baseUrl}/transports`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        farmer: farmer._id,
        transporter: transporterDoc._id,
        mandiBooking: mandiBooking._id,
        cropName: 'Wheat4',
        quantity: 50,
        pickupLocation: 'Village Bhadla, Khanna',
        destination: mandi.name,
        distanceKm: 35,
        totalCost: 840,
        costPerQuintal: 16.8,
        status: 'BOOKED',
      }),
    });
    const duplicateData = await duplicateRes.json();
    assert(duplicateRes.status === 400 && !duplicateData.success, 'Duplicate active booking correctly blocked with 400 error');

    // ==============================================================
    // Test 3: Transporter Rejects Booking -> Automatic Refund Triggered
    // ==============================================================
    const rejectRes = await fetch(`${baseUrl}/transports/${booking1._id}/status`, {
      method: 'PUT',
      headers: transporterHeaders,
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'Vehicle undergoing emergency maintenance',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.ok && rejectData.success, 'Transporter rejected booking');

    const rejectedBooking = await Transport.findById(booking1._id);
    assert(rejectedBooking.status === 'REJECTED', 'Transport status is REJECTED');
    assert(
      ['REFUND_INITIATED', 'REFUND_PROCESSING', 'REFUND_SUCCESSFUL', 'REFUNDED'].includes(rejectedBooking.refundStatus),
      'Automatic refund initiated with payment gateway'
    );
    assert(rejectedBooking.refundAmount === 840, 'Refunded exact amount paid (₹840)');
    assert(rejectedBooking.refundTransactionId.startsWith('REF-'), 'Valid refundTransactionId generated');
    assert(rejectedBooking.paymentStatus === 'REFUNDED', 'Payment status updated to REFUNDED');

    // Check Farmer immediately received rejection notification
    const farmerNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerNotifsData = await farmerNotifsRes.json();
    const rejectNotif = farmerNotifsData.data?.find((n) => n.relatedTransport?.toString() === booking1._id.toString() && n.title.includes('Rejected'));
    assert(rejectNotif && rejectNotif.message.includes('Wheat4') && rejectNotif.message.includes('840'), 'Farmer received immediate rejection notification with crop and refund reference');

    // Verify refund notification is NOT sent immediately (waiting for 20s delay)
    const immediateRefundNotif = farmerNotifsData.data?.find((n) => n.type === 'TRANSPORT_REFUND');
    assert(!immediateRefundNotif, 'Delayed refund notification not yet sent immediately at 0s');

    console.log('Waiting 20.5s for delayed refund notification trigger...');
    await new Promise((resolve) => setTimeout(resolve, 20500));

    // Check Farmer received delayed refund notification after 20 seconds
    const farmerDelayedNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerDelayedNotifsData = await farmerDelayedNotifsRes.json();
    const delayedRefundNotif = farmerDelayedNotifsData.data?.find((n) => n.type === 'TRANSPORT_REFUND');
    assert(delayedRefundNotif && delayedRefundNotif.title === 'Transport Refund Initiated', 'Farmer received delayed notification with title "Transport Refund Initiated"');
    assert(
      delayedRefundNotif &&
        delayedRefundNotif.message === 'Your transport booking for Wheat4 (50 qtl) has been rejected. Your online payment refund of ₹840 has been initiated.',
      'Delayed refund notification text dynamically matches crop, quantity, and exact refund amount'
    );

    // Test Idempotency: Rejecting again should not double refund
    const secondRejectRes = await fetch(`${baseUrl}/transports/${booking1._id}/status`, {
      method: 'PUT',
      headers: transporterHeaders,
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    const secondRejectBooking = await Transport.findById(booking1._id);
    assert(secondRejectBooking.refundAmount === 840, 'Idempotency verified: refund amount unchanged on repeat rejection');

    // ==============================================================
    // Test 4: Farmer Creates New Booking with Cash on Delivery (COD)
    // ==============================================================
    const bookRes2 = await fetch(`${baseUrl}/transports`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        farmer: farmer._id,
        transporter: transporterDoc._id,
        mandiBooking: mandiBooking._id,
        cropName: 'Wheat4',
        quantity: 50,
        vehicleType: transporterDoc.vehicleType,
        vehicleNumber: transporterDoc.vehicleNumber,
        pickupLocation: 'Village Bhadla, Khanna',
        destination: mandi.name,
        distanceKm: 35,
        totalCost: 840,
        costPerQuintal: 16.8,
        status: 'BOOKED',
        paymentStatus: 'PENDING',
        paymentMethod: 'Cash on Delivery (COD)',
        paidAmount: 0,
        transactionReference: 'TR-COD-112233',
        paymentGatewayStatus: 'COD_PENDING',
      }),
    });
    const bookData2 = await bookRes2.json();
    assert(bookRes2.ok && bookData2.success, 'Farmer successfully created new booking after rejection (COD)');
    const booking2 = bookData2.data;

    // Transporter rejects COD booking -> No refund should be processed
    await fetch(`${baseUrl}/transports/${booking2._id}/status`, {
      method: 'PUT',
      headers: transporterHeaders,
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'Driver schedule conflict',
      }),
    });
    const rejectedCodBooking = await Transport.findById(booking2._id);
    assert(rejectedCodBooking.status === 'REJECTED', 'COD booking rejected');
    assert(rejectedCodBooking.refundStatus === 'NOT_APPLICABLE', 'COD refund status is NOT_APPLICABLE');
    assert(rejectedCodBooking.refundAmount === 0, 'COD refund amount is 0');

    // ==============================================================
    // Test 5: Farmer Books, Transporter Accepts, Farmer Cancels (Online Refund)
    // ==============================================================
    const bookRes3 = await fetch(`${baseUrl}/transports`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        farmer: farmer._id,
        transporter: transporterDoc._id,
        mandiBooking: mandiBooking._id,
        cropName: 'Wheat4',
        quantity: 50,
        vehicleType: transporterDoc.vehicleType,
        vehicleNumber: transporterDoc.vehicleNumber,
        pickupLocation: 'Village Bhadla, Khanna',
        destination: mandi.name,
        distanceKm: 35,
        totalCost: 840,
        costPerQuintal: 16.8,
        status: 'BOOKED',
        paymentStatus: 'PAID',
        paymentMethod: 'Net Banking',
        paidAmount: 840,
        transactionReference: 'TR-NET-554433',
      }),
    });
    const booking3 = (await bookRes3.json()).data;

    // Transporter accepts booking
    const acceptRes = await fetch(`${baseUrl}/transports/${booking3._id}/status`, {
      method: 'PUT',
      headers: transporterHeaders,
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    assert(acceptRes.ok, 'Transporter ACCEPTED the booking');

    // Farmer Cancels Transport Booking
    const cancelRes = await fetch(`${baseUrl}/transports/${booking3._id}/cancel`, {
      method: 'PUT',
      headers: farmerHeaders,
      body: JSON.stringify({
        cancellationReason: 'Selling directly at farm gate instead.',
      }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.ok && cancelData.success, 'Farmer successfully cancelled transport booking');

    const cancelledBooking = await Transport.findById(booking3._id);
    assert(cancelledBooking.status === 'CANCELLED', 'Transport status is CANCELLED');
    assert(cancelledBooking.cancellationReason.includes('farm gate'), 'Cancellation reason recorded');
    assert(cancelledBooking.cancelledAt !== null, 'Cancellation timestamp recorded');
    assert(
      ['REFUND_INITIATED', 'REFUND_PROCESSING', 'REFUND_SUCCESSFUL', 'REFUNDED'].includes(cancelledBooking.refundStatus),
      'Online payment automatically registered for refund upon cancellation'
    );
    assert(cancelledBooking.refundAmount === 840, 'Refunded full paid amount of ₹840');

    // Check Farmer immediately received cancellation notification (t = 0s)
    const farmerCancelNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerCancelNotifsData = await farmerCancelNotifsRes.json();
    const farmerCancelNotif = farmerCancelNotifsData.data?.find(
      (n) => n.relatedTransport?.toString() === booking3._id.toString() && n.type === 'TRANSPORT_CANCELLED'
    );
    assert(farmerCancelNotif && farmerCancelNotif.title.includes('Cancelled'), 'Farmer received immediate cancellation notification at 0s');

    // Verify refund notification is NOT sent immediately for cancellation (waiting 20s)
    const immediateCancelRefundNotif = farmerCancelNotifsData.data?.find(
      (n) => n.relatedTransport?.toString() === booking3._id.toString() && n.type === 'TRANSPORT_REFUND'
    );
    assert(!immediateCancelRefundNotif, 'Farmer cancellation refund notification not yet sent at 0s');

    console.log('Waiting 20.5s for cancellation delayed refund notification trigger...');
    await new Promise((resolve) => setTimeout(resolve, 20500));

    // Check Farmer received delayed refund notification after 20s
    const farmerDelayedCancelNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const farmerDelayedCancelData = await farmerDelayedCancelNotifsRes.json();
    const cancelRefundNotif = farmerDelayedCancelData.data?.find(
      (n) => n.relatedTransport?.toString() === booking3._id.toString() && n.type === 'TRANSPORT_REFUND'
    );
    assert(
      cancelRefundNotif && cancelRefundNotif.title === 'Transport Refund Initiated',
      'Farmer received delayed cancellation refund notification with title "Transport Refund Initiated"'
    );
    assert(
      cancelRefundNotif && cancelRefundNotif.message.includes('Wheat4') && cancelRefundNotif.message.includes('840'),
      'Cancellation delayed refund notification text dynamically includes crop, quantity, and ₹840'
    );

    // Check Transporter was notified about the cancellation
    const transporterNotifsRes = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: transporterHeaders,
    });
    const transporterNotifsData = await transporterNotifsRes.json();
    const cancelNotifForTransporter = transporterNotifsData.data?.find((n) => n.type === 'TRANSPORT_CANCELLED');
    assert(cancelNotifForTransporter && cancelNotifForTransporter.message.includes('farm gate'), 'Transporter received cancellation notification with reason');

    // Idempotency check: repeat cancellation is safe
    const repeatCancelRes = await fetch(`${baseUrl}/transports/${booking3._id}/cancel`, {
      method: 'PUT',
      headers: farmerHeaders,
      body: JSON.stringify({ reason: 'duplicate' }),
    });
    assert(repeatCancelRes.ok, 'Repeat cancellation request safely handled idempotently');

    // ==============================================================
    // Test 6: Completed Booking Cannot Be Cancelled
    // ==============================================================
    const bookRes4 = await fetch(`${baseUrl}/transports`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        farmer: farmer._id,
        transporter: transporterDoc._id,
        mandiBooking: mandiBooking._id,
        cropName: 'Wheat4',
        quantity: 50,
        pickupLocation: 'Village Bhadla, Khanna',
        destination: mandi.name,
        distanceKm: 35,
        totalCost: 840,
        costPerQuintal: 16.8,
        status: 'COMPLETED',
      }),
    });
    const booking4 = (await bookRes4.json()).data;

    const invalidCancelRes = await fetch(`${baseUrl}/transports/${booking4._id}/cancel`, {
      method: 'PUT',
      headers: farmerHeaders,
      body: JSON.stringify({ reason: 'Try cancel completed' }),
    });
    assert(invalidCancelRes.status === 400, 'Attempting to cancel COMPLETED transport correctly returns 400 Bad Request');

    // ==============================================================
    // Test 7: Payment Status Page Endpoint (GET /payment-status)
    // ==============================================================
    const paymentStatusRes = await fetch(`${baseUrl}/transports/${booking3._id}/payment-status`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const paymentStatusData = await paymentStatusRes.json();
    assert(paymentStatusRes.ok && paymentStatusData.success, 'GET /payment-status returns 200 OK with success');
    assert(paymentStatusData.data.cropName === 'Wheat4', 'Payment status returns accurate crop name');
    assert(paymentStatusData.data.refundAmount === 840, 'Payment status returns accurate refund amount (₹840)');
    assert(Array.isArray(paymentStatusData.timeline) && paymentStatusData.timeline.length === 3, 'Payment status contains 3-stage visual timeline');
    assert(paymentStatusData.timeline[0].title === 'Refund Initiated', 'Stage 1 title is "Refund Initiated"');
    assert(paymentStatusData.timeline[1].title === 'Refund Processing', 'Stage 2 title is "Refund Processing"');
    assert(paymentStatusData.timeline[2].title === 'Refund Successful' || paymentStatusData.timeline[2].title === 'Refund Failed', 'Stage 3 title is "Refund Successful" or "Refund Failed"');

    // ==============================================================
    // Test 8: Payment Gateway Actual Status Sync (POST /gateway-status)
    // Test that status updates according to actual gateway response,
    // not arbitrary frontend timer!
    // ==============================================================
    const gatewayFailRes = await fetch(`${baseUrl}/transports/${booking3._id}/gateway-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REFUND_FAILED',
        failureReason: 'Beneficiary bank technical decline: Account validation failed',
      }),
    });
    const gatewayFailData = await gatewayFailRes.json();
    assert(gatewayFailRes.ok && gatewayFailData.success, 'Simulated gateway response update to REFUND_FAILED');

    // Verify GET /payment-status reflects REFUND_FAILED with exact reason
    const checkFailedRes = await fetch(`${baseUrl}/transports/${booking3._id}/payment-status`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const checkFailedData = await checkFailedRes.json();
    assert(checkFailedData.data.refundStatus === 'REFUND_FAILED', 'Backend data updated to REFUND_FAILED based on gateway response');
    assert(checkFailedData.timeline[2].title === 'Refund Failed', 'Timeline stage 3 dynamically updated to "Refund Failed"');
    assert(checkFailedData.timeline[2].description.includes('technical decline'), 'Timeline stage 3 includes gateway failure reason');

    // Simulate Gateway Success
    const gatewaySuccessRes = await fetch(`${baseUrl}/transports/${booking3._id}/gateway-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REFUND_SUCCESSFUL' }),
    });
    assert(gatewaySuccessRes.ok, 'Simulated gateway response update to REFUND_SUCCESSFUL');

    const checkSuccessRes = await fetch(`${baseUrl}/transports/${booking3._id}/payment-status`, {
      method: 'GET',
      headers: farmerHeaders,
    });
    const checkSuccessData = await checkSuccessRes.json();
    assert(checkSuccessData.data.refundStatus === 'REFUND_SUCCESSFUL', 'Backend data updated to REFUND_SUCCESSFUL');
    assert(checkSuccessData.timeline[2].title === 'Refund Successful', 'Timeline stage 3 dynamically updated to "Refund Successful"');

    // Cleanup test records
    await Transport.deleteMany({ farmer: farmer._id });
    await MandiBooking.deleteMany({ farmer: farmer._id });
    await Transporter.deleteMany({ _id: transporterDoc._id });
    await Notification.deleteMany({ $or: [{ recipient: farmer._id }, { recipient: transporterUser._id }] });
    await User.deleteMany({ _id: { $in: [farmer._id, transporterUser._id] } });
    console.log('✓ Cleaned up all test database records');
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

runTransportCancellationTests();
