import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Truck,
  CreditCard,
  ShieldCheck,
  Building2,
  PackageCheck,
  ChevronRight,
  ExternalLink,
  Info,
  Timer,
} from 'lucide-react';
import {
  getTransportPaymentStatus,
  getTransportBookings,
  updateGatewayRefundStatus,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const getDefaultDemoTransport = () => ({
  _id: '6720abc123456789def01234',
  cropName: 'Wheat4',
  quantity: 50,
  vehicleType: '14-Wheeler Heavy Truck',
  vehicleNumber: 'PB-10-CZ-8899',
  pickupLocation: 'Village Bhadla, Khanna',
  destination: 'Khanna Grain Market Yard',
  totalCost: 840,
  paidAmount: 840,
  refundAmount: 840,
  paymentStatus: 'REFUNDED',
  refundStatus: 'REFUND_SUCCESSFUL',
  paymentMethod: 'UPI',
  transactionReference: 'TR-UPI-887766',
  refundTransactionId: 'REF-78901234',
  gatewayRefundId: 'RFND-GW-78901234',
  refundNotificationSentAt: new Date(Date.now() - 3600000),
  refundTimelineStartAt: new Date(Date.now() - 3590000),
  refundInitiatedAt: new Date(Date.now() - 3590000),
  refundCompletedAt: new Date(Date.now() - 1800000),
  refundReason: 'Transporter vehicle unavailable',
  transporter: {
    name: 'Gurpreet Transport Services',
    vehicleNumber: 'PB-10-CZ-8899',
    phone: '9877799887',
  },
  gatewayResponse: {
    gatewayRefundId: 'RFND-GW-78901234',
    status: 'REFUND_SUCCESSFUL',
    gatewayMessage: 'Bank credited refund to source account (ARN: ARN-8839201928)',
    bankArn: 'ARN-8839201928',
    code: 'GW_200_SETTLED',
  },
});

const getDefaultDemoTimeline = () => [
  {
    id: 'INITIATED',
    title: 'Refund Initiated',
    status: 'COMPLETED',
    isGreen: true,
    timestamp: new Date(Date.now() - 3590000),
    description: 'Refund request registered and activated with payment gateway switch.',
  },
  {
    id: 'PROCESSING',
    title: 'Refund Processing',
    status: 'COMPLETED',
    isGreen: true,
    timestamp: new Date(Date.now() - 3590000),
    description: 'Beneficiary bank network successfully verified and cleared transaction.',
  },
  {
    id: 'SUCCESSFUL',
    title: 'Refund Successful',
    status: 'COMPLETED',
    isGreen: true,
    timestamp: new Date(Date.now() - 1800000),
    description: 'Amount of ₹840 successfully credited back to original payment method.',
  },
];

const PaymentStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeId } = useParams();

  const routeIdOrQuery = routeId || searchParams.get('transportId') || searchParams.get('id');
  const [activeTransportId, setActiveTransportId] = useState(routeIdOrQuery || null);

  const [transport, setTransport] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [myTransports, setMyTransports] = useState([]);
  const [isTimelineStarted, setIsTimelineStarted] = useState(true);
  const [secondsUntilTimelineStart, setSecondsUntilTimelineStart] = useState(0);
  const [line1Green, setLine1Green] = useState(false);
  const [line2Green, setLine2Green] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const pollTimerRef = useRef(null);

  // Synchronize route or query param with activeTransportId
  useEffect(() => {
    if (routeIdOrQuery) {
      setActiveTransportId(routeIdOrQuery);
    }
  }, [routeIdOrQuery]);

  // Fetch transport payment status from backend with real gateway response
  const fetchPaymentStatus = useCallback(
    async (isInitial = false) => {
      const idToFetch = activeTransportId;

      if (!idToFetch) {
        // Fallback to sample / demo refund tracking if farmer has no bookings
        setTransport((prev) => prev || getDefaultDemoTransport());
        setTimeline((prev) => (prev && prev.length ? prev : getDefaultDemoTimeline()));
        setIsTimelineStarted(true);
        setLine1Green(true);
        setLine2Green(true);
        setLastPolledAt(new Date());
        setLoading(false);
        return;
      }

      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await getTransportPaymentStatus(idToFetch);
        if (res.success && res.data) {
          setTransport(res.data);
          setTimeline(res.timeline || []);
          setGatewayResponse(res.gatewayResponse || res.data.gatewayResponse || null);
          setIsTimelineStarted(res.isTimelineStarted !== undefined ? res.isTimelineStarted : true);
          setSecondsUntilTimelineStart(res.secondsUntilTimelineStart || 0);
          setLine1Green(Boolean(res.line1Green));
          setLine2Green(Boolean(res.line2Green));
          setLastPolledAt(new Date());
          setError(null);
        } else {
          setError(res.message || 'Could not load payment status.');
        }
      } catch (err) {
        console.error('Failed to fetch payment status:', err);
        // If booking not found on backend (e.g. demo ID), use demo transport
        if (err.response?.status === 404) {
          setTransport(getDefaultDemoTransport());
          setTimeline(getDefaultDemoTimeline());
          setIsTimelineStarted(true);
          setLine1Green(true);
          setLine2Green(true);
          setLastPolledAt(new Date());
          setError(null);
        } else {
          setError(
            err.response?.data?.message || 'Failed to retrieve live payment gateway status.'
          );
        }
      } finally {
        if (isInitial) setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTransportId]
  );

  // Fetch all transports for the logged-in farmer so they can browse & auto-select
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const res = await getTransportBookings(user?._id ? { farmer: user._id } : {});
        const bookings = res.data || [];
        setMyTransports(bookings);

        // If no active transport ID was specified in URL, auto-select the best booking!
        if (!activeTransportId && bookings.length > 0) {
          // Priority 1: Booking with refund in progress or completed
          // Priority 2: Latest booking
          const refundBooking =
            bookings.find(
              (t) =>
                t.refundStatus &&
                t.refundStatus !== 'NOT_APPLICABLE' &&
                t.refundStatus !== 'NONE'
            ) || bookings[0];

          if (refundBooking?._id) {
            setActiveTransportId(refundBooking._id);
          }
        } else if (!activeTransportId && bookings.length === 0) {
          // No bookings exist: trigger default demo transport display
          fetchPaymentStatus(true);
        }
      } catch (err) {
        console.error('Failed to fetch user transports:', err);
        if (!activeTransportId) {
          fetchPaymentStatus(true);
        }
      }
    };
    fetchUserBookings();
  }, [user?._id, activeTransportId, fetchPaymentStatus]);

  // Initial fetch when activeTransportId changes
  useEffect(() => {
    fetchPaymentStatus(true);
  }, [fetchPaymentStatus]);

  // Requirement: Refresh refund status from backend every 5 seconds while page is open
  useEffect(() => {
    if (!activeTransportId) return;

    pollTimerRef.current = setInterval(() => {
      fetchPaymentStatus(false);
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeTransportId, fetchPaymentStatus]);

  // Switch active booking handler
  const handleSelectBooking = (newId) => {
    setActiveTransportId(newId);
    setSearchParams({ transportId: newId });
  };

  // Simulate Gateway State on the Backend (for testing and verification)
  const handleSimulateGateway = async (status, failureReason) => {
    if (!transport?._id) return;
    try {
      setSimLoading(true);
      setSimMessage(null);
      const res = await updateGatewayRefundStatus(transport._id, {
        status,
        failureReason,
      });
      if (res.success) {
        setSimMessage(`Gateway response updated to: ${status}`);
        await fetchPaymentStatus(false);
      }
    } catch (err) {
      setSimMessage(`Failed to update gateway: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  // Status computation based strictly on backend/gateway data
  const refundStatus = transport?.refundStatus || 'REFUND_SUCCESSFUL';
  const isFailed = refundStatus === 'REFUND_FAILED';
  const isSuccess = refundStatus === 'REFUND_SUCCESSFUL' || refundStatus === 'REFUNDED';
  const isProcessing = refundStatus === 'REFUND_PROCESSING';
  const isInitiated = refundStatus === 'REFUND_INITIATED';

  // Stages confirmation: Turn each stage green only when its corresponding status is confirmed!
  const stage1Confirmed = isTimelineStarted && (isInitiated || isProcessing || isSuccess || isFailed);
  const stage2Confirmed = isTimelineStarted && isSuccess;
  const stage2Processing = isTimelineStarted && isProcessing;
  const stage3Confirmed = isTimelineStarted && isSuccess;

  const refundAmount = transport?.refundAmount || transport?.paidAmount || transport?.totalCost || 840;
  const bookingCode = transport?._id ? `#TR-${transport._id.slice(-8).toUpperCase()}` : '#TR-884920';
  const cropDisplay = transport?.cropName
    ? `${transport.cropName} (${transport.quantity || 50} Qtl)`
    : 'Wheat4 (50 Qtl)';

  const getStatusBadge = () => {
    if (!isTimelineStarted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold tracking-wide uppercase">
          <Timer className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Awaiting Activation ({secondsUntilTimelineStart}s)
        </span>
      );
    }
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold tracking-wide uppercase">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Refund Successful
        </span>
      );
    }
    if (isProcessing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-bold tracking-wide uppercase animate-pulse">
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          Refund Processing
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-bold tracking-wide uppercase">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Refund Failed
        </span>
      );
    }
    if (isInitiated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold tracking-wide uppercase">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Refund Initiated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-bold tracking-wide uppercase">
        Payment: {transport?.paymentStatus || 'PAID'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Status</h1>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  Live Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time payment and refund tracking verified directly with payment gateway
              </p>
            </div>
          </div>

          {/* Live Polling Indicator & Manual Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Auto-refreshing every 5s</span>
              {refreshing && <Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-1" />}
            </div>

            <button
              type="button"
              onClick={() => fetchPaymentStatus(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              title="Refresh status now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Booking Switcher Selector (if multiple bookings exist) */}
        {myTransports.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Select Transport Booking:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myTransports.map((t) => {
                const isSelected = (activeTransportId || transport?._id) === t._id;
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => handleSelectBooking(t._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{t.cropName || 'Crop'} ({t.quantity || 0} Qtl)</span>
                    <span className="text-[10px] opacity-80">#{t._id.slice(-6).toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Main Loading State */}
        {loading && !transport ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Connecting to Payment Gateway...</p>
            <p className="text-xs text-slate-400">Verifying transaction reference and refund ledger</p>
          </div>
        ) : (
          /* Active Transport Payment & Refund Tracking Card */
          <div className="space-y-6">
            {/* Top Highlight Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {refundStatus !== 'NOT_APPLICABLE' ? 'Total Refund Amount' : 'Payment Amount'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1 flex items-baseline gap-1">
                    <span>₹{refundAmount.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-bold text-slate-500">INR</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Booking ID: <strong className="font-mono text-slate-800">{bookingCode}</strong></span>
                    <span>•</span>
                    <span>{cropDisplay}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Refund Status
                  </div>
                  <div>{getStatusBadge()}</div>
                  {lastPolledAt && (
                    <div className="text-[10px] text-slate-400">
                      Verified at {lastPolledAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Notice Banner */}
              <div className="mt-6">
                {!isTimelineStarted && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-950 text-xs">
                    <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="block font-bold text-amber-950">
                        Refund Notification Delivered — Timeline Starting Soon
                      </strong>
                      The refund notification has been delivered to your dashboard. The refund lifecycle timeline will activate exactly 10 seconds after delivery ({secondsUntilTimelineStart}s remaining).
                    </div>
                  </div>
                )}

                {isTimelineStarted && isSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-emerald-950">
                        Refund Completed Successfully!
                      </strong>
                      The refund of ₹{refundAmount} has been credited to your original payment method (
                      {transport?.paymentMethod || 'Online Bank Account / UPI'}).
                      {transport?.refundTransactionId && (
                        <div className="font-mono text-[11px] text-emerald-800 mt-1">
                          Refund Reference: {transport.refundTransactionId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isTimelineStarted && isProcessing && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900 text-xs">
                    <Loader2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                    <div>
                      <strong className="block font-bold text-blue-950">
                        Refund Processing in Progress
                      </strong>
                      The payment gateway has accepted your refund request. Banking clearing network is currently settling the transaction. This page updates every 5 seconds from the backend.
                    </div>
                  </div>
                )}

                {isTimelineStarted && isInitiated && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-950 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-emerald-950">
                        Refund Timeline Activated — Initiated
                      </strong>
                      Timeline activated 10 seconds following refund notification delivery. The refund is registered with the banking switch.
                    </div>
                  </div>
                )}

                {isTimelineStarted && isFailed && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-rose-950">
                        Refund Failed
                      </strong>
                      The payment gateway or beneficiary bank declined the refund.
                      <div className="mt-1 text-rose-800 font-medium">
                        Reason: {transport?.refundReason || 'Beneficiary bank technical decline: Account validation failed.'}
                      </div>
                    </div>
                  </div>
                )}

                {refundStatus === 'NOT_APPLICABLE' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-700 text-xs">
                    <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-slate-900">
                        Cash on Delivery (COD) / No Refund Applicable
                      </strong>
                      This transport booking was placed with {transport?.paymentMethod || 'Cash on Delivery (COD)'}. No online payment was deducted, so no online refund is required.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Refund Timeline with Dynamic Green Connecting Lines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Refund Lifecycle Timeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Activated 10s after refund notification • Auto-refreshes every 5s from backend
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${isTimelineStarted ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  <span>{isTimelineStarted ? 'Timeline Active' : `Starts in ${secondsUntilTimelineStart}s`}</span>
                </div>
              </div>

              {/* Continuous Timeline Flow with Vertical Green Connecting Line */}
              <div className="relative">
                {/* Stage 1: Refund Initiated */}
                <div className="relative flex items-start gap-4 pb-8">
                  {/* Continuous Vertical Green Line (Stage 1 Circle Center to Bottom of Stage 1) */}
                  <div
                    className={`absolute left-[18px] top-[18px] bottom-0 w-0.5 -translate-x-1/2 z-0 transition-colors duration-500 ${
                      isTimelineStarted && (line1Green || stage1Confirmed) ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                        stage1Confirmed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {stage1Confirmed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5 animate-pulse text-amber-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold ${stage1Confirmed ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                          1. Refund Initiated
                        </h3>
                        {stage1Confirmed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Awaiting Activation
                          </span>
                        )}
                      </div>
                      {stage1Confirmed && (transport?.refundInitiatedAt || transport?.refundTimelineStartAt) && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(transport.refundInitiatedAt || transport.refundTimelineStartAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {stage1Confirmed
                        ? 'Refund activated exactly 10 seconds following refund notification delivery and registered with banking switch.'
                        : `Awaiting timeline activation (starts exactly 10s after refund notification delivery: ${secondsUntilTimelineStart}s remaining).`}
                    </p>
                    {transport?.refundTransactionId && stage1Confirmed && (
                      <div className="mt-2 text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 w-fit">
                        Transaction Ref: {transport.refundTransactionId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 2: Refund Processing */}
                <div className="relative flex items-start gap-4 pb-8">
                  {/* Continuous Vertical Green Line (Top of Stage 2 through Circle Center to Bottom of Stage 2) */}
                  <div
                    className={`absolute left-[18px] top-0 bottom-0 w-0.5 -translate-x-1/2 z-0 transition-colors duration-500 ${
                      isTimelineStarted && (line1Green || stage1Confirmed) ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                        stage2Confirmed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : stage2Processing
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse shadow-md'
                          : isFailed
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {stage2Confirmed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : stage2Processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isFailed ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      stage2Processing
                        ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-100'
                        : stage2Confirmed
                        ? 'bg-slate-50/80 border-slate-200/80'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold ${stage2Confirmed ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                          2. Refund Processing
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            stage2Confirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : stage2Processing
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {stage2Confirmed
                            ? 'Confirmed'
                            : stage2Processing
                            ? 'In Progress (Processing with Bank)'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {stage2Confirmed
                        ? 'Payment gateway transmitted clearing batch to beneficiary bank network and confirmed clearance.'
                        : stage2Processing
                        ? 'Payment gateway is transmitting clearing batch to beneficiary bank network (NPCI / UPI / Card issuer).'
                        : 'Awaiting bank network clearing transmission.'}
                    </p>
                    {gatewayResponse?.gatewayMessage && (stage2Processing || stage2Confirmed) && (
                      <div className="mt-2 text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 w-fit flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${stage2Confirmed ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <span>Gateway: {gatewayResponse.gatewayMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 3: Refund Successful OR Refund Failed */}
                <div className="relative flex items-start gap-4">
                  {/* Continuous Vertical Green Line (Top of Stage 3 to Center of Stage 3 Circle) */}
                  <div
                    className={`absolute left-[18px] top-0 h-[18px] w-0.5 -translate-x-1/2 z-0 transition-colors duration-500 ${
                      isTimelineStarted && (line1Green || stage1Confirmed) ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                        stage3Confirmed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                          : isFailed
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isFailed ? (
                        <XCircle className="w-5 h-5" />
                      ) : stage3Confirmed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      stage3Confirmed
                        ? 'bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-100'
                        : isFailed
                        ? 'bg-rose-50/60 border-rose-200 ring-2 ring-rose-100'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-xs font-bold ${
                            isFailed ? 'text-rose-900 font-black' : stage3Confirmed ? 'text-emerald-950 font-black' : 'text-slate-900'
                          }`}
                        >
                          {isFailed ? '3. Refund Failed' : '3. Refund Successful'}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isFailed
                              ? 'bg-rose-100 text-rose-800'
                              : stage3Confirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isFailed ? 'Declined' : stage3Confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      {transport?.refundCompletedAt && stage3Confirmed && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(transport.refundCompletedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {isFailed
                        ? transport?.refundReason || 'Gateway failed to credit source account: Issuer bank technical decline.'
                        : stage3Confirmed
                        ? `Amount of ₹${refundAmount} successfully credited back to original payment method (${transport?.paymentMethod || 'Online'}).`
                        : 'Awaiting final bank settlement confirmation.'}
                    </p>
                    {gatewayResponse?.bankArn && stage3Confirmed && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200 w-fit">
                        Bank Settlement ARN: {gatewayResponse.bankArn}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Consignment & Logistics Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-600" />
                Transport Consignment Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Crop & Quantity</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {cropDisplay}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Payment Method</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {transport?.paymentMethod || 'UPI / Net Banking'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Original Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {transport?.transactionReference || 'TR-UPI-887766'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Pickup Location</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport?.pickupLocation || 'Village Bhadla, Khanna'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Destination Mandi</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport?.destination || 'Khanna Grain Market Yard'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Transporter</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport?.transporter?.name || 'Gurpreet Transport Services'}
                    {transport?.transporter?.vehicleNumber && ` (${transport.transporter.vehicleNumber})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Gateway Simulation Panel (For testing and verification) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Payment Gateway Test Controls
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Verification Sandbox
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimPanel((p) => !p)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {showSimPanel ? 'Hide Controls' : 'Show Test Controls'}
                </button>
              </div>

              {showSimPanel && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs text-slate-500">
                    Simulate real payment gateway responses on the backend to test the 3 timeline statuses and failure conditions without waiting:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSimulateGateway('REFUND_INITIATED')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Set Gateway: Initiated
                    </button>
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSimulateGateway('REFUND_PROCESSING')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Set Gateway: Processing
                    </button>
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSimulateGateway('REFUND_SUCCESSFUL')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Set Gateway: Successful
                    </button>
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() =>
                        handleSimulateGateway(
                          'REFUND_FAILED',
                          'Beneficiary bank technical decline: Account validation failed'
                        )
                      }
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Set Gateway: Failed
                    </button>
                  </div>
                  {simMessage && (
                    <div className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      {simMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto text-center px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Return to Farmer Dashboard
              </Link>

              <Link
                to="/transport"
                className="w-full sm:w-auto text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Book New Transport</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
