import React, { useState } from 'react';
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
} from 'lucide-react';
import ChatModal from './ChatModal';

const OfferCard = ({ offer, userRole, onAccept, onReject, onCounter, onCancel }) => {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState(offer.counterPrice || offer.offeredPrice || '');
  const [counterQuantity, setCounterQuantity] = useState(offer.counterQuantity || offer.quantity || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cropLot, buyer, offeredPrice, quantity, message, status, counterPrice: currentCounterPrice, counterQuantity: currentCounterQuantity, counterMessage: currentCounterMessage, createdAt } = offer;

  const totalValue = (offeredPrice || 0) * (quantity || 0);
  const counterTotalValue = (currentCounterPrice || 0) * (currentCounterQuantity || 0);
  const farmerExpectedPrice = cropLot?.expectedPrice || 0;
  const farmerExpectedTotal = farmerExpectedPrice * (quantity || 0);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      case 'COUNTERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <TrendingUp className="w-3 h-3 mr-1" /> Countered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 mr-1" /> Cancelled
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {cropLot?.crop || 'Crop Lot'}
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Grade: {cropLot?.qualityGrade || 'Standard'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {cropLot?.location?.city || cropLot?.location?.district || 'Location'}, {cropLot?.location?.state || ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(status)}
            <span className="text-[11px] text-slate-400 flex items-center mt-0.5">
              <Calendar className="w-3 h-3 mr-1" />
              {createdAt ? new Date(createdAt).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        </div>

        {/* Parties details */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Demo Buyer</span>
            <span className="font-semibold text-slate-800 flex items-center mt-0.5">
              <User className="w-3.5 h-3.5 mr-1 text-blue-600" />
              {buyer?.buyerProfile?.businessName || buyer?.name || 'Buyer'}
            </span>
            {buyer?.phone && <span className="text-slate-500 block text-[11px] mt-0.5">{buyer.phone}</span>}
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Farmer</span>
            <span className="font-semibold text-slate-800 flex items-center mt-0.5">
              <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {cropLot?.farmer?.name || 'Farmer'}
            </span>
            <span className="text-slate-500 block text-[11px] mt-0.5">
              Expected: ₹{farmerExpectedPrice.toLocaleString('en-IN')}/quintal
            </span>
          </div>
        </div>

        {/* Offer stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Offered Price</span>
            <span className="text-base font-bold text-slate-900 flex items-center">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              {offeredPrice?.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500 ml-1">/ qtl</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Quantity</span>
            <span className="text-base font-bold text-slate-900 flex items-center">
              <Package className="w-4 h-4 text-emerald-600 mr-1" />
              {quantity} <span className="text-xs font-normal text-slate-500 ml-1">quintals</span>
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Estimated Value</span>
            <span className="text-base font-extrabold text-emerald-700">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Buyer Message */}
        {message && (
          <div className="mb-4 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 flex items-start">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mr-1.5 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-600">Buyer Message: </span>
              <span className="text-slate-700">{message}</span>
            </div>
          </div>
        )}

        {/* Counter Offer Details Box (If COUNTERED or has counter data) */}
        {status === 'COUNTERED' && currentCounterPrice && (
          <div className="mb-4 bg-purple-50 p-3.5 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-purple-700" /> Counter Offer Details
              </span>
              <span className="text-xs font-bold text-purple-800">
                ₹{counterTotalValue.toLocaleString('en-IN')} Total
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span className="text-purple-600">Counter Price: </span>
                <span className="font-bold text-purple-900">₹{currentCounterPrice.toLocaleString('en-IN')} / qtl</span>
              </div>
              <div>
                <span className="text-purple-600">Counter Quantity: </span>
                <span className="font-bold text-purple-900">{currentCounterQuantity} quintals</span>
              </div>
            </div>
            {currentCounterMessage && (
              <p className="text-xs text-purple-800 bg-purple-100/50 p-2 rounded">
                <span className="font-semibold">Message: </span>"{currentCounterMessage}"
              </p>
            )}
          </div>
        )}

        {/* Negotiation History Log */}
        {offer.negotiationHistory && offer.negotiationHistory.length > 0 && (
          <div className="mb-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-100/70 flex items-center justify-between transition"
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
                      <p className="text-[11px] text-slate-700">
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

        {/* Counter Form for Farmer or Buyer */}
        {showCounterForm && (
          <form onSubmit={handleCounterSubmit} className="mb-4 bg-purple-50 p-4 rounded-xl border border-purple-200 text-xs">
            <h4 className="font-bold text-purple-900 mb-2">
              {userRole === 'BUYER' ? "Submit Counter to Farmer" : "Send Counter Offer"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-purple-800 font-medium mb-1">Counter Price / Quintal (₹)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                  className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-purple-700 text-white font-semibold rounded hover:bg-purple-800 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Direct Message / Negotiation Chat Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center transition"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {userRole === 'FARMER' ? 'Message Buyer' : 'Message Farmer'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Farmer Actions */}
          {userRole === 'FARMER' && (status === 'PENDING' || (status === 'COUNTERED' && offer.lastActionBy === 'BUYER')) && (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Accept this offer? This will mark the crop lot as RESERVED and confirm the deal.')) {
                    onAccept(offer._id);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center transition shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reject this offer?')) {
                    onReject(offer._id);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center transition"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </button>
              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center transition"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter
              </button>
            </>
          )}

          {/* Buyer Actions on Pending Offer */}
          {userRole === 'BUYER' && status === 'PENDING' && onCancel && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this submitted offer?')) {
                  onCancel(offer._id);
                }
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded text-xs font-semibold flex items-center transition"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Offer
            </button>
          )}

          {/* Buyer Actions on Countered Offer (when Farmer countered) */}
          {userRole === 'BUYER' && status === 'COUNTERED' && offer.lastActionBy !== 'BUYER' && (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Accept this counter offer? This will reserve the crop lot and confirm the deal.')) {
                    onAccept(offer._id);
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center transition shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept Counter
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reject this counter offer?')) {
                    onReject(offer._id);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center transition"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Counter
              </button>
              {onCounter && (
                <button
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center transition"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter Back
                </button>
              )}
            </>
          )}

          {/* Action for Accepted Offers (Farmer or Buyer) -> View Confirmed Deal */}
          {status === 'ACCEPTED' && (
            <Link
              to="/transactions"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center transition shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5 mr-1" /> View Confirmed Deal
            </Link>
          )}
        </div>
      </div>

      {/* Real-time Negotiation Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipient={userRole === 'FARMER' ? buyer : cropLot?.farmer}
        cropLot={cropLot}
        offer={offer}
      />
    </div>
  );
};

export default OfferCard;
