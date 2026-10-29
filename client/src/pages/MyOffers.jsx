import React, { useState, useEffect } from 'react';
import { getOffers, acceptOffer, rejectOffer, counterOffer, cancelOffer } from '../services/api';
import OfferCard from '../components/OfferCard';
import { ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyOffers = () => {
  const { user } = useAuth();
  const demoBuyerId = user?._id || import.meta.env.VITE_DEMO_BUYER_ID;

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchBuyerOffers = async () => {
    if (!demoBuyerId) {
      setError('Please sign in as a buyer to view your submitted offers.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getOffers({ buyer: demoBuyerId });
      if (res.success) {
        setOffers(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerOffers();
  }, [demoBuyerId]);

  const handleAccept = async (offerId) => {
    try {
      const res = await acceptOffer(offerId);
      if (res.success) {
        fetchBuyerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept counter offer.');
    }
  };

  const handleReject = async (offerId) => {
    try {
      const res = await rejectOffer(offerId);
      if (res.success) {
        fetchBuyerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject counter offer.');
    }
  };

  const handleCounter = async (offerId, counterData) => {
    try {
      const res = await counterOffer(offerId, counterData);
      if (res.success) {
        fetchBuyerOffers();
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  const handleCancel = async (offerId) => {
    try {
      const res = await cancelOffer(offerId);
      if (res.success) {
        fetchBuyerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel offer.');
    }
  };

  const filteredOffers = offers.filter((off) => {
    if (activeTab === 'ALL') return true;
    return off.status === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <ShoppingBag className="w-6 h-6 mr-2 text-emerald-600" /> My Offers
            </h1>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold">
              Buyer Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage offers submitted for agricultural crop lots.
          </p>
        </div>

        <button
          onClick={fetchBuyerOffers}
          className="inline-flex items-center text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Offers
        </button>
      </div>

      {/* Dev Error */}
      {!demoBuyerId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Missing Buyer Configuration:</strong> <code>VITE_DEMO_BUYER_ID</code> is not defined in <code>client/.env</code>.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 overflow-x-auto">
        {['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'ALL' ? 'All Offers' : tab}
            {tab === 'ALL'
              ? ` (${offers.length})`
              : ` (${offers.filter((o) => o.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No offers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'You have not submitted any offers yet. Explore available crop lots to submit an offer.'
              : `No offers currently with status ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              userRole="BUYER"
              onAccept={handleAccept}
              onReject={handleReject}
              onCounter={handleCounter}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOffers;
