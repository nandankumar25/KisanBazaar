import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getOffers, getFarmerBookings, acceptOffer, rejectOffer, counterOffer, cancelOffer } from '../services/api';
import OfferCard from '../components/OfferCard';
import MandiSaleCard from '../components/MandiSaleCard';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Search,
  SlidersHorizontal,
  TrendingUp,
  ShieldCheck,
  Receipt,
  Scale,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyOffers = () => {
  const { user } = useAuth();
  const demoBuyerId = user?._id || import.meta.env.VITE_DEMO_BUYER_ID;

  const [offers, setOffers] = useState([]);
  const [mandiBookings, setMandiBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL'); // 'ALL' | 'ACTION_REQUIRED' | 'FARMER_TO_BUYER' | 'BUYER_TO_FARMER'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBuyerOffers = async (showLoading = false) => {
    if (!demoBuyerId) {
      setError('Please sign in as a buyer to view your submitted bids.');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const [res, mandiRes] = await Promise.all([
        getOffers({ buyer: demoBuyerId }).catch(() => ({ success: false, data: [] })),
        getFarmerBookings({ farmer: user?._id }).catch(() => ({ success: false, data: [] })),
      ]);

      if (res.success) {
        setOffers(res.data || []);
      }
      if (mandiRes && mandiRes.success) {
        setMandiBookings(mandiRes.data || []);
      }
    } catch (err) {
      if (showLoading) {
        setError(err.response?.data?.message || 'Failed to load bids and offers');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuyerOffers(true);
    const interval = setInterval(() => {
      fetchBuyerOffers(false);
    }, 5000);
    return () => clearInterval(interval);
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

  const isFarmerToBuyer = (off) => {
    const firstRole = off?.negotiationHistory?.[0]?.role;
    return firstRole === 'FARMER' || (off?.status === 'COUNTERED' && off?.lastActionBy === 'FARMER');
  };

  const isBuyerToFarmer = (off) => {
    const firstRole = off?.negotiationHistory?.[0]?.role;
    return firstRole === 'BUYER' || (!firstRole && off?.lastActionBy !== 'FARMER');
  };

  // Bids where farmer countered and buyer action is needed
  const needsActionCount = offers.filter(
    (off) => off.status === 'COUNTERED' && off.lastActionBy === 'FARMER'
  ).length;

  const pendingCount = offers.filter(
    (off) => off.status === 'PENDING' || off.status === 'COUNTERED'
  ).length;

  const confirmedCount = offers.filter(
    (off) => off.status === 'ACCEPTED'
  ).length;

  const deliveredCount = offers.filter(
    (off) => off.status === 'COMPLETED' || off.deliveryStatus === 'DELIVERED'
  ).length;

  // Total committed procurement value in ₹
  const totalCommittedValue = useMemo(() => {
    return offers.reduce((acc, off) => {
      const rate = off.offeredPrice || off.cropLot?.pricePerUnit || 0;
      const qty = off.quantity || off.cropLot?.quantity || 0;
      return acc + (rate * qty);
    }, 0);
  }, [offers]);

  const farmerToBuyerCount = offers.filter(isFarmerToBuyer).length;
  const buyerToFarmerCount = offers.filter(isBuyerToFarmer).length;
  const totalCount = offers.length;

  // Filtered offers by tabs, direction, and search query
  const filteredOffers = useMemo(() => {
    return offers.filter((off) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cropName = (off.cropLot?.cropName || off.cropName || '').toLowerCase();
        const variety = (off.cropLot?.variety || '').toLowerCase();
        const farmerName = (off.seller?.name || off.farmer?.name || '').toLowerCase();
        const mandiName = (off.cropLot?.mandi?.name || '').toLowerCase();

        const matches = cropName.includes(q) || variety.includes(q) || farmerName.includes(q) || mandiName.includes(q);
        if (!matches) return false;
      }

      // 2. Status Filter
      if (activeTab === 'ACCEPTED' && !(off.status === 'ACCEPTED' || off.status === 'COMPLETED' || off.deliveryStatus === 'DELIVERED')) {
        return false;
      }
      if (activeTab === 'COMPLETED' && !(off.status === 'COMPLETED' || off.deliveryStatus === 'DELIVERED')) {
        return false;
      }
      if (activeTab !== 'ALL' && activeTab !== 'ACCEPTED' && activeTab !== 'COMPLETED' && off.status !== activeTab) {
        return false;
      }

      // 3. Direction / Action Filter
      if (directionFilter === 'ACTION_REQUIRED') {
        return off.status === 'COUNTERED' && off.lastActionBy === 'FARMER';
      }
      if (directionFilter === 'FARMER_TO_BUYER') {
        return isFarmerToBuyer(off);
      }
      if (directionFilter === 'BUYER_TO_FARMER') {
        return isBuyerToFarmer(off);
      }

      return true;
    });
  }, [offers, searchQuery, activeTab, directionFilter]);

  const totalVisibleCount = filteredOffers.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. High-Aesthetic Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/40">
        {/* Subtle Ambient Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Buyer Procurement Desk • Direct Offers & Escrow Settlements 🌾</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              My Bids & <span className="text-emerald-300">Offers</span> 💼
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Track bids submitted to verified farmers, negotiate counter-offers in real-time, deposit payment into secure escrow, and track delivery progress.
            </p>

            {/* Quick Metrics Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending / Countered: <strong className="text-white text-sm">{pendingCount}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accepted / Escrow: <strong className="text-emerald-300 text-sm">{confirmedCount}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Package className="w-3.5 h-3.5 text-teal-400" />
                <span>Delivered: <strong className="text-white text-sm">{deliveredCount}</strong></span>
              </div>

              {needsActionCount > 0 && (
                <div className="bg-rose-500/20 border border-rose-400/40 text-rose-200 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 animate-pulse font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  <span>Action Needed: {needsActionCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Hub */}
          <div className="relative z-20 flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/find-crops"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm"
            >
              <Search className="w-4 h-4" />
              <span>Find Crops</span>
            </Link>

            <Link
              to="/mandi-prices"
              className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 transition text-xs sm:text-sm"
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Mandi Rates</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchBuyerOffers(false)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Bids"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Banner Alert if Counter-Offers require action */}
      {needsActionCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Action Required: {needsActionCount} Farmer Counter-Offer{needsActionCount > 1 ? 's' : ''} Received
              </h4>
              <p className="text-xs text-slate-600">
                Farmers have proposed revised pricing or delivery dates for your submitted bids. Review and respond to lock deals into escrow.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('COUNTERED');
              setDirectionFilter('ACTION_REQUIRED');
            }}
            className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 transition"
          >
            <span>Review Counter-Offers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Dev Missing Buyer Configuration Alert */}
      {!demoBuyerId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs sm:text-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Missing Buyer Configuration:</strong> <code>VITE_DEMO_BUYER_ID</code> is not defined in <code>client/.env</code>.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs sm:text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
        {/* Search & Channel Direction */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by crop, variety, or farmer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Direction Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDirectionFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                directionFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Bids ({totalCount})
            </button>

            {needsActionCount > 0 && (
              <button
                type="button"
                onClick={() => setDirectionFilter('ACTION_REQUIRED')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  directionFilter === 'ACTION_REQUIRED'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Needs Action ({needsActionCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDirectionFilter('BUYER_TO_FARMER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                directionFilter === 'BUYER_TO_FARMER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Direct Bids ({buyerToFarmerCount})
            </button>

            <button
              type="button"
              onClick={() => setDirectionFilter('FARMER_TO_BUYER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                directionFilter === 'FARMER_TO_BUYER'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Farmer Direct ({farmerToBuyerCount})
            </button>
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto pb-1">
          {['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((tab) => {
            const count =
              tab === 'ALL'
                ? totalCount
                : tab === 'ACCEPTED'
                ? offers.filter((o) => o.status === 'ACCEPTED' || o.status === 'COMPLETED' || o.deliveryStatus === 'DELIVERED').length
                : tab === 'COMPLETED'
                ? offers.filter((o) => o.status === 'COMPLETED' || o.deliveryStatus === 'DELIVERED').length
                : offers.filter((o) => o.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>
                  {tab === 'ALL'
                    ? 'All Bids'
                    : tab === 'COUNTERED'
                    ? 'Countered'
                    : tab === 'ACCEPTED'
                    ? 'Accepted / Escrow'
                    : tab === 'COMPLETED'
                    ? 'Delivered'
                    : tab}
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span className="text-xs font-bold text-slate-400">Loading your procurement bids...</span>
        </div>
      ) : totalVisibleCount === 0 ? (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">No Bids Found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {searchQuery
                ? `No bids matched your search "${searchQuery}". Try adjusting your filters.`
                : activeTab === 'ALL'
                ? 'You have not submitted any bids yet. Explore high-quality crop lots posted by verified farmers across mandis.'
                : `No bids are currently marked as ${activeTab}.`}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/find-crops"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Explore Crop Lots</span>
            </Link>
          </div>
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
              onComplete={fetchBuyerOffers}
            />
          ))}

          {/* Optional Mandi bookings if applicable */}
          {mandiBookings.map((booking) => (
            <MandiSaleCard
              key={booking._id}
              booking={booking}
              onRefresh={fetchBuyerOffers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOffers;
