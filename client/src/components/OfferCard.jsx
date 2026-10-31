import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User, 
  Package, 
  IndianRupee, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Receipt, 
  ChevronDown,
  Truck,
  ArrowRight
} from 'lucide-react';
import ChatModal from './ChatModal';
import { useAuth } from '../context/AuthContext';
import { getTransportBookings, cancelTransportBooking, completeOffer } from '../services/api';

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

const OfferCard = ({ offer, userRole, onAccept, onReject, onCounter, onCancel, onComplete }) => {
  const { user } = useAuth();
  const effectiveRole = userRole || (user?.role === 'BUYER' ? 'BUYER' : user?.role === 'FARMER' ? 'FARMER' : 'BUYER');

  const [transportBooking, setTransportBooking] = useState(null);
  const [cancellingTransport, setCancellingTransport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(offer?.status);
  const [isDelivered, setIsDelivered] = useState(
    offer?.status === 'COMPLETED' || offer?.deliveryStatus === 'DELIVERED'
  );
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState(offer?.counterPrice || offer?.offeredPrice || '');
  const [counterQuantity, setCounterQuantity] = useState(offer?.counterQuantity || offer?.quantity || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cropLot, buyer, offeredPrice, quantity, message, status, counterPrice: currentCounterPrice, counterQuantity: currentCounterQuantity, counterMessage: currentCounterMessage, createdAt } = offer;

  useEffect(() => {
    setCurrentStatus(offer.status);
    const delivered =
      offer.status === 'COMPLETED' ||
      offer.deliveryStatus === 'DELIVERED' ||
      transportBooking?.status === 'COMPLETED';
    setIsDelivered(delivered);
    if (delivered) {
      setCurrentStatus('COMPLETED');
    }
  }, [offer.status, offer.deliveryStatus, transportBooking?.status]);

  // Fetch transport booking if offer is accepted or active
  const fetchTransportForOffer = async () => {
    if (!offer?._id) return;
    try {
      const res = await getTransportBookings({ offer: offer._id });
      if (res.success && res.data && res.data.length > 0) {
        const active = res.data.find((t) => ['BOOKED', 'ACCEPTED', 'IN_TRANSIT'].includes(t.status));
        const completed = res.data.find((t) => t.status === 'COMPLETED');
        const booking = active || completed || res.data[0];
        setTransportBooking(booking);
        if (booking?.status === 'COMPLETED' || offer.status === 'COMPLETED' || offer.deliveryStatus === 'DELIVERED') {
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
    fetchTransportForOffer();
    const interval = setInterval(fetchTransportForOffer, 3000);
    return () => clearInterval(interval);
  }, [currentStatus, cropLot?._id || cropLot, offer?._id]);

  const handleMarkCompleted = async () => {
    if (!window.confirm('Are you sure you want to mark this order as completed? This will confirm that the crops have been successfully delivered and notify the farmer.')) {
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await completeOffer(offer._id);
      if (res.success || res.data) {
        setCurrentStatus('COMPLETED');
        setIsDelivered(true);
        alert('Order marked as delivered successfully! Notification sent to the farmer.');
        if (onComplete) {
          onComplete(offer._id);
        }
      } else {
        alert(res.message || 'Failed to complete order.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTransport = async () => {
    if (!transportBooking) return;
    if (!window.confirm('Are you sure you want to cancel this transport booking? Any online paid refund will be initiated.')) {
      return;
    }
    try {
      setCancellingTransport(true);
      const res = await cancelTransportBooking(transportBooking._id, {
        cancellationReason: 'Cancelled from offer card by user',
      });
      if (res.success || res.data) {
        const updated = res.data || transportBooking;
        setTransportBooking({
          ...updated,
          status: 'CANCELLED',
          refundStatus: updated.refundStatus || (transportBooking.paymentStatus === 'PAID' ? 'REFUND_PENDING' : 'NOT_APPLICABLE'),
        });
        alert('Transport booking cancelled successfully.');
        fetchTransportForOffer();
      } else {
        alert(res.message || 'Failed to cancel transport booking.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel transport booking.');
    } finally {
      setCancellingTransport(false);
    }
  };

  const counterTotalValue = (currentCounterPrice || 0) * (currentCounterQuantity || 0);
  const farmerExpectedPrice = cropLot?.expectedPrice || 0;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Accepted</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'COUNTERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-800 border border-purple-200/90 shadow-2xs">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            <span>Countered</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>Cancelled</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            <span>Delivered</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    if (!counterPrice || counterPrice <= 0 || !counterQuantity || counterQuantity <= 0) {
      alert('Please enter valid positive numbers for price and quantity.');
      return;
    }
    if (counterQuantity > (cropLot?.quantity || Infinity)) {
      alert(`Counter quantity cannot exceed available crop lot quantity (${cropLot?.quantity}).`);
      return;
    }
    setIsSubmitting(true);
    try {
      await onCounter(offer._id, {
        counterPrice: Number(counterPrice),
        counterQuantity: Number(counterQuantity),
        counterMessage,
      });
      setShowCounterForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit counter offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstRole = offer?.negotiationHistory?.[0]?.role;
  const isFarmerToBuyer = firstRole === 'FARMER' || (offer?.status === 'COUNTERED' && offer?.lastActionBy === 'FARMER');
  const cropEmoji = getCropEmoji(cropLot?.crop);

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
                    {cropLot?.crop || 'Crop Lot'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                    Grade {cropLot?.qualityGrade || 'A'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {cropLot?.location?.city || cropLot?.location?.district || 'Location'}, {cropLot?.location?.state || 'Punjab'}
                  </span>
                </p>
              </div>
            </div>

            {/* Direction Pill & Status Badge */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {isFarmerToBuyer ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Farmer to Buyer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Buyer to Farmer</span>
                  </span>
                )}
                {getStatusBadge(isDelivered || currentStatus === 'COMPLETED' ? 'COMPLETED' : currentStatus)}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center font-medium">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                <span>{createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
              </span>
            </div>
          </div>

          {/* Counterparties (Buyer & Farmer) */}
          <div className="bg-slate-50/70 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Buyer Profile</span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                <User className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                <span className="truncate">{buyer?.buyerProfile?.businessName || buyer?.name || 'Verified Buyer'}</span>
              </span>
              {buyer?.phone && (
                <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">{buyer.phone}</span>
              )}
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Farmer (Seller)</span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span className="truncate">{cropLot?.farmer?.name || 'Farmer'}</span>
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">
                Expected: ₹{farmerExpectedPrice.toLocaleString('en-IN')}/qtl
              </span>
            </div>
          </div>

          {/* Deal Pricing & Quantity Metrics */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/90 hover:bg-emerald-50 transition">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Offered Price
              </span>
              <div className="text-base font-black text-emerald-900 flex items-center mt-0.5 font-mono">
                <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{offeredPrice?.toLocaleString('en-IN')}</span>
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

          {/* Buyer Message */}
          {message && (
            <div className="mt-2.5 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-slate-700">Buyer Note: </span>
                <span className="text-slate-600 italic">"{message}"</span>
              </div>
            </div>
          )}

          {/* Counter Offer Details Box */}
          {status === 'COUNTERED' && currentCounterPrice && (
            <div className="mt-3 bg-purple-50/80 p-3 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-700" />
                  <span>Active Counter Offer</span>
                </span>
                <span className="text-xs font-black text-purple-800 font-mono">
                  ₹{counterTotalValue.toLocaleString('en-IN')} Total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-600 font-bold block">Counter Rate</span>
                  <span className="font-extrabold text-purple-900 font-mono">₹{currentCounterPrice.toLocaleString('en-IN')} / qtl</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-600 font-bold block">Counter Qty</span>
                  <span className="font-extrabold text-purple-900">{currentCounterQuantity} quintals</span>
                </div>
              </div>
              {currentCounterMessage && (
                <p className="text-[11px] text-purple-800 bg-white/70 p-2 rounded-xl border border-purple-100 mt-2 italic">
                  "{currentCounterMessage}"
                </p>
              )}
            </div>
          )}

          {/* Negotiation History Log */}
          {offer.negotiationHistory && offer.negotiationHistory.length > 0 && (
            <div className="mt-3 bg-slate-50/80 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-100/70 flex items-center justify-between transition"
              >
                <span className="flex items-center text-slate-800">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Negotiation History ({offer.negotiationHistory.length} round{offer.negotiationHistory.length > 1 ? 's' : ''})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              {showHistory && (
                <div className="p-3 border-t border-slate-200 space-y-2 bg-white max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {offer.negotiationHistory.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-slate-900">
                          {item.action} <span className="font-normal text-slate-500">by {item.actionBy}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {item.price > 0 && (
                        <p className="text-[11px] text-slate-700 font-mono">
                          ₹{item.price?.toLocaleString('en-IN')}/qtl • {item.quantity} quintals
                        </p>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{item.note}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Counter Form */}
          {showCounterForm && (
            <form onSubmit={handleCounterSubmit} className="mt-3 bg-purple-50/90 p-4 rounded-2xl border border-purple-200 text-xs">
              <h4 className="font-bold text-purple-900 mb-2">
                {effectiveRole === 'BUYER' ? "Submit Counter to Farmer" : "Send Counter Offer"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-purple-800 font-medium mb-1">Counter Price / Quintal (₹)</label>
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-purple-800 font-medium mb-1">Counter Quantity (Quintals)</label>
                  <input
                    type="number"
                    value={counterQuantity}
                    onChange={(e) => setCounterQuantity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    min="1"
                    max={cropLot?.quantity}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-purple-800 font-medium mb-1">Counter Message (Optional)</label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="e.g. Can offer at ₹2,500/quintal due to high quality grade."
                  rows="2"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCounterForm(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {/* Direct Message / Negotiation Chat Button */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold flex items-center transition border border-slate-200/80 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>{effectiveRole === 'FARMER' ? 'Message Buyer' : 'Message Farmer'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Farmer Actions when Buyer initiated or countered */}
            {effectiveRole === 'FARMER' && (currentStatus === 'PENDING' || currentStatus === 'COUNTERED') && offer.lastActionBy === 'BUYER' && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Accept this offer? This will mark the crop lot as RESERVED and confirm the deal.')) {
                      onAccept(offer._id);
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center transition shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reject this offer?')) {
                      onReject(offer._id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center transition"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </button>
                <button
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center transition"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter
                </button>
              </>
            )}

            {/* Farmer Status when Farmer initiated offer (waiting for Buyer response) */}
            {effectiveRole === 'FARMER' && currentStatus === 'PENDING' && offer.lastActionBy === 'FARMER' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  ⏳ Waiting for Buyer Response
                </span>
                {onCancel && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this offer?')) {
                        onCancel(offer._id);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold flex items-center transition border border-slate-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                  </button>
                )}
              </div>
            )}

            {/* Buyer Actions when Farmer initiated offer or countered */}
            {effectiveRole === 'BUYER' && (currentStatus === 'PENDING' || currentStatus === 'COUNTERED') && offer.lastActionBy === 'FARMER' && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Accept this offer? This will reserve the crop lot and confirm the deal.')) {
                      onAccept(offer._id);
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center transition shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept Offer
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reject this offer?')) {
                      onReject(offer._id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center transition"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </button>
                <button
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center transition"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter
                </button>
              </>
            )}

            {/* Buyer Status on Pending Offer when Buyer initiated it */}
            {effectiveRole === 'BUYER' && currentStatus === 'PENDING' && offer.lastActionBy === 'BUYER' && onCancel && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  ⏳ Waiting for Farmer Response
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this submitted offer?')) {
                      onCancel(offer._id);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold flex items-center transition border border-slate-200"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                </button>
              </div>
            )}

            {/* Buyer Actions on Countered Offer (when Farmer countered) */}
            {effectiveRole === 'BUYER' && currentStatus === 'COUNTERED' && offer.lastActionBy !== 'BUYER' && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Accept this counter offer? This will reserve the crop lot and confirm the deal.')) {
                      onAccept(offer._id);
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center transition shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept Counter
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reject this counter offer?')) {
                      onReject(offer._id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center transition"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Counter
                </button>
                {onCounter && (
                  <button
                    onClick={() => setShowCounterForm(!showCounterForm)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter Back
                  </button>
                )}
              </>
            )}

            {/* Action for Accepted or Completed Offers */}
            {(currentStatus === 'ACCEPTED' || currentStatus === 'COMPLETED' || isDelivered) && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Buyer View */}
                {effectiveRole === 'BUYER' ? (
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
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  Cancelled {['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(transportBooking?.refundStatus) && (transportBooking.refundAmount || transportBooking.paidAmount) ? `(Refund: ₹${transportBooking.refundAmount || transportBooking.paidAmount})` : ''}
                                </span>
                                {transportBooking?.refundStatus && transportBooking?.refundStatus !== 'NOT_APPLICABLE' && (
                                  <Link
                                    to={`/payment-status?transportId=${transportBooking._id}`}
                                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition"
                                  >
                                    Payment Status
                                  </Link>
                                )}
                              </div>
                            )}
                            <Link
                              to={`/transport?crop=${encodeURIComponent(cropLot?.crop || 'Crop')}&quantity=${quantity || ''}&destination=${encodeURIComponent(
                                [
                                  buyer?.buyerProfile?.businessName,
                                  buyer?.location?.city || buyer?.location?.district,
                                  buyer?.location?.state,
                                ].filter(Boolean).join(', ') || buyer?.name || 'Buyer Warehouse'
                              )}&distance=35&cropLot=${cropLot?._id || ''}&offerId=${offer._id}`}
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
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipient={effectiveRole === 'FARMER' ? buyer : cropLot?.farmer}
        cropLot={cropLot}
        offer={offer}
      />
    </div>
  );
};

export default OfferCard;
