import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Store, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowRight,
  Info,
  Search,
  CheckCircle,
  X,
  XCircle,
  Receipt,
  AlertTriangle,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote,
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import PriceTable from '../components/PriceTable';
import MandiCard from '../components/MandiCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import FarmerMandiBookingModal from '../components/FarmerMandiBookingModal';
import FarmingBannerAnimation from '../components/FarmingBannerAnimation';
import { useAuth } from '../context/AuthContext';
import { 
  getCropLots, 
  getMandis, 
  getMandiPrices, 
  getTransporters, 
  getFarmerBookings,
  getTransportBookings,
  cancelTransportBooking,
} from '../services/api';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    cropLotsCount: 0,
    mandisCount: 0,
    pricesCount: 0,
    transportersCount: 0,
  });
  const [recentPrices, setRecentPrices] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [mandiSearch, setMandiSearch] = useState('');
  const [farmerBookings, setFarmerBookings] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMandiForBooking, setSelectedMandiForBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [detailsModalBooking, setDetailsModalBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const farmerId = user?._id;
      const [lotsData, mandisData, pricesData, transportersData, bookingsData, transportsData] = await Promise.all([
        getCropLots({ status: 'AVAILABLE' }),
        getMandis(),
        getMandiPrices(),
        getTransporters({ isAvailable: 'true' }),
        getFarmerBookings().catch(() => ({ data: [] })),
        farmerId
          ? getTransportBookings({ farmer: farmerId }).catch(() => ({ data: [] }))
          : getTransportBookings().catch(() => ({ data: [] })),
      ]);

      setStats({
        cropLotsCount: lotsData.count || (lotsData.data ? lotsData.data.length : 0),
        mandisCount: mandisData.count || (mandisData.data ? mandisData.data.length : 0),
        pricesCount: pricesData.count || (pricesData.data ? pricesData.data.length : 0),
        transportersCount: transportersData.count || (transportersData.data ? transportersData.data.length : 0),
      });

      setRecentPrices(pricesData.data ? pricesData.data.slice(0, 5) : []);
      setMandis(mandisData.data || []);
      setFarmerBookings(bookingsData.data || []);
      setTransportBookings(transportsData.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load market data. Please ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?._id]);

  const getLatestTransportForMandiBooking = (mandiBookingId) => {
    if (!mandiBookingId || !transportBookings.length) return null;
    const matching = transportBookings.filter(
      (t) => (t.mandiBooking?._id || t.mandiBooking)?.toString() === mandiBookingId.toString()
    );
    if (!matching.length) return null;

    // First priority: active booking (BOOKED, ACCEPTED, IN_TRANSIT)
    const active = matching.find((t) => ['BOOKED', 'ACCEPTED', 'IN_TRANSIT'].includes(t.status));
    if (active) return active;

    // Otherwise return the latest booking (sorted by createdAt or bookingDate descending)
    const sorted = [...matching].sort(
      (a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate)
    );
    return sorted[0];
  };

  const handleConfirmCancelTransport = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelLoading(true);
      const res = await cancelTransportBooking(cancelModalBooking._id, {
        cancellationReason: cancellationReasonInput.trim() || undefined,
      });

      if (res.success || res.data) {
        setCancelModalBooking(null);
        setCancellationReasonInput('');
        setToastMessage('Transport booking cancelled successfully. Any applicable refund has been processed.');
        setTimeout(() => setToastMessage(null), 5000);
        await fetchDashboardData();
      } else {
        alert(res.message || 'Failed to cancel transport booking.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      alert(err.response?.data?.message || 'Failed to cancel transport booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleActionClick = (actionName) => {
    setToastMessage(`"${actionName}" feature is coming soon in the next module!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredMandis = mandis.filter(mandi => 
    mandi.name.toLowerCase().includes(mandiSearch.toLowerCase()) ||
    mandi.city.toLowerCase().includes(mandiSearch.toLowerCase()) ||
    mandi.district.toLowerCase().includes(mandiSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-center space-x-3 text-sm animate-bounce">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* A. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-700/50">
        {/* Ambient subtle glow lights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Text & Actions Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Sprout className="w-3.5 h-3.5 text-emerald-300" />
              <span>KisanBazaar Agritech • Direct Mandi Trade</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Namaste, <span className="text-emerald-300">{user?.name ? user.name.split(' ')[0] : 'Kisan Bhai'}</span>! 🌾
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
              Connect directly with verified APMC mandis and commercial buyers across Punjab. Get fair MSP realizations, zero middleman charges, and transparent transport booking.
            </p>

            {/* Value props badge strip */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs text-emerald-200 font-medium">
              <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Verified Mandis</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Direct Escrow Payments</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>On-Demand Transport</span>
              </div>
            </div>

            {/* Primary & Secondary Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3.5 relative z-20">
              <Link
                to="/create-crop-lot"
                className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/50 hover:from-emerald-300 hover:to-teal-300 hover:-translate-y-0.5 transition-all text-sm group"
              >
                <Sprout className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>+ Add New Crop Lot</span>
              </Link>

              <Link
                to="/mandi-prices"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-2xl backdrop-blur-md border border-white/20 transition-all text-sm hover:-translate-y-0.5"
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>Explore Today's Mandi Rates</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Right Farming Animation Scene */}
          <div className="hidden md:flex lg:col-span-5 relative w-full h-[240px] sm:h-[270px] items-center justify-center">
            <FarmingBannerAnimation />
          </div>
        </div>
      </div>

      {/* B. Quick Statistics */}
      {loading ? (
        <Loading message="Fetching mandi prices and market statistics..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DashboardCard
            title="Available Crop Lots"
            value={stats.cropLotsCount}
            subtitle="Active farmer listings"
            icon={Sprout}
            color="emerald"
          />
          <DashboardCard
            title="Nearby Mandis"
            value={stats.mandisCount}
            subtitle="Registered Punjab markets"
            icon={Store}
            color="blue"
          />
          <DashboardCard
            title="Today's Mandi Prices"
            value={stats.pricesCount}
            subtitle="Sample rates recorded"
            icon={TrendingUp}
            color="amber"
          />
          <DashboardCard
            title="Available Transporters"
            value={stats.transportersCount}
            subtitle="Ready for crop hauling"
            icon={Truck}
            color="purple"
          />
        </div>
      )}

      {/* C. Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kisan Quick Services
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">One-click Farmer Tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <Link
            to="/mandi-prices"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <TrendingUp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition">
              Mandi Prices
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Live market rates</span>
            <span className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              Check Rates →
            </span>
          </Link>

          <Link
            to="/my-crops"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition">
              My Crop Lots
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Manage harvest lots</span>
            <span className="text-[10px] font-bold text-blue-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              View Lots →
            </span>
          </Link>

          <Link
            to="/find-buyers"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md shadow-amber-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition">
              Find Buyers
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Direct offer matching</span>
            <span className="text-[10px] font-bold text-amber-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              Meet Buyers →
            </span>
          </Link>

          <Link
            to="/transport"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-2xl shadow-md shadow-purple-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Truck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition">
              Find Transport
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Book nearby trucks</span>
            <span className="text-[10px] font-bold text-purple-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              Book Trucks →
            </span>
          </Link>

          <Link
            to="/transactions"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-700 text-white rounded-2xl shadow-md shadow-teal-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Receipt className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition">
              Crop Deals
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Confirmed contracts</span>
            <span className="text-[10px] font-bold text-teal-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              Track Deals →
            </span>
          </Link>

          <Link
            to="/payments"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-rose-400/90 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="p-3.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl shadow-md shadow-rose-500/25 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 group-hover:text-rose-700 transition">
              Payments
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Payouts & Refunds</span>
            <span className="text-[10px] font-bold text-rose-600 mt-2 flex items-center group-hover:translate-x-0.5 transition-transform">
              View Ledger →
            </span>
          </Link>
        </div>
      </section>

      {/* D. Recent Mandi Prices */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Recent Mandi Prices</h2>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>Live Today</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Live crop market rates recorded by regional Punjab mandis</p>
            </div>
          </div>
          <Link
            to="/mandi-prices"
            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition border border-emerald-200/80"
          >
            <span>View All Mandi Rates</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>

        {recentPrices.length > 0 ? (
          <PriceTable prices={recentPrices} />
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            No recent prices available.
          </div>
        )}
      </section>

      {/* E. Available Mandis Section */}
      <section id="available-mandis" className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Available Mandis</h2>
              <p className="text-xs text-slate-500">Verified regional grain markets and APMC yards in Punjab</p>
            </div>
          </div>

          {/* Mandi Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mandi, city, or district..."
              value={mandiSearch}
              onChange={(e) => setMandiSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition"
            />
          </div>
        </div>

        {filteredMandis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMandis.map((mandi) => (
              <MandiCard
                key={mandi._id}
                mandi={mandi}
                onBookSale={(m) => {
                  setSelectedMandiForBooking(m);
                  setBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-600">No mandis found matching "{mandiSearch}".</p>
          </div>
        )}
      </section>

      {/* Farmer Booking Modal */}
      <FarmerMandiBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialMandi={selectedMandiForBooking}
        onBookingSuccess={() => {
          fetchDashboardData();
        }}
      />

      {/* Cancel Transport Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Cancel Transport Booking</h3>
                  <p className="text-xs text-slate-500">
                    Booking #{cancelModalBooking._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancelModalBooking(null);
                  setCancellationReasonInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Warning Message */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-900 leading-relaxed font-medium">
              Are you sure you want to cancel this transport booking? Any applicable refund will be processed according to the payment status.
            </div>

            {/* Booking Details Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Transporter:</span>
                <strong className="text-slate-800">
                  {cancelModalBooking.transporter?.name || 'Verified Transporter'}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Consignment:</span>
                <strong className="text-slate-800">
                  {cancelModalBooking.cropName} ({cancelModalBooking.quantity} qtl)
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Agreed Fare:</span>
                <strong className="text-emerald-700 font-bold">
                  ₹{Number(cancelModalBooking.totalCost || 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-800">
                  {cancelModalBooking.paymentMethod || 'COD'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Status:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  cancelModalBooking.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {cancelModalBooking.paymentStatus}
                </span>
              </div>

              {/* Dynamic Refund Notice */}
              <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                {cancelModalBooking.paymentStatus === 'PAID' && !String(cancelModalBooking.paymentMethod || '').includes('COD') ? (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      An automatic refund of ₹{Number(cancelModalBooking.paidAmount || cancelModalBooking.totalCost || 0).toLocaleString('en-IN')} will be initiated to your original payment method.
                    </span>
                  </p>
                ) : (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Payment mode was Cash on Delivery (COD). No online deduction occurred, so no refund is applicable.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Optional Cancellation Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Cancellation (Optional):
              </label>
              <textarea
                rows="2"
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                placeholder="e.g. Schedule changed, selected different transport, or self-delivering to mandi."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => {
                  setCancelModalBooking(null);
                  setCancellationReasonInput('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancelTransport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transport Details Modal */}
      {detailsModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Transport Booking Details</h3>
                  <p className="text-xs text-slate-500">
                    Booking #{detailsModalBooking._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Timing */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Status</span>
                <span className="font-bold text-slate-900">{detailsModalBooking.status}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Booking Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(detailsModalBooking.bookingDate || detailsModalBooking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Transporter & Logistics Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transporter:</span>
                <span className="font-bold text-slate-800">
                  {detailsModalBooking.transporter?.name || 'Verified Transporter'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-semibold text-slate-800">
                  {detailsModalBooking.vehicleType || detailsModalBooking.transporter?.vehicleType || 'Truck'} ({detailsModalBooking.vehicleNumber || detailsModalBooking.transporter?.vehicleNumber || 'Verified'})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Crop Consignment:</span>
                <span className="font-bold text-emerald-800">
                  {detailsModalBooking.cropName} ({detailsModalBooking.quantity} quintals)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pickup Location:</span>
                <span className="text-slate-800 font-medium text-right max-w-[240px] truncate">
                  {detailsModalBooking.pickupLocation}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Destination Mandi:</span>
                <span className="text-slate-800 font-medium text-right max-w-[240px] truncate">
                  {detailsModalBooking.destination}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Distance & Fare:</span>
                <span className="font-bold text-slate-900">
                  {detailsModalBooking.distanceKm} km • ₹{Number(detailsModalBooking.totalCost || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Refund & Payment Breakdown */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 text-xs space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span>Payment & Refund Summary</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  detailsModalBooking.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : detailsModalBooking.paymentStatus === 'REFUNDED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {detailsModalBooking.paymentStatus}
                </span>
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Original Payment Amount:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(detailsModalBooking.paidAmount || detailsModalBooking.totalCost || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{detailsModalBooking.paymentMethod || 'COD'}</span>
              </div>
              {detailsModalBooking.transactionReference && (
                <div className="flex justify-between text-slate-600">
                  <span>Payment Ref:</span>
                  <span className="font-mono text-slate-700">{detailsModalBooking.transactionReference}</span>
                </div>
              )}

              {/* Refund Info */}
              {detailsModalBooking.refundStatus && detailsModalBooking.refundStatus !== 'NOT_APPLICABLE' && (
                <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Refund Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      {detailsModalBooking.refundStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Refund Amount:</span>
                    <span className="font-bold text-emerald-800">
                      ₹{Number(detailsModalBooking.refundAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {detailsModalBooking.refundTransactionId && (
                    <div className="flex justify-between text-slate-700">
                      <span>Refund Transaction ID:</span>
                      <span className="font-mono text-slate-800 font-bold">{detailsModalBooking.refundTransactionId}</span>
                    </div>
                  )}
                  {detailsModalBooking.refundInitiatedAt && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Initiated At:</span>
                      <span>{new Date(detailsModalBooking.refundInitiatedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {detailsModalBooking.refundCompletedAt && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Completed At:</span>
                      <span>{new Date(detailsModalBooking.refundCompletedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {detailsModalBooking.rejectionReason && (
                <div className="pt-2 border-t border-rose-200 text-rose-800 text-[11px]">
                  <strong>Transporter Rejection Reason:</strong> {detailsModalBooking.rejectionReason}
                </div>
              )}
              {detailsModalBooking.cancellationReason && (
                <div className="pt-2 border-t border-slate-200 text-slate-700 text-[11px]">
                  <strong>Cancellation Reason:</strong> {detailsModalBooking.cancellationReason}
                </div>
              )}

              {detailsModalBooking.refundStatus && detailsModalBooking.refundStatus !== 'NOT_APPLICABLE' && (
                <div className="pt-2">
                  <Link
                    to={`/payment-status?transportId=${detailsModalBooking._id}`}
                    onClick={() => setDetailsModalBooking(null)}
                    className="w-full block text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    View Live Payment & Refund Tracking
                  </Link>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailsModalBooking(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FarmerDashboard;
