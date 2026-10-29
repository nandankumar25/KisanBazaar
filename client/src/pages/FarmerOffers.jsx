import React, { useState, useEffect } from 'react';
import { getOffers, acceptOffer, rejectOffer, counterOffer } from '../services/api';
import OfferCard from '../components/OfferCard';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FarmerOffers = () => {
  const { user } = useAuth();
  const demoFarmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchFarmerOffers = async () => {
    if (!demoFarmerId) {
      setError('Please sign in as a farmer to view your crop offers.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getOffers({ farmer: demoFarmerId });
      if (res.success) {
        setOffers(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load farmer offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerOffers();
  }, [demoFarmerId]);

  const handleAccept = async (offerId) => {
    try {
      const res = await acceptOffer(offerId);
      if (res.success) {
        fetchFarmerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept offer.');
    }
  };

  const handleReject = async (offerId) => {
    try {
      const res = await rejectOffer(offerId);
      if (res.success) {
        fetchFarmerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject offer.');
    }
  };

  const handleCounter = async (offerId, counterData) => {
    try {
      const res = await counterOffer(offerId, counterData);
      if (res.success) {
        fetchFarmerOffers();
      }
      return res;
    } catch (err) {
      throw err;
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
              <FileText className="w-6 h-6 mr-2 text-emerald-600" /> Incoming Offers
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
              Farmer Dashboard
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review, accept, reject, or submit counter offers to buyers for your crop lots.
          </p>
        </div>

        <button
          onClick={fetchFarmerOffers}
          className="inline-flex items-center text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Offers
        </button>
      </div>

      {/* Dev Error */}
      {!demoFarmerId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Missing Farmer Configuration:</strong> <code>VITE_DEMO_FARMER_ID</code> is missing in <code>client/.env</code>.
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
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No offers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'There are currently no offers submitted for your crop lots.'
              : `No offers currently with status ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              userRole="FARMER"
              onAccept={handleAccept}
              onReject={handleReject}
              onCounter={handleCounter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOffers;
