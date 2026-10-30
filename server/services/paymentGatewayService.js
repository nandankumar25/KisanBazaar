/**
 * Payment Gateway Service for KisanBazaar
 * Handles transport freight payment refunds, gateway lifecycle simulation,
 * and live gateway response status checks.
 */

/**
 * Update existing refund notification from "Refund Initiated" to "Transport Refund Successful"
 * when refund is confirmed from payment gateway.
 */
const updateRefundSuccessNotification = async (transport) => {
  try {
    if (!transport || !transport._id) return;
    const Notification = require('../models/Notification');

    const farmerId = transport.farmer?._id || transport.farmer;
    if (!farmerId) return;

    const cropName = transport.cropName || (transport.cropLot && transport.cropLot.cropName) || 'Wheat4';
    const quantity = transport.quantity || 50;
    const refundAmount = transport.refundAmount || transport.paidAmount || transport.totalCost || 840;
    const actionWord = (transport.status === 'CANCELLED' || String(transport.cancellationReason || '').trim())
      ? 'cancelled'
      : 'rejected';

    const title = 'Transport Refund Successful';
    const message = `Your transport booking for ${cropName} (${quantity} qtl) has been ${actionWord}. Your refund of ₹${refundAmount} has been successfully credited to your original payment method.`;

    const existingNotifs = await Notification.find({
      recipient: farmerId,
      type: 'TRANSPORT_REFUND',
      relatedTransport: transport._id,
    });

    if (existingNotifs && existingNotifs.length > 0) {
      await Notification.updateMany(
        {
          recipient: farmerId,
          type: 'TRANSPORT_REFUND',
          relatedTransport: transport._id,
        },
        {
          $set: {
            title,
            message,
          },
        }
      );
    } else {
      await Notification.create({
        recipient: farmerId,
        sender: transport.transporter?.user || transport.transporter || farmerId,
        type: 'TRANSPORT_REFUND',
        title,
        message,
        link: `/payment-status?transportId=${transport._id}`,
        relatedTransport: transport._id,
      });
    }
  } catch (err) {
    console.error('Failed to update refund success notification:', err.message);
  }
};

const initiateRefund = async (transport, reason = 'Transport booking cancelled / rejected') => {
  if (!transport) throw new Error('Transport booking record is required');

  const refundAmount = Number(transport.paidAmount) || Number(transport.totalCost) || 0;
  const refundTxId = transport.refundTransactionId || `REF-${Date.now().toString().slice(-8)}`;
  const gatewayRefundId = transport.gatewayRefundId || `RFND-GW-${Date.now().toString().slice(-8)}`;

  transport.refundAmount = refundAmount;
  transport.refundTransactionId = refundTxId;
  transport.gatewayRefundId = gatewayRefundId;
  transport.refundStatus = 'REFUND_INITIATED';
  transport.paymentGatewayStatus = 'REFUND_INITIATED';
  transport.paymentStatus = 'REFUNDED';
  transport.refundInitiatedAt = transport.refundInitiatedAt || new Date();
  transport.refundReason = reason;
  transport.gatewayResponse = {
    gatewayRefundId,
    status: 'REFUND_INITIATED',
    gatewayMessage: 'Refund registered with banking switch. Awaiting settlement batch.',
    code: 'GW_201_ACCEPTED',
    updatedAt: new Date(),
  };

  await transport.save();
  return transport;
};

