import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getOffers, getFarmerBookings, acceptOffer, rejectOffer, counterOffer, cancelOffer } from '../services/api';
import OfferCard from '../components/OfferCard';
import MandiSaleCard from '../components/MandiSaleCard';
import { 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Building2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Package,
  Banknote,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FarmerOffers = () => {
  const { user } = useAuth();
  if (user?.role === 'MANDI_ADMIN') {
    return <Navigate to="/mandi-offers" replace />;
  }
  const demoFarmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;

  const [offers, setOffers] = useState([]);
  const [mandiBookings, setMandiBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL'); // 'ALL' | 'FARMER_TO_BUYER' | 'BUYER_TO_FARMER' | 'FARMER_TO_MANDI'

  const fetchFarmerOffers = async (showLoading = false) => {
    if (!demoFarmerId) {
      setError('Please sign in as a farmer to view your crop offers.');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const [offersRes, mandiRes] = await Promise.all([
        getOffers({ farmer: demoFarmerId }).catch(() => ({ success: false, data: [] })),
        getFarmerBookings({ farmer: demoFarmerId }).catch(() => ({ success: false, data: [] })),
      ]);

      if (offersRes.success) {
        setOffers(offersRes.data || []);
      }
      if (mandiRes && mandiRes.success) {
        setMandiBookings(mandiRes.data || []);
      }
    } catch (err) {
      if (showLoading) {
        setError(err.response?.data?.message || 'Failed to load farmer offers');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFarmerOffers(true);
    const interval = setInterval(() => {
      fetchFarmerOffers(false);
    }, 4000);
    return () => clearInterval(interval);
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

  const handleCancel = async (offerId) => {
    try {
      const res = await cancelOffer(offerId);
      if (res.success) {
        fetchFarmerOffers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel offer.');
    }
  };

  const isFarmerToBuyer = (off) => {
    const firstRole = off?.negotiationHistory?.[0]?.role;
    return firstRole === 'FARMER' || (off?.status === 'COUNTERED' && off?.lastActionBy === 'FARMER');
  };

  const isBuyerToFarmer = (off) => {
    const firstRole = off?.negotiationHistory?.[0]?.role;
    return firstRole === 'BUYER' || (!firstRole && off?.lastActionBy !== 'FARMER');
  };

  const farmerToBuyerCount = offers.filter(isFarmerToBuyer).length;
  const buyerToFarmerCount = offers.filter(isBuyerToFarmer).length;
  const mandiCount = mandiBookings.length;
  const totalCount = offers.length + mandiCount;

  // Key stats
  const pendingCount = offers.filter(o => o.status === 'PENDING' || o.status === 'COUNTERED').length + mandiBookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = offers.filter(o => o.status === 'ACCEPTED').length + mandiBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'SCHEDULED').length;
  const deliveredCount = offers.filter(o => o.status === 'COMPLETED' || o.deliveryStatus === 'DELIVERED').length + mandiBookings.filter(b => b.status === 'COMPLETED').length;

  // Filter offers by status & direction
  const filteredOffers = (directionFilter === 'FARMER_TO_MANDI') ? [] : offers.filter((off) => {
    if (activeTab === 'ACCEPTED' && !(off.status === 'ACCEPTED' || off.status === 'COMPLETED' || off.deliveryStatus === 'DELIVERED')) {
      return false;
    }
    if (activeTab === 'COMPLETED' && !(off.status === 'COMPLETED' || off.deliveryStatus === 'DELIVERED')) {
      return false;
    }
    if (activeTab !== 'ALL' && activeTab !== 'ACCEPTED' && activeTab !== 'COMPLETED' && off.status !== activeTab) {
      return false;
    }

    if (directionFilter === 'FARMER_TO_BUYER') {
      return isFarmerToBuyer(off);
    }
    if (directionFilter === 'BUYER_TO_FARMER') {
      return isBuyerToFarmer(off);
    }

    return true;
  });

  // Filter Mandi Bookings
  const filteredMandiBookings = (directionFilter === 'FARMER_TO_BUYER' || directionFilter === 'BUYER_TO_FARMER') ? [] : mandiBookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACCEPTED' && (b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'COMPLETED')) return true;
    if (activeTab === 'COMPLETED' && b.status === 'COMPLETED') return true;
    if (activeTab === 'PENDING' && b.status === 'PENDING') return true;
    if (activeTab === 'REJECTED' && b.status === 'REJECTED') return true;
    if (activeTab === 'CANCELLED' && b.status === 'CANCELLED') return true;
    return b.status === activeTab;
  });

  const totalVisibleCount = filteredOffers.length + filteredMandiBookings.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. High-Aesthetic Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-700/50">
        {/* Subtle Ambient Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Farmer Sales Desk • Direct Negotiation & Escrow Settlement</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Crop Offers & <span className="text-emerald-300">Deals</span> 📑
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Review incoming bids from verified commercial buyers, respond with counter-offers, and track direct Mandi sale requests all in one unified desk.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending / Countered: <strong className="text-white text-sm">{pendingCount}</strong></span>
              </div>

              <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confirmed Deals: <strong className="text-emerald-300 text-sm">{confirmedCount}</strong></span>
              </div>

              <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Package className="w-3.5 h-3.5 text-teal-400" />
                <span>Delivered: <strong className="text-white text-sm">{deliveredCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Switch to Buyer Mode */}
          <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              to="/my-offers"
              className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 transition text-xs sm:text-sm"
            >
              <span>Switch to Buyer (My Bids)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <button
              type="button"
              onClick={() => fetchFarmerOffers(true)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Live Offers"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dev Alert */}
      {!demoFarmerId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs sm:text-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Missing Farmer Configuration:</strong> <code>VITE_DEMO_FARMER_ID</code> is missing in <code>client/.env</code>.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs sm:text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Channel Filter Pills & Direction Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Select Offer Channel
          </span>
          <span className="text-xs font-bold text-slate-500">
            Showing {totalVisibleCount} of {totalCount} total records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDirectionFilter('ALL')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              directionFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Channels ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setDirectionFilter('FARMER_TO_BUYER')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              directionFilter === 'FARMER_TO_BUYER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Farmers to Buyers ({farmerToBuyerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setDirectionFilter('BUYER_TO_FARMER')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              directionFilter === 'BUYER_TO_FARMER'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Buyers to Farmer ({buyerToFarmerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setDirectionFilter('FARMER_TO_MANDI')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              directionFilter === 'FARMER_TO_MANDI'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Farmer to Mandi ({mandiCount})</span>
          </button>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto pb-1">
          {['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((tab) => {
            const count = 
              tab === 'ALL'
                ? totalCount
                : tab === 'ACCEPTED'
                ? offers.filter((o) => o.status === 'ACCEPTED' || o.status === 'COMPLETED' || o.deliveryStatus === 'DELIVERED').length + mandiBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'COMPLETED').length
                : tab === 'COMPLETED'
                ? offers.filter((o) => o.status === 'COMPLETED' || o.deliveryStatus === 'DELIVERED').length + mandiBookings.filter(b => b.status === 'COMPLETED').length
                : offers.filter((o) => o.status === tab).length + mandiBookings.filter(b => b.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'COMPLETED' ? 'Delivered' : tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cards Content Grid */}
      {loading ? (
        <div className="py-16 flex flex-col justify-center items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading incoming offers and mandi deliveries...</p>
        </div>
      ) : totalVisibleCount === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-lg font-black text-slate-800">No records found for this filter</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {directionFilter === 'FARMER_TO_MANDI'
              ? 'No direct Mandi sale requests recorded yet. You can sell crops directly at Mandis using the Mandi Prices page.'
              : activeTab === 'ALL'
              ? 'There are currently no offers recorded. Create crop lots to start receiving direct buyer bids.'
              : `There are currently no records with status "${activeTab}".`}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setActiveTab('ALL');
                setDirectionFilter('ALL');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
          {/* Direct Produce Offers (Farmers to Buyers / Buyers to Farmer) */}
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              userRole="FARMER"
              onAccept={handleAccept}
              onReject={handleReject}
              onCounter={handleCounter}
              onCancel={handleCancel}
              onComplete={fetchFarmerOffers}
            />
          ))}

          {/* Mandi Sale Requests (Farmer to Mandi) */}
          {filteredMandiBookings.map((booking) => (
            <MandiSaleCard
              key={booking._id}
              booking={booking}
              onRefresh={fetchFarmerOffers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOffers;
