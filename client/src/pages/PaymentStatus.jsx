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
} from 'lucide-react';
import {
  getTransportPaymentStatus,
  getTransportBookings,
  updateGatewayRefundStatus,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();

  const selectedTransportId = routeId || searchParams.get('transportId') || searchParams.get('id');

  const [transport, setTransport] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [myTransports, setMyTransports] = useState([]);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const pollTimerRef = useRef(null);

  // Fetch transport payment status from backend with gateway response
  const fetchPaymentStatus = useCallback(
    async (isInitial = false) => {
      if (!selectedTransportId) {
        setLoading(false);
        return;
      }

      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await getTransportPaymentStatus(selectedTransportId);
        if (res.success && res.data) {
          setTransport(res.data);
          setTimeline(res.timeline || []);
          setGatewayResponse(res.gatewayResponse || res.data.gatewayResponse || null);
          setLastPolledAt(new Date());
          setError(null);
        } else {
          setError(res.message || 'Could not load payment status.');
        }
      } catch (err) {
        console.error('Failed to fetch payment status:', err);
        setError(
          err.response?.data?.message || 'Failed to retrieve live payment gateway status.'
        );
      } finally {
        if (isInitial) setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedTransportId]
  );

  // Fetch all transports for current farmer so they can browse other bookings
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const res = await getTransportBookings(user?._id ? { farmer: user._id } : {});
        if (res.data) {
          setMyTransports(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user transports:', err);
      }
    };
    fetchUserBookings();
  }, [user?._id]);

  // Initial fetch on component mount or transport ID change
  useEffect(() => {
    fetchPaymentStatus(true);
  }, [fetchPaymentStatus]);

  // Requirement: Refresh refund status from backend every 5 seconds while page is open
  useEffect(() => {
    if (!selectedTransportId) return;

    pollTimerRef.current = setInterval(() => {
      fetchPaymentStatus(false);
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedTransportId, fetchPaymentStatus]);

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
  const refundStatus = transport?.refundStatus || 'NOT_APPLICABLE';
  const isFailed = refundStatus === 'REFUND_FAILED';
  const isSuccess = refundStatus === 'REFUND_SUCCESSFUL' || refundStatus === 'REFUNDED';
  const isProcessing = refundStatus === 'REFUND_PROCESSING';
  const isInitiated = refundStatus === 'REFUND_INITIATED';

  const refundAmount = transport?.refundAmount || transport?.paidAmount || transport?.totalCost || 0;
  const bookingCode = transport?._id ? `#TR-${transport._id.slice(-8).toUpperCase()}` : '—';
  const cropDisplay = transport?.cropName
    ? `${transport.cropName} (${transport.quantity || 0} Qtl)`
    : 'Consignment';

  const getStatusBadge = () => {
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
        Payment: {transport?.paymentStatus || 'PENDING'}
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Main Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Connecting to Payment Gateway...</p>
            <p className="text-xs text-slate-400">Verifying transaction reference and refund ledger</p>
          </div>
        ) : !selectedTransportId || !transport ? (
          /* Empty / Selection State */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select a Transport Booking to Track</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Choose a transport booking below to inspect its live payment and refund lifecycle.
              </p>
            </div>

            {myTransports.length > 0 ? (
              <div className="max-w-xl mx-auto space-y-2 text-left">
                {myTransports.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => navigate(`/payment-status?transportId=${t._id}`)}
                    className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {t.cropName || 'Crop'} ({t.quantity || 0} Qtl)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ID: #TR-{t._id.slice(-6).toUpperCase()} • Fare: ₹{t.totalCost} • {t.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {t.refundStatus || t.paymentStatus}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No transport bookings found for this account.</p>
            )}
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
                {isSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-emerald-950">
                        Refund Completed Successfully!
                      </strong>
                      The refund of ₹{refundAmount} has been credited to your original payment method (
                      {transport.paymentMethod || 'Online Bank Account'}).
                      {transport.refundTransactionId && (
                        <div className="font-mono text-[11px] text-emerald-800 mt-1">
                          Refund Reference: {transport.refundTransactionId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900 text-xs">
                    <Loader2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                    <div>
                      <strong className="block font-bold text-blue-950">
                        Refund Processing in Progress
                      </strong>
                      The payment gateway has accepted your refund request. Banking clearing network is currently settling the transaction. This page will automatically update once confirmed.
                    </div>
                  </div>
                )}

                {isInitiated && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-amber-950">
                        Refund Request Initiated
                      </strong>
                      Your transport booking was cancelled/rejected. The refund has been registered with the payment gateway switch and is queued for bank settlement.
                    </div>
                  </div>
                )}

                {isFailed && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-rose-950">
                        Refund Failed
                      </strong>
                      The payment gateway or beneficiary bank declined the refund.
                      <div className="mt-1 text-rose-800 font-medium">
                        Reason: {transport.refundReason || 'Beneficiary bank technical decline.'}
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
                      This transport booking was placed with {transport.paymentMethod || 'Cash on Delivery (COD)'}. No online payment was deducted, so no online refund is required.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Refund Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Refund Lifecycle Timeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stage-by-stage status directly from payment gateway response
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  3 Stages
                </span>
              </div>

              {/* Timeline Flow */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Refund Initiated */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                      isInitiated || isProcessing || isSuccess || isFailed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900">1. Refund Initiated</h3>
                      {transport.refundInitiatedAt && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(transport.refundInitiatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Cancellation/rejection confirmed. Refund request registered with payment gateway switch.
                    </p>
                    {transport.refundTransactionId && (
                      <div className="mt-2 text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 w-fit">
                        Transaction Ref: {transport.refundTransactionId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Refund Processing */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                      isSuccess
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isProcessing
                        ? 'bg-blue-600 text-white shadow-md animate-pulse'
                        : isFailed
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : isFailed ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-xl border ${
                      isProcessing
                        ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-100'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900">2. Refund Processing</h3>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {isProcessing ? 'In Progress' : isSuccess ? 'Completed' : isFailed ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Payment gateway transmits clearing batch to beneficiary bank network (NPCI / UPI / Card issuer).
                    </p>
                    {gatewayResponse?.gatewayMessage && (
                      <div className="mt-2 text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 w-fit flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Gateway: {gatewayResponse.gatewayMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Refund Successful OR Refund Failed */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                      isSuccess
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isFailed
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isFailed ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-xl border ${
                      isSuccess
                        ? 'bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-100'
                        : isFailed
                        ? 'bg-rose-50/60 border-rose-200 ring-2 ring-rose-100'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3
                        className={`text-xs font-bold ${
                          isFailed ? 'text-rose-900' : isSuccess ? 'text-emerald-950' : 'text-slate-900'
                        }`}
                      >
                        {isFailed ? '3. Refund Failed' : '3. Refund Successful'}
                      </h3>
                      {transport.refundCompletedAt && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(transport.refundCompletedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {isFailed
                        ? transport.refundReason || 'Gateway failed to credit source account.'
                        : `Amount of ₹${refundAmount} successfully credited back to original payment method.`}
                    </p>
                    {gatewayResponse?.bankArn && (
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
                    {transport.paymentMethod || 'Online Payment'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Original Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {transport.transactionReference || 'TR-ONLINE-' + transport._id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Pickup Location</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport.pickupLocation || 'Farm Gate'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Destination Mandi</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport.destination || 'Mandi Yard'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Transporter</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {transport.transporter?.name || 'Assigned Transporter'}
                    {transport.transporter?.vehicleNumber && ` (${transport.transporter.vehicleNumber})`}
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
