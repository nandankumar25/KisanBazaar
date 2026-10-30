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
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur">
            <Sprout className="w-3.5 h-3.5 text-emerald-300" />
            <span>KisanBazaar Farmer Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Good morning, Farmer!
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed mb-6">
            Find better prices, nearby markets and better selling opportunities across registered mandis.
          </p>
          <div className="flex flex-wrap items-center gap-3 relative z-20">
            <Link 
              to="/create-crop-lot"
              className="inline-flex items-center space-x-2 bg-white text-emerald-800 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-emerald-50 transition"
            >
              <Sprout className="w-5 h-5 text-emerald-600" />
              <span>+ Add New Crop Lot</span>
            </Link>

          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Sprout className="w-96 h-96 text-white" />
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
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <Link
            to="/mandi-prices"
            className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
              View Mandi Prices
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">Explore Rates →</span>
          </Link>

          <Link
            to="/my-crops"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
              My Crop Lots
            </span>
            <span className="text-[11px] text-blue-600 font-semibold mt-1">Manage Listings →</span>
          </Link>

          <Link
            to="/find-buyers"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-amber-700">
              Find Buyers
            </span>
            <span className="text-[11px] text-amber-600 font-semibold mt-1">Match Produce →</span>
          </Link>

          <Link
            to="/transport"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-purple-700">
              Find Transport
            </span>
            <span className="text-[11px] text-purple-600 font-semibold mt-1">Book Trucks →</span>
          </Link>

          <Link
            to="/transactions"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
              Transactions
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">Crop Deals →</span>
          </Link>

          <Link
            to="/payments"
            className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-center flex flex-col items-center group"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
              Payments
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">Track Refunds →</span>
          </Link>

        </div>
      </section>

      {/* Mandi Sale Bookings Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>My Mandi Sale Requests & Yard Deliveries</span>
              {farmerBookings.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {farmerBookings.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">Track arrival tokens, weighment slips, and settlement payments</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMandiForBooking(null);
              setBookingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-fit"
          >
            <Store className="w-3.5 h-3.5" />
            <span>+ New Mandi Sale Booking</span>
          </button>
        </div>

        {farmerBookings.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            You have not submitted any crop sale requests to local mandis yet. Click "+ New Mandi Sale Booking" to connect with verified mandis.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Mandi Yard</th>
                  <th className="px-5 py-3.5">Crop & Qty</th>
                  <th className="px-5 py-3.5">Token & Schedule</th>
                  <th className="px-5 py-3.5">Weighment & Payout</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Logistics & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmerBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{b.mandi?.name || 'Mandi Yard'}</div>
                      <div className="text-xs text-slate-500">{b.mandi?.city || b.mandi?.district}, {b.mandi?.state}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-emerald-800">{b.cropName}</div>
                      <div className="text-xs text-slate-600">Est: {b.estimatedQuantity} Qtl ({b.qualityGrade})</div>
                    </td>
                    <td className="px-5 py-4">
                      {b.tokenNumber ? (
                        <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit border border-indigo-200">
                          {b.tokenNumber}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Token Pending</span>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        Arrival: {b.scheduledArrivalDate ? new Date(b.scheduledArrivalDate).toLocaleDateString() : new Date(b.preferredArrivalDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {b.actualQuantity ? (
                        <div>
                          <div>Weighed: <strong className="text-slate-900">{b.actualQuantity} Qtl</strong></div>
                          <div className="font-bold text-emerald-700">₹{b.finalPayableAmount?.toLocaleString()}</div>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Payment: {b.paymentStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Expected: ₹{b.expectedPricePerQuintal || '—'}/Qtl</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        b.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : b.status === 'REJECTED'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : b.status === 'QUALITY_CHECKED'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : b.status === 'ARRIVED'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : b.status === 'ACCEPTED'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(() => {
                        const latestTransport = getLatestTransportForMandiBooking(b._id);
                        const tStatus = latestTransport?.status;

                        // Case 1: Pending or Accepted -> "Cancel Transport"
                        if (tStatus === 'BOOKED' || tStatus === 'ACCEPTED') {
                          return (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                tStatus === 'ACCEPTED' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                Transport: {tStatus === 'ACCEPTED' ? 'Confirmed' : 'Pending'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalBooking(latestTransport);
                                  setCancellationReasonInput('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cancel Transport</span>
                              </button>
                            </div>
                          );
                        }

                        // Case 2: Completed -> "View Details"
                        if (tStatus === 'COMPLETED') {
                          return (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                Transport: Completed
                              </span>
                              <button
                                type="button"
                                onClick={() => setDetailsModalBooking(latestTransport)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-sm"
                              >
                                <Info className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Details</span>
                              </button>
                            </div>
                          );
                        }

                        // Case 3: Rejected, Cancelled, or No active booking -> "Book Transport"
                        // Note: Always "Book Transport", never "Book Transport Again"
                        return (
                          <div className="flex flex-col items-end gap-1.5">
                            {tStatus === 'REJECTED' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  Prev: Rejected {['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(latestTransport.refundStatus) ? `(Refund: ₹${latestTransport.refundAmount})` : ''}
                                </span>
                                {latestTransport.refundStatus && latestTransport.refundStatus !== 'NOT_APPLICABLE' && (
                                  <Link
                                    to={`/payment-status?transportId=${latestTransport._id}`}
                                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition"
                                  >
                                    Payment Status
                                  </Link>
                                )}
                              </div>
                            )}
                            {tStatus === 'CANCELLED' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  Prev: Cancelled {['REFUNDED', 'REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_INITIATED'].includes(latestTransport.refundStatus) ? `(Refund: ₹${latestTransport.refundAmount})` : ''}
                                </span>
                                {latestTransport.refundStatus && latestTransport.refundStatus !== 'NOT_APPLICABLE' && (
                                  <Link
                                    to={`/payment-status?transportId=${latestTransport._id}`}
                                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition"
                                  >
                                    Payment Status
                                  </Link>
                                )}
                              </div>
                            )}
                            <Link
                              to={`/transport?destination=${encodeURIComponent(b.mandi?.name || 'Mandi Yard')}&crop=${encodeURIComponent(b.cropName)}&distance=35&quantity=${b.actualQuantity || b.estimatedQuantity || ''}&mandiBookingId=${b._id}&cropLot=${b.cropLot?._id || b.cropLot || ''}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Book Transport</span>
                            </Link>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* D. Recent Mandi Prices */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Mandi Prices</h2>
            <p className="text-xs text-slate-500">Live crop market rates reported by local mandis</p>
          </div>
          <Link
            to="/mandi-prices"
            className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            View All Mandi Prices <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentPrices.length > 0 ? (
          <PriceTable prices={recentPrices} />
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No recent prices available.
          </div>
        )}
      </section>

      {/* E. Available Mandis Section */}
      <section id="available-mandis" className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Available Mandis</h2>
            <p className="text-xs text-slate-500">Verified regional grain markets and agricultural yards</p>
          </div>

          {/* Mandi Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mandi or city..."
              value={mandiSearch}
              onChange={(e) => setMandiSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredMandis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No mandis found matching "{mandiSearch}".
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
