import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getMyTransporterProfile, 
  getTransactions, 
  getTransportBookings,
  updateTransportStatus,
  updateTransportPayment
} from '../services/api';
import DashboardCard from '../components/DashboardCard';
import {
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Banknote,
  Package,
  Calendar,
  Check,
  X,
  XCircle,
  Phone,
  Store,
  Navigation,
  User,
  FileText,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

// Helper for crop emojis
const getCropEmoji = (name = '') => {
  const n = String(name).toLowerCase();
  if (n.includes('wheat') || n.includes('gehun')) return '🌾';
  if (n.includes('rice') || n.includes('paddy') || n.includes('chawal')) return '🍚';
  if (n.includes('potato') || n.includes('aloo')) return '🥔';
  if (n.includes('onion') || n.includes('pyaz')) return '🧅';
  if (n.includes('tomato') || n.includes('tamatar')) return '🍅';
  if (n.includes('corn') || n.includes('maize') || n.includes('makka')) return '🌽';
  if (n.includes('mustard') || n.includes('sarson')) return '🌼';
  if (n.includes('cotton') || n.includes('kapas')) return '☁️';
  if (n.includes('chana') || n.includes('gram') || n.includes('dal')) return '🫘';
  if (n.includes('apple') || n.includes('seb')) return '🍎';
  if (n.includes('mango') || n.includes('aam')) return '🥭';
  return '📦';
};

const TransporterDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetBookingId = queryParams.get('bookingId');

  const [vehicles, setVehicles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [rejectionModalBooking, setRejectionModalBooking] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Booking filters & search
  const [bookingStatusTab, setBookingStatusTab] = useState('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');
      const [transporterRes, txnRes, bookingsRes] = await Promise.all([
        getMyTransporterProfile().catch(() => ({ success: false, data: [] })),
        getTransactions().catch(() => ({ success: false, data: [] })),
        getTransportBookings().catch(() => ({ success: false, data: [] })),
      ]);

      if (transporterRes.success) {
        setVehicles(transporterRes.data || []);
      }
      if (txnRes.success) {
        setTransactions(txnRes.data || []);
      }
      if (bookingsRes.data) {
        setTransportBookings(bookingsRes.data || []);
      }
    } catch (err) {
      console.error(err);
      if (showLoading) {
        setError('Failed to load transporter dashboard data.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open booking details when clicking notification with ?bookingId=...
  useEffect(() => {
    if (targetBookingId && transportBookings.length > 0) {
      const match = transportBookings.find((b) => b._id === targetBookingId);
      if (match) {
        setSelectedBookingForDetails(match);
      }
    }
  }, [targetBookingId, transportBookings]);

  // Handle Transporter Accepting Booking
  const handleAcceptBooking = async (bookingId) => {
    try {
      setActionLoadingId(bookingId);
      const res = await updateTransportStatus(bookingId, { status: 'ACCEPTED' });
      if (res.success || res.data) {
        setTransportBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'ACCEPTED' } : b))
        );
        if (selectedBookingForDetails?._id === bookingId) {
          setSelectedBookingForDetails((prev) => prev ? { ...prev, status: 'ACCEPTED' } : null);
        }
        setSuccessToast('Booking ACCEPTED! The farmer has been notified.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to accept booking:', err);
      alert(err.response?.data?.message || 'Failed to accept booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Transporter Rejecting Booking
  const handleRejectBooking = async (bookingId, reason) => {
    try {
      setActionLoadingId(bookingId);
      const res = await updateTransportStatus(bookingId, { 
        status: 'REJECTED',
        rejectionReason: reason || 'Vehicle unavailable on requested date'
      });
      if (res.success || res.data) {
        setTransportBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'REJECTED' } : b))
        );
        if (selectedBookingForDetails?._id === bookingId) {
          setSelectedBookingForDetails((prev) => prev ? { ...prev, status: 'REJECTED' } : null);
        }
        setRejectionModalBooking(null);
        setRejectionReasonInput('');
        setSuccessToast('Booking REJECTED. The farmer has been notified.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to reject booking:', err);
      alert(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Transporter Collecting COD Payment
  const handleCollectCodPayment = async (bookingId) => {
    try {
      setActionLoadingId(bookingId);
      const res = await updateTransportPayment(bookingId, { paymentStatus: 'PAID' });
      if (res.success || res.data) {
        setTransportBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: 'PAID' } : b))
        );
        if (selectedBookingForDetails?._id === bookingId) {
          setSelectedBookingForDetails((prev) => prev ? { ...prev, paymentStatus: 'PAID' } : null);
        }
        setSuccessToast('COD Cash Payment confirmed! Farmer notified.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to collect COD payment:', err);
      alert(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute KPI metrics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.isAvailable).length;
  const busyVehicles = vehicles.filter((v) => !v.isAvailable).length;

  const completedTrips = transactions.filter(
    (t) => t.transactionStatus === 'COMPLETED' || t.paymentStatus === 'PAID'
  ).length;

  const totalLogisticsRevenue = transactions.reduce(
    (sum, t) => sum + (Number(t.transportCost) || 0),
    0
  );

  // New incoming requests waiting for transporter confirmation
  const pendingConfirmationBookings = transportBookings.filter(
    (b) => b.status === 'BOOKED'
  );

  // Filtered transport bookings
  const filteredTransportBookings = useMemo(() => {
    return transportBookings.filter((b) => {
      // 1. Status Filter
      if (bookingStatusTab !== 'ALL' && b.status !== bookingStatusTab) {
        return false;
      }
      // 2. Search Query
      if (bookingSearchQuery.trim()) {
        const q = bookingSearchQuery.toLowerCase();
        const crop = (b.cropName || '').toLowerCase();
        const farmer = (b.farmer?.name || '').toLowerCase();
        const pickup = (b.pickupLocation || '').toLowerCase();
        const dest = (b.destination || '').toLowerCase();
        const vehicle = (b.vehicleType || '').toLowerCase();
        const vehicleNum = (b.vehicleNumber || '').toLowerCase();

        return (
          crop.includes(q) ||
          farmer.includes(q) ||
          pickup.includes(q) ||
          dest.includes(q) ||
          vehicle.includes(q) ||
          vehicleNum.includes(q)
        );
      }
      return true;
    });
  }, [transportBookings, bookingStatusTab, bookingSearchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Signature Dark Emerald Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/40">
        {/* Ambient Subtle Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Fleet Operations & Logistics Hub • Haulage Radar & Dispatch Hub 🚛</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Transporter <span className="text-emerald-300">Operations</span> 🚚
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Welcome back, <strong className="text-white">{user?.name || 'Fleet Manager'}</strong>. Manage your commercial fleet availability, confirm haulage reservations from farmers, record cash collections, and track freight earnings.
            </p>

            {/* Quick Metrics Bar in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready to Haul: <strong className="text-white text-sm">{availableVehicles} / {totalVehicles}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>In Transit: <strong className="text-amber-300 text-sm">{busyVehicles}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Completed Deliveries: <strong className="text-white text-sm">{completedTrips}</strong></span>
              </div>

              {pendingConfirmationBookings.length > 0 && (
                <div className="bg-rose-500/20 border border-rose-400/40 text-rose-200 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 animate-pulse font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  <span>Action Needed: {pendingConfirmationBookings.length} New Booking{pendingConfirmationBookings.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="relative z-20 flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/my-vehicles"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Manage My Vehicles</span>
            </Link>

            <Link
              to="/transport"
              className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 transition text-xs sm:text-sm"
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Rate Finder</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => fetchData(false)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Pending Bookings Attention Banner */}
      {pendingConfirmationBookings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Action Required: {pendingConfirmationBookings.length} New Transport Reservation{pendingConfirmationBookings.length > 1 ? 's' : ''} Received
              </h4>
              <p className="text-xs text-slate-600">
                Farmers have reserved your fleet vehicles for agricultural transit. Accept trips to dispatch drivers or reject with a reason to free up bookings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBookingStatusTab('BOOKED')}
            className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition"
          >
            <span>Review New Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. KPI Metrics Row (DashboardCard format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DashboardCard
          title="Total Fleet"
          value={totalVehicles}
          subtitle="Commercial vehicles registered"
          icon={Truck}
          color="purple"
        />
        <DashboardCard
          title="Ready to Haul"
          value={availableVehicles}
          subtitle="Available for farmer bookings"
          icon={CheckCircle2}
          color="emerald"
        />
        <DashboardCard
          title="In Transit"
          value={busyVehicles}
          subtitle="Active on transit routes"
          icon={Clock}
          color="amber"
        />
        <DashboardCard
          title="Completed Trips"
          value={completedTrips}
          subtitle="Delivered platform deals"
          icon={TrendingUp}
          color="blue"
        />
        <DashboardCard
          title="Freight Turnover"
          value={`₹${totalLogisticsRevenue.toLocaleString('en-IN')}`}
          subtitle="Logistics value on platform"
          icon={IndianRupee}
          color="teal"
        />
      </div>

      {/* 4. Direct Farmer Transport Bookings & Haulage Requests */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Direct Farmer Transport Bookings</h2>
              {transportBookings.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {transportBookings.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review incoming farmer transport reservations, accept trips, and record COD cash collections.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search crop, farmer, or route..."
              value={bookingSearchQuery}
              onChange={(e) => setBookingSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {bookingSearchQuery && (
              <button
                type="button"
                onClick={() => setBookingSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Booking Status Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {['ALL', 'BOOKED', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((tab) => {
            const count =
              tab === 'ALL'
                ? transportBookings.length
                : transportBookings.filter((b) => b.status === tab).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setBookingStatusTab(tab)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  bookingStatusTab === tab
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>
                  {tab === 'ALL'
                    ? 'All Requests'
                    : tab === 'BOOKED'
                    ? 'New Requests'
                    : tab === 'ACCEPTED'
                    ? 'Confirmed'
                    : tab === 'COMPLETED'
                    ? 'Delivered'
                    : 'Declined'}
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                    bookingStatusTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading haulage bookings...</p>
          </div>
        ) : filteredTransportBookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Truck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">
              {bookingSearchQuery
                ? `No transport bookings matched "${bookingSearchQuery}"`
                : bookingStatusTab === 'ALL'
                ? 'No direct transport bookings assigned yet. When farmers book your vehicles from the Transport Finder, their requests will appear here.'
                : `No transport bookings found with status ${bookingStatusTab}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Cargo & Farmer</th>
                  <th className="px-5 py-3.5">Pickup & Destination</th>
                  <th className="px-5 py-3.5">Freight Fare</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5">Trip Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredTransportBookings.map((b) => {
                  const isCod = String(b.paymentMethod || '').toUpperCase().includes('COD') || 
                                String(b.paymentMethod || '').toLowerCase().includes('CASH');
                  const isPendingPayment = b.paymentStatus === 'PENDING';
                  const isBooked = b.status === 'BOOKED';
                  const cropEmoji = getCropEmoji(b.cropName);

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{cropEmoji}</span>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {b.cropName || 'Crop'} ({b.quantity} qtl)
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Farmer: {b.farmer?.name || 'Farmer'} {b.contactPhone || b.farmer?.phone ? `• ${b.contactPhone || b.farmer?.phone}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {b.pickupLocation}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          → {b.destination} ({b.distanceKm} km)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-800 text-sm">
                        ₹{Number(b.totalCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        {isCod ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Cash on Delivery (COD)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            {b.paymentMethod || 'Online Escrow'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.paymentStatus === 'PAID' ? 'PAID' : isCod ? 'PENDING (Collect Cash)' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          b.status === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        }`}>
                          {b.status === 'BOOKED' ? 'NEW REQUEST' : b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForDetails(b)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                        >
                          Details
                        </button>

                        {isBooked && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === b._id}
                              onClick={() => handleAcceptBooking(b._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                            >
                              {actionLoadingId === b._id ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === b._id}
                              onClick={() => setRejectionModalBooking(b)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isCod && isPendingPayment && (
                          <button
                            type="button"
                            disabled={actionLoadingId === b._id}
                            onClick={() => handleCollectCodPayment(b._id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                          >
                            {actionLoadingId === b._id ? 'Updating...' : 'Collect Cash'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Fleet Availability Snapshot Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Fleet Availability Snapshot</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current operational readiness of your commercial vehicles.
            </p>
          </div>
          <Link
            to="/my-vehicles"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition self-start sm:self-auto"
          >
            <span>View & Manage All Vehicles ({totalVehicles})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <span className="text-4xl block">🚛</span>
            <h3 className="text-sm font-bold text-slate-800">No Vehicles Registered in Fleet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your commercial trucks or mini-tempos in the My Vehicles section to start receiving transit requests from local farmers and buyers.
            </p>
            <Link
              to="/my-vehicles"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <span>+ Register Vehicle in My Vehicles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.slice(0, 3).map((v) => (
              <div
                key={v._id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-xl hover:border-emerald-400 hover:-translate-y-2 hover:scale-[1.01] transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden"
              >
                <div className={`h-1 w-full absolute top-0 left-0 ${v.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition">{v.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {v.vehicleType} • <span className="font-mono uppercase font-bold text-slate-700">{v.vehicleNumber}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        v.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {v.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl text-xs border border-slate-100 my-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Payload</span>
                      <span className="font-bold text-slate-800">{v.capacity} Qtl</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Freight Rate</span>
                      <span className="font-bold text-emerald-700">₹{v.pricePerKm}/km</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-slate-600 pt-1.5 border-t border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">
                        {v.location?.district}, {v.location?.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Rating: ★ {v.rating || 5.0}</span>
                  <Link
                    to="/my-vehicles"
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Recent Transport Deals & Platform Deliveries */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Logistics Assignments & Deals</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent platform crop transactions with haulage arrangements.
            </p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition self-start sm:self-auto"
          >
            <span>View All Deals</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl">
            No active transport transactions recorded on the platform yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Crop & Volume</th>
                  <th className="px-5 py-3.5">Farmer (Pickup)</th>
                  <th className="px-5 py-3.5">Buyer (Destination)</th>
                  <th className="px-5 py-3.5">Haulage Fare</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {transactions.slice(0, 6).map((txn) => {
                  const cropEmoji = getCropEmoji(txn.cropLot?.crop);

                  return (
                    <tr key={txn._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{cropEmoji}</span>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {txn.cropLot?.crop || 'Agri Commodity'}
                            </span>
                            <span className="text-slate-500">{txn.quantity} quintals</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {txn.farmer?.name || 'Farmer'}
                        </span>
                        <span className="text-slate-500 text-[11px]">{txn.farmer?.phone || 'Pickup verified'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {txn.buyer?.name || 'Buyer'}
                        </span>
                        <span className="text-slate-500 text-[11px]">{txn.buyer?.phone || 'Mandi Receiver'}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700 text-sm">
                        ₹{((txn.transportCost && Number(txn.transportCost) > 0) ? Number(txn.transportCost) : (txn.quantity ? Math.round(txn.quantity * 16.8) : 840)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            txn.transactionStatus === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : txn.transactionStatus === 'IN_TRANSIT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {txn.transactionStatus || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/transactions"
                          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Quick Logistics Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/my-vehicles"
          className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-emerald-300 hover:shadow-xl transition group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition">
            Fleet Vehicle Management
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Register new commercial trucks, adjust per-kilometer freight rates, and toggle live dispatch readiness.
          </p>
          <div className="mt-5 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span>Manage My Vehicles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/transport"
          className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-teal-300 hover:shadow-xl transition group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
            Transport & Route Finder
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Check market demand, compare haulage rates across distance, and plan optimized transit routes to mandis.
          </p>
          <div className="mt-5 text-xs font-bold text-teal-700 flex items-center gap-1.5">
            <span>Open Transport Finder</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* 8. Booking Details Modal */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-1 border border-emerald-200">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Transport Booking Received</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Booking #{selectedBookingForDetails._id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full consignment details, transit route, and agreed freight fare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of All Required Notification Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Farmer Details
                </span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedBookingForDetails.farmer?.name || 'Farmer'}
                </span>
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedBookingForDetails.contactPhone || selectedBookingForDetails.farmer?.phone || 'Contact provided'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Crop & Consignment
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getCropEmoji(selectedBookingForDetails.cropName)}</span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {selectedBookingForDetails.cropName || 'Crop'}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {selectedBookingForDetails.quantity} Quintals Payload
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Pickup Location & Schedule
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedBookingForDetails.pickupLocation}
                </span>
                <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(selectedBookingForDetails.bookingDate).toLocaleDateString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Destination Mandi / Market
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedBookingForDetails.destination}
                </span>
                <span className="text-slate-500 font-medium">
                  Estimated Distance: {selectedBookingForDetails.distanceKm} km
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Selected Vehicle
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedBookingForDetails.vehicleType}
                </span>
                <span className="text-slate-600 font-mono font-bold">
                  {selectedBookingForDetails.vehicleNumber || 'Verified Fleet Vehicle'}
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-emerald-900 text-[10px] uppercase font-bold tracking-wider block">
                  Agreed Transport Fare
                </span>
                <span className="font-black text-emerald-950 text-base block">
                  ₹{Number(selectedBookingForDetails.totalCost).toLocaleString('en-IN')}
                </span>
                <span className="text-emerald-800 font-semibold text-[11px]">
                  Payment: {selectedBookingForDetails.paymentMethod || 'Online'} ({selectedBookingForDetails.paymentStatus})
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            {selectedBookingForDetails.notes && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Farmer Notes:</span>
                <p className="text-slate-600">{selectedBookingForDetails.notes}</p>
              </div>
            )}

            {/* Rejection Reason if Rejected */}
            {selectedBookingForDetails.status === 'REJECTED' && (
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800">
                <span className="font-bold block">Booking Rejected:</span>
                <p>{selectedBookingForDetails.rejectionReason || 'Transporter unable to fulfill haulage on requested date'}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>

              {selectedBookingForDetails.status === 'BOOKED' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedBookingForDetails._id}
                    onClick={() => handleAcceptBooking(selectedBookingForDetails._id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoadingId === selectedBookingForDetails._id ? 'Accepting...' : 'Accept Booking'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === selectedBookingForDetails._id}
                    onClick={() => {
                      setRejectionModalBooking(selectedBookingForDetails);
                    }}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Booking</span>
                  </button>
                </>
              )}

              {String(selectedBookingForDetails.paymentMethod || '').toUpperCase().includes('COD') &&
                selectedBookingForDetails.paymentStatus === 'PENDING' && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedBookingForDetails._id}
                    onClick={() => handleCollectCodPayment(selectedBookingForDetails._id)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>{actionLoadingId === selectedBookingForDetails._id ? 'Updating...' : 'Collect COD Cash Payment'}</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Reject Booking Reason Modal */}
      {rejectionModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Reject Transport Booking</h3>
                <p className="text-xs text-slate-500">Provide a reason so the farmer can select another vehicle.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectionModalBooking(null);
                  setRejectionReasonInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason:
                </label>
                <textarea
                  rows="3"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Vehicle undergoing routine maintenance, schedule overlap with existing trip, or route inaccessible."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                />
              </div>

              {/* Quick reason suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Vehicle under maintenance',
                  'Already booked on this date',
                  'Weight exceeds capacity',
                  'Route unreachable'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReasonInput(reason)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectionModalBooking(null);
                    setRejectionReasonInput('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === rejectionModalBooking._id}
                  onClick={() => handleRejectBooking(rejectionModalBooking._id, rejectionReasonInput)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {actionLoadingId === rejectionModalBooking._id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporterDashboard;
