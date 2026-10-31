import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Truck, 
  Package, 
  IndianRupee, 
  XCircle, 
  MessageSquare, 
  TrendingUp, 
  Receipt,
  User,
  ChevronDown
} from 'lucide-react';
import ChatModal from './ChatModal';
import { useAuth } from '../context/AuthContext';
import { 
  getTransportBookings, 
  cancelTransportBooking, 
  cancelFarmerMandiBooking, 
  completeFarmerMandiBooking, 
  counterFarmerMandiBooking,
  reviewMandiBooking
} from '../services/api';

const getCropEmoji = (cropName) => {
  const map = {
    wheat: '🌾',
    rice: '🍚',
    paddy: '🌾',
    maize: '🌽',
    corn: '🌽',
    potato: '🥔',
    mustard: '🟡',
    cotton: '☁️',
    sugarcane: '🎋',
    soybean: '🫘',
    onion: '🧅',
    tomato: '🍅',
    chilli: '🌶️',
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

const MandiSaleCard = ({ booking, onRefresh }) => {
  if (!booking) return null;
  const { user } = useAuth();
  const isMandiAdmin = user?.role === 'MANDI_ADMIN';

  const {
    _id,
    bookingNumber,
    tokenNumber,
    crop,
    quantity,
    qualityGrade,
    expectedPrice,
    proposedPrice,
    acceptedPricePerQuintal,
    grossAmount,
    status = 'PENDING',
    scheduledArrivalDate,
    preferredArrivalDate,
    createdAt,
    mandi,
    farmer,
    farmerNotes,
    mandiNotes,
    paymentStatus = 'PENDING',
  } = booking;

  const [transportBooking, setTransportBooking] = useState(null);
  const [cancellingTransport, setCancellingTransport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isDelivered, setIsDelivered] = useState(status === 'COMPLETED');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState(proposedPrice || expectedPrice || '');
  const [counterQuantity, setCounterQuantity] = useState(quantity || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalRate = acceptedPricePerQuintal || proposedPrice || expectedPrice || 0;
  const estimatedTotal = grossAmount || (quantity && finalRate ? quantity * finalRate : 0);

  // Sync status
  useEffect(() => {
    setCurrentStatus(booking.status);
    const delivered = booking.status === 'COMPLETED';
    setIsDelivered(delivered);
    if (delivered) {
      setCurrentStatus('COMPLETED');
    }
  }, [booking.status]);

  // Periodic polling for linked transport booking
  const fetchTransportForBooking = async () => {
    if (!_id) return;
    try {
      const res = await getTransportBookings({ mandiBooking: _id });
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const active = res.data.find((t) => ['BOOKED', 'ACCEPTED', 'IN_TRANSIT'].includes(t.status));
        const completed = res.data.find((t) => t.status === 'COMPLETED');
        const cancelled = res.data.find((t) => t.status === 'CANCELLED');
        const record = active || completed || cancelled || res.data[0];
        setTransportBooking(record);
        if (record?.status === 'COMPLETED' || booking.status === 'COMPLETED') {
          setIsDelivered(true);
          setCurrentStatus('COMPLETED');
        }
      } else {
        setTransportBooking(null);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchTransportForBooking();
    const interval = setInterval(fetchTransportForBooking, 3000);
    return () => clearInterval(interval);
  }, [_id, currentStatus, booking.status]);

  // Cancel transport
  const handleCancelTransport = async () => {
    if (!transportBooking?._id) return;
    if (!window.confirm('Are you sure you want to cancel this transport booking for your Mandi produce?')) return;
    try {
      setCancellingTransport(true);
      const res = await cancelTransportBooking(transportBooking._id, {
        cancellationReason: 'Cancelled from Mandi sale card by farmer',
      });
      if (res.success || res.data) {
        const updated = res.data || transportBooking;
        setTransportBooking({
          ...updated,
          status: 'CANCELLED',
        });
        alert('Transport booking cancelled successfully.');
        fetchTransportForBooking();
        if (onRefresh) onRefresh();
      } else {
        alert(res.message || 'Failed to cancel transport booking.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel transport booking.');
    } finally {
      setCancellingTransport(false);
    }
  };

  // Mandi Admin Accept Offer
  const handleMandiAccept = async () => {
    if (!window.confirm('Accept this farmer crop sale offer and issue arrival gate token?')) return;
    setIsSubmitting(true);
    try {
      const res = await reviewMandiBooking(_id, {
        action: 'ACCEPT',
        tokenNumber: `TK-${Date.now().toString().slice(-4)}`,
      });
      if (res.success) {
        setCurrentStatus('ACCEPTED');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mandi Admin Reject Offer
  const handleMandiReject = async () => {
    const reason = window.prompt('Reason for rejecting this offer (optional):', 'Mandi capacity full');
    if (reason === null) return;
    setIsSubmitting(true);
    try {
      const res = await reviewMandiBooking(_id, {
        action: 'REJECT',
        rejectionReason: reason || 'Mandi capacity full',
      });
      if (res.success) {
        setCurrentStatus('REJECTED');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Mandi Sale Completed / Delivered
  const handleMarkCompleted = async () => {
    if (!window.confirm('Confirm that this crop produce has arrived at Mandi Yard and mark as Delivered?')) return;
    setIsSubmitting(true);
    try {
      const res = await completeFarmerMandiBooking(_id);
      if (res.success) {
        setIsDelivered(true);
        setCurrentStatus('COMPLETED');
        alert('Order marked as delivered successfully! Mandi procurement deal recorded.');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark Mandi sale as completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Mandi booking (Farmer only)
  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this Mandi sale request?')) return;
    setIsSubmitting(true);
    try {
      const res = await cancelFarmerMandiBooking(_id);
      if (res.success) {
        setCurrentStatus('CANCELLED');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel Mandi booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counter proposal to Mandi
  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    if (!counterPrice || counterPrice <= 0 || !counterQuantity || counterQuantity <= 0) {
      alert('Please enter valid positive numbers for price and quantity.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await counterFarmerMandiBooking(_id, {
        counterPrice: Number(counterPrice),
        counterQuantity: Number(counterQuantity),
        counterMessage,
      });
      if (res.success) {
        setShowCounterForm(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit counter proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge matching OfferCard style
  const getStatusBadge = (st) => {
    if (isDelivered || st === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Delivered</span>
        </span>
      );
    }
    switch (st) {
      case 'ACCEPTED':
      case 'SCHEDULED':
      case 'ARRIVED':
      case 'QUALITY_CHECKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accepted</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Waiting for Mandi Approval</span>
          </span>
        );
      case 'COUNTERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Countered</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const cropEmoji = getCropEmoji(crop);

  return (
    <div className="group relative bg-white rounded-3xl shadow-xs border border-slate-200/90 hover:shadow-xl hover:border-emerald-400/90 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Gradient Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 group-hover:h-2 transition-all duration-300" />

      <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: Crop Avatar + Name + Direction & Status */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100/90 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                {cropEmoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors truncate">
                    {crop || 'Wheat'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                    Grade {qualityGrade || 'A'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <span className="truncate">{mandi?.name || 'Local APMC Grain Mandi'}</span>
                  {mandi?.city && <span className="ml-1 text-slate-400">({mandi.city}, {mandi.district || mandi.state || ''})</span>}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Farmer to Mandi</span>
                </span>
                {getStatusBadge(isDelivered || currentStatus === 'COMPLETED' ? 'COMPLETED' : currentStatus)}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center font-medium">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                <span>{createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
              </span>
            </div>
          </div>

          {/* Counterparty Overview: APMC Mandi & Farmer */}
          <div className="bg-slate-50/70 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Destination APMC</span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-teal-600 shrink-0" />
                <span className="truncate">{mandi?.name || 'Mandi Yard'}</span>
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">
                {tokenNumber ? `Token: ${tokenNumber}` : (mandi?.contactPhone || 'APMC Registered')}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Seller (Farmer)</span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span className="truncate">{farmer?.name || 'Farmer'}</span>
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">
                {farmer?.phone ? `Phone: ${farmer.phone}` : 'Direct Farmgate Sale'}
              </span>
            </div>
          </div>

          {/* Pricing & Quantity Metrics */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/90 hover:bg-emerald-50 transition">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Mandi Rate
              </span>
              <div className="text-base font-black text-emerald-900 flex items-center mt-0.5 font-mono">
                <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{Number(finalRate || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs font-semibold text-emerald-700 ml-1">/ qtl</span>
              </div>
            </div>

            <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Order Quantity
              </span>
              <div className="text-base font-black text-slate-900 flex items-center mt-0.5">
                <Package className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                <span>{quantity}</span>
                <span className="text-xs font-semibold text-slate-500 ml-1">quintals</span>
              </div>
            </div>
          </div>

          {/* Scheduled Slot Info */}
          <div className="mt-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center text-slate-600">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>Arrival: <strong className="text-slate-800">{scheduledArrivalDate ? new Date(scheduledArrivalDate).toLocaleDateString('en-IN') : preferredArrivalDate ? new Date(preferredArrivalDate).toLocaleDateString('en-IN') : 'Confirmed'}</strong></span>
            </div>
            {tokenNumber && (
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-teal-800 text-[11px] shadow-2xs">
                {tokenNumber}
              </span>
            )}
          </div>

        {/* Notes from Mandi or Farmer (Collapsible) */}
        {(mandiNotes || farmerNotes) && (
          <div className="mb-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-100/70 flex items-center justify-between transition"
            >
              <span className="flex items-center text-slate-800">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Notes & Negotiation Details
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
            </button>
            {showNotes && (
              <div className="p-3 border-t border-slate-200 space-y-1.5 bg-white text-xs">
                {mandiNotes && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-teal-800">Mandi Note: </span>{mandiNotes}
                  </p>
                )}
                {farmerNotes && (
                  <p className="text-slate-600 italic">
                    <span className="font-semibold text-slate-700 not-italic">Farmer Note: </span>"{farmerNotes}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Counter Form (Farmer to Mandi) */}
        {showCounterForm && (
          <form onSubmit={handleCounterSubmit} className="mb-4 bg-purple-50 p-3.5 rounded-xl border border-purple-200">
            <h4 className="text-xs font-bold text-purple-900 mb-2 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-purple-700" /> Counter Proposal to Mandi
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] font-semibold text-purple-800 block mb-0.5">Counter Price (₹/qtl)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full text-xs p-1.5 border rounded border-slate-300 focus:ring-1 focus:ring-purple-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-purple-800 block mb-0.5">Quantity (qtl)</label>
                <input
                  type="number"
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(e.target.value)}
                  className="w-full text-xs p-1.5 border rounded border-slate-300 focus:ring-1 focus:ring-purple-500"
                  required
                  min="1"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="text-[10px] font-semibold text-purple-800 block mb-0.5">Message / Note to Mandi</label>
              <input
                type="text"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="e.g. Requesting slot adjustment or higher grade rate"
                className="w-full text-xs p-1.5 border rounded border-slate-300 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition shadow-xs"
              >
                {isSubmitting ? 'Sending...' : 'Submit Counter to Mandi'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Action Buttons: Exact OfferCard Style */}
      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {/* Message Mandi / Farmer Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold flex items-center transition border border-slate-200/80 shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>{isMandiAdmin ? 'Message Farmer' : 'Message Mandi'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* 1. Pending state actions */}
          {currentStatus === 'PENDING' && (
            <>
              {isMandiAdmin ? (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleMandiAccept}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center transition shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept Offer
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleMandiReject}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center transition"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    ⏳ Waiting for Mandi Response
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCounterForm(!showCounterForm)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCancelBooking}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold flex items-center transition border border-slate-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {/* 2. Accepted / Scheduled / In Transit state actions (Mirroring OfferCard) */}
          {(currentStatus === 'ACCEPTED' || currentStatus === 'SCHEDULED' || currentStatus === 'ARRIVED' || currentStatus === 'COMPLETED' || isDelivered) && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Mandi Admin View: Mark as Delivered button & Confirmed Deal */}
              {isMandiAdmin ? (
                <>
                  {!isDelivered && currentStatus !== 'COMPLETED' ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleMarkCompleted}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Mark as Delivered'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivered</span>
                    </span>
                  )}
                  <Link
                    to="/transactions"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Deal</span>
                  </Link>
                </>
              ) : (
                /* Farmer View */
                <>
                  {isDelivered || currentStatus === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivered</span>
                    </span>
                  ) : (
                    (() => {
                      const tStatus = transportBooking?.status;
                      if (tStatus === 'BOOKED' || tStatus === 'ACCEPTED' || tStatus === 'IN_TRANSIT') {
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                              tStatus === 'BOOKED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              Transport: {tStatus === 'BOOKED' ? 'Pending' : 'Confirmed'}
                            </span>
                            <button
                              type="button"
                              disabled={cancellingTransport}
                              onClick={handleCancelTransport}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{cancellingTransport ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          {tStatus === 'CANCELLED' && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              Transport: Cancelled
                            </span>
                          )}
                          <Link
                            to={`/transport?crop=${encodeURIComponent(crop || 'Wheat')}&quantity=${quantity || ''}&destination=${encodeURIComponent(
                              [mandi?.name, mandi?.city || mandi?.district, mandi?.state].filter(Boolean).join(', ') || 'Mandi Yard'
                            )}&distance=25&mandiBookingId=${_id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Book Transport</span>
                          </Link>
                        </div>
                      );
                    })()
                  )}

                  <Link
                    to="/transactions"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Deal</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Real-time Negotiation Chat Modal */}
      {isChatOpen && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipient={isMandiAdmin ? (farmer || { name: 'Farmer', role: 'FARMER' }) : (mandi?.mandiAdmin || { name: mandi?.name || 'Mandi Admin', role: 'MANDI_ADMIN' })}
          cropLot={{ crop, quantity, qualityGrade }}
          title={isMandiAdmin ? `Chat with Farmer ${farmer?.name || ''}` : `Chat with ${mandi?.name || 'Mandi Admin'}`}
        />
      )}
    </div>
  );
};

export default MandiSaleCard;