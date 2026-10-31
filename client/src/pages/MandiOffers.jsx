import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X
} from 'lucide-react';
import { getMandiBookings } from '../services/api';
import MandiSaleCard from '../components/MandiSaleCard';
import { useAuth } from '../context/AuthContext';

const MandiOffers = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isFirstLoad = useRef(true);

  const fetchBookings = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      if (isFirstLoad.current) setLoading(true);
      setError(null);

      const res = await getMandiBookings();
      if (res && res.success) {
        setBookings(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mandi offers and bookings.');
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Silent background poll every 6 seconds without page flicker
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter Bookings by Tab & Search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b) return false;
      const st = b.status || 'PENDING';

      // 1. Status Filter
      if (activeTab === 'PENDING' && st !== 'PENDING') return false;
      if (activeTab === 'ACCEPTED' && !(st === 'ACCEPTED' || st === 'SCHEDULED' || st === 'ARRIVED' || st === 'QUALITY_CHECKED')) return false;
      if (activeTab === 'COMPLETED' && st !== 'COMPLETED') return false;
      if (activeTab === 'REJECTED' && !(st === 'REJECTED' || st === 'CANCELLED')) return false;

      // 2. Search Query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const cropName = (b.crop || b.cropName || '').toLowerCase();
        const farmerName = (b.farmer?.name || '').toLowerCase();
        const farmerPhone = (b.farmer?.phone || '').toLowerCase();
        const token = (b.tokenNumber || '').toLowerCase();
        const bookingNum = (b.bookingNumber || '').toLowerCase();
        const mandiName = (b.mandi?.name || '').toLowerCase();

        return (
          cropName.includes(term) ||
          farmerName.includes(term) ||
          farmerPhone.includes(term) ||
          token.includes(term) ||
          bookingNum.includes(term) ||
          mandiName.includes(term)
        );
      }

      return true;
    });
  }, [bookings, activeTab, searchTerm]);

  // Tab counts
  const totalCount = bookings.filter(Boolean).length;
  const pendingCount = bookings.filter((b) => b?.status === 'PENDING').length;
  const acceptedCount = bookings.filter((b) => ['ACCEPTED', 'SCHEDULED', 'ARRIVED', 'QUALITY_CHECKED'].includes(b?.status)).length;
  const completedCount = bookings.filter((b) => b?.status === 'COMPLETED').length;
  const deliveredCount = completedCount;
  const rejectedCount = bookings.filter((b) => ['REJECTED', 'CANCELLED'].includes(b?.status)).length;

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
              <span>APMC Mandi Inward Produce Desk • Direct Farmer Crop Sale Proposals 🏛️</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Mandi Crop Offers & <span className="text-emerald-300">Sales</span> 📑
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Review live harvest sale proposals from registered farmers, assign arrival gate tokens, inspect harvest quality, and settle direct payments into secure escrow.
            </p>

            {/* Quick Metrics Bar in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending Review: <strong className="text-white text-sm">{pendingCount}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accepted / Scheduled: <strong className="text-emerald-300 text-sm">{acceptedCount}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Package className="w-3.5 h-3.5 text-teal-400" />
                <span>Delivered: <strong className="text-white text-sm">{deliveredCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="relative z-20 flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/mandi-dashboard"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Mandi Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchBookings(true)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Live Offers"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            type="button"
            onClick={() => fetchBookings(true)} 
            className="font-bold underline text-rose-900 text-xs hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Status Filter Tabs & Search Bar (Clean Single Stream: Direct Mandi Offers) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Offers', count: totalCount },
            { id: 'PENDING', label: 'Pending Review', count: pendingCount },
            { id: 'ACCEPTED', label: 'Accepted & Scheduled', count: acceptedCount },
            { id: 'COMPLETED', label: 'Delivered', count: completedCount },
            { id: 'REJECTED', label: 'Rejected / Cancelled', count: rejectedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search crop, farmer, or token..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Cards Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading farmer mandi offers...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">No Crop Offers Found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {searchTerm
                ? `No crop sale requests match "${searchTerm}". Try adjusting your search query.`
                : `There are currently no farmer crop sale requests in the "${activeTab}" tab.`}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/mandi-dashboard"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Mandi Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => fetchBookings(true)}
              className="inline-flex items-center space-x-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <MandiSaleCard 
              key={b._id} 
              booking={b} 
              onRefresh={fetchBookings} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MandiOffers;