const checkRefundStatus = async (transport) => {
  if (!transport) return null;

  // Not applicable or non-refundable bookings
  if (transport.refundStatus === 'NOT_APPLICABLE') {
    return {
      status: transport.refundStatus,
      paymentGatewayStatus: transport.paymentGatewayStatus,
      gatewayResponse: transport.gatewayResponse,
      isTimelineStarted: false,
    };
  }

  // If a forced status was explicitly set via gateway webhook/test endpoint, preserve it
  if (transport.gatewayResponse?.forcedStatus) {
    return {
      status: transport.refundStatus,
      paymentGatewayStatus: transport.paymentGatewayStatus,
      gatewayResponse: transport.gatewayResponse,
      isTimelineStarted: true,
    };
  }

  // If already failed, do not advance
  if (transport.refundStatus === 'REFUND_FAILED') {
    return {
      status: 'REFUND_FAILED',
      paymentGatewayStatus: transport.paymentGatewayStatus,
      gatewayResponse: transport.gatewayResponse,
      isTimelineStarted: true,
    };
  }

  // Check if timeline is waiting for the 10 seconds post-refund-notification delivery
  if (transport.refundTimelineStartAt) {
    const now = Date.now();
    const targetStart = new Date(transport.refundTimelineStartAt).getTime();
    if (now < targetStart) {
      // Timeline not started yet (waiting 10 seconds after notification delivery)
      return {
        status: transport.refundStatus,
        paymentGatewayStatus: 'AWAITING_ACTIVATION',
        gatewayResponse: transport.gatewayResponse,
        isTimelineStarted: false,
        secondsUntilTimelineStart: Math.ceil((targetStart - now) / 1000),
      };
    }
  }

  // If already successful, ensure notification is updated and return current record
  if (transport.refundStatus === 'REFUND_SUCCESSFUL' || transport.refundStatus === 'REFUNDED') {
    await updateRefundSuccessNotification(transport);
    return {
      status: 'REFUND_SUCCESSFUL',
      paymentGatewayStatus: transport.paymentGatewayStatus || 'REFUND_SUCCESSFUL',
      gatewayResponse: transport.gatewayResponse,
      isTimelineStarted: true,
    };
  }

  // Timeline has started: ensure refundInitiatedAt is set
  let hasChanged = false;
  if (!transport.refundInitiatedAt) {
    transport.refundInitiatedAt = new Date();
    hasChanged = true;
  }

  // Base timestamp for lifecycle progression
  const baseTimestamp = transport.refundTimelineStartAt || transport.refundInitiatedAt;
  const elapsedMs = Date.now() - new Date(baseTimestamp).getTime();
  const elapsedSec = elapsedMs / 1000;

  if (elapsedSec >= 25) {
    // 25+ seconds after timeline start: Bank clears and confirms refund settlement
    transport.refundStatus = 'REFUND_SUCCESSFUL';
    transport.paymentGatewayStatus = 'REFUND_SUCCESSFUL';
    transport.paymentStatus = 'REFUNDED';
    if (!transport.refundCompletedAt) {
      transport.refundCompletedAt = new Date();
    }
    transport.gatewayResponse = {
      ...(transport.gatewayResponse || {}),
      status: 'REFUND_SUCCESSFUL',
      gatewayMessage: 'Bank credited refund to source account. Settlement reference: ARN-' + Date.now().toString().slice(-10),
      code: 'GW_200_SETTLED',
      bankArn: 'ARN-' + Date.now().toString().slice(-10),
      settledAt: transport.refundCompletedAt,
      updatedAt: new Date(),
    };
    hasChanged = true;
  } else if (elapsedSec >= 10 && (transport.refundStatus === 'REFUND_INITIATED' || transport.refundStatus === 'REFUND_PENDING')) {
    // 10 - 25 seconds after timeline start: Transmitted to NPCI / Beneficiary Bank
    transport.refundStatus = 'REFUND_PROCESSING';
    transport.paymentGatewayStatus = 'REFUND_PROCESSING';
    transport.gatewayResponse = {
      ...(transport.gatewayResponse || {}),
      status: 'REFUND_PROCESSING',
      gatewayMessage: 'Transmitted to NPCI / Beneficiary Bank, settlement in clearing cycle.',
      code: 'GW_102_PROCESSING',
      updatedAt: new Date(),
    };
    hasChanged = true;
  } else if (transport.refundStatus === 'REFUND_PENDING') {
    transport.refundStatus = 'REFUND_INITIATED';
    transport.paymentGatewayStatus = 'REFUND_INITIATED';
    hasChanged = true;
  }

  if (hasChanged) {
    await transport.save();
    if (transport.refundStatus === 'REFUND_SUCCESSFUL' || transport.refundStatus === 'REFUNDED') {
      await updateRefundSuccessNotification(transport);
    }
  }

  return {
    status: transport.refundStatus,
    paymentGatewayStatus: transport.paymentGatewayStatus,
    gatewayResponse: transport.gatewayResponse,
    isTimelineStarted: true,
  };
};

const setGatewayRefundStatus = async (transport, { status, failureReason, gatewayMessage }) => {
  if (!transport) throw new Error('Transport booking record is required');

  const normalizedStatus = (status || '').toUpperCase();

  if (normalizedStatus === 'REFUND_FAILED') {
    transport.refundStatus = 'REFUND_FAILED';
    transport.paymentGatewayStatus = 'REFUND_FAILED';
    transport.refundReason = failureReason || 'Beneficiary bank technical decline: Account validation failed';
    transport.gatewayResponse = {
      forcedStatus: 'REFUND_FAILED',
      status: 'REFUND_FAILED',
      failureReason: transport.refundReason,
      gatewayMessage: gatewayMessage || 'Payment gateway returned error 400: Transaction declined by issuing bank',
      code: 'GW_400_FAILED',
      updatedAt: new Date(),
    };
  } else if (normalizedStatus === 'REFUND_PROCESSING') {
    transport.refundStatus = 'REFUND_PROCESSING';
    transport.paymentGatewayStatus = 'REFUND_PROCESSING';
    transport.gatewayResponse = {
      forcedStatus: 'REFUND_PROCESSING',
      status: 'REFUND_PROCESSING',
      gatewayMessage: gatewayMessage || 'Payment gateway in active settlement cycle with beneficiary bank',
      code: 'GW_102_PROCESSING',
      updatedAt: new Date(),
    };
  } else if (normalizedStatus === 'REFUND_SUCCESSFUL' || normalizedStatus === 'REFUNDED') {
    transport.refundStatus = 'REFUND_SUCCESSFUL';
    transport.paymentGatewayStatus = 'REFUND_SUCCESSFUL';
    transport.paymentStatus = 'REFUNDED';
    transport.refundCompletedAt = new Date();
    transport.gatewayResponse = {
      forcedStatus: 'REFUND_SUCCESSFUL',
      status: 'REFUND_SUCCESSFUL',
      gatewayMessage: gatewayMessage || 'Refund settled successfully with source account',
      code: 'GW_200_SETTLED',
      bankArn: 'ARN-' + Date.now().toString().slice(-10),
      settledAt: transport.refundCompletedAt,
      updatedAt: new Date(),
    };
  } else if (normalizedStatus === 'REFUND_INITIATED') {
    transport.refundStatus = 'REFUND_INITIATED';
    transport.paymentGatewayStatus = 'REFUND_INITIATED';
    transport.refundInitiatedAt = new Date();
    transport.gatewayResponse = {
      forcedStatus: 'REFUND_INITIATED',
      status: 'REFUND_INITIATED',
      gatewayMessage: gatewayMessage || 'Refund registered with banking switch. Awaiting settlement batch.',
      code: 'GW_201_ACCEPTED',
      updatedAt: new Date(),
    };
  }

  await transport.save();
  if (normalizedStatus === 'REFUND_SUCCESSFUL' || normalizedStatus === 'REFUNDED') {
    await updateRefundSuccessNotification(transport);
  }
  return transport;
};

module.exports = {
  initiateRefund,
  checkRefundStatus,
  setGatewayRefundStatus,
  updateRefundSuccessNotification,
};
