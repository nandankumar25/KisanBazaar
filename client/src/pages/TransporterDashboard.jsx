import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getMyTransporterProfile, 
  getTransactions, 
  getTransportBookings,
  updateTransportStatus,
  updateTransportPayment
} from '../services/api';
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
  Calculator,
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
  FileText
} from 'lucide-react';

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
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [transporterRes, txnRes, bookingsRes] = await Promise.all([
        getMyTransporterProfile(),
        getTransactions(),
        getTransportBookings().catch(() => ({ data: [] })),
      ]);

      if (transporterRes.success) {
        setVehicles(transporterRes.data || []);
      }
      if (txnRes.success) {
        setTransactions(txnRes.data || []);
      }
      setTransportBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load transporter dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  // Handle Transporter Accepting Booking (Requirement 5, 6, 8)
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

  // Handle Transporter Rejecting Booking (Requirement 5, 6)
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

  // Handle Transporter Collecting COD Payment (Requirement 9)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 p-8 rounded-3xl text-white shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200">
            <Activity className="w-3.5 h-3.5" />
            <span>Transporter Operations & Logistics Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name || 'Transporter'}</h1>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Monitor your fleet capacity, live haulage assignments, freight revenue, and mandi transport trips in one central hub.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/my-vehicles"
            className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 active:scale-95"
          >
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>Manage My Vehicles</span>
          </Link>
          <Link
            to="/transport"
            className="px-4 py-3 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/30 rounded-2xl font-semibold text-sm transition flex items-center gap-1.5"
          >
            <span>Rate Finder</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Fleet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Fleet</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{totalVehicles}</div>
            <p className="text-xs text-slate-500 mt-1">Commercial vehicles registered</p>
          </div>
        </div>

        {/* Available for Dispatch */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ready to Haul</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-700">{availableVehicles}</div>
            <p className="text-xs text-slate-500 mt-1">Available for farmer bookings</p>
          </div>
        </div>

        {/* Busy / In Transit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">In Transit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-700">{busyVehicles}</div>
            <p className="text-xs text-slate-500 mt-1">Currently assigned to transit</p>
          </div>
        </div>

        {/* Completed Deliveries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Completed Trips</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-700">{completedTrips}</div>
            <p className="text-xs text-slate-500 mt-1">Delivered platform deals</p>
          </div>
        </div>

        {/* Total Freight Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Logistics Value</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-teal-800">
              ₹{totalLogisticsRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Freight turnover on platform</p>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Direct Farmer Transport Bookings & Haulage Requests (Requirements 7, 8, 9) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
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
        </div>

        {transportBookings.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No direct transport booking requests assigned yet. When farmers book your vehicles from the Transport Finder, their requests will appear here.
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
                {transportBookings.map((b) => {
                  const isCod = String(b.paymentMethod || '').toUpperCase().includes('COD') || 
                                String(b.paymentMethod || '').toLowerCase().includes('CASH');
                  const isPendingPayment = b.paymentStatus === 'PENDING';
                  const isBooked = b.status === 'BOOKED';

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block text-sm">
                          {b.cropName || 'Crop'} ({b.quantity} qtl)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Farmer: {b.farmer?.name || 'Farmer'} {b.contactPhone || b.farmer?.phone ? `• ${b.contactPhone || b.farmer?.phone}` : ''}
                        </span>
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
                            {b.paymentMethod || 'Online'}
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
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForDetails(b)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                        >
                          View Details
                        </button>

                        {isBooked && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === b._id}
                              onClick={() => handleAcceptBooking(b._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                            >
                              {actionLoadingId === b._id ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === b._id}
                              onClick={() => setRejectionModalBooking(b)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
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
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
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

      {/* Fleet Overview Snapshot Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
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

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Checking fleet readiness...</p>
          </div>
        ) : vehicles.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.slice(0, 3).map((v) => (
              <div
                key={v._id}
                className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200 p-5 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{v.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {v.vehicleType} • <span className="font-mono uppercase">{v.vehicleNumber}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        v.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {v.isAvailable ? 'Ready' : 'In Transit'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl text-xs border border-slate-100 my-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Payload</span>
                      <span className="font-bold text-slate-800">{v.capacity} Qtl</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Freight Rate</span>
                      <span className="font-bold text-emerald-700">₹{v.pricePerKm}/km</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-slate-600 pt-1 border-t border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {v.location?.district}, {v.location?.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Rating: ★ {v.rating || 5.0}</span>
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

      {/* Recent Transport Trips & Platform Deliveries */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
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
                {transactions.slice(0, 6).map((txn) => (
                  <tr key={txn._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block text-sm">
                        {txn.cropLot?.crop || 'Agri Commodity'}
                      </span>
                      <span className="text-slate-500">{txn.quantity} quintals</span>
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
                      ₹{(txn.transportCost || 0).toLocaleString('en-IN')}
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
                        to={`/transaction/${txn._id}`}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Logistics Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/my-vehicles"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition group block"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
            Fleet Vehicle Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Register new commercial trucks, adjust per-kilometer freight rates, and toggle live dispatch status.
          </p>
          <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">
            <span>Manage My Vehicles</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/transport"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition group block"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
            Transport & Route Finder
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Check market demand, compare haulage rates across distance, and plan optimized transit routes.
          </p>
          <div className="mt-4 text-xs font-bold text-teal-700 flex items-center gap-1">
            <span>Open Transport Finder</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/net-price"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition group block"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
            Net Price Calculator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Calculate accurate net farmer realization by deducting transit and handling charges.
          </p>
          <div className="mt-4 text-xs font-bold text-blue-700 flex items-center gap-1">
            <span>Calculate Freight Rates</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* Booking Details Modal (Opened via notification click or View Details button) */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-1 border border-emerald-200">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Transport Booking Received</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Booking Details #{selectedBookingForDetails._id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full consignment information, transit route, and agreed freight fare.
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
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Farmer Details
                </span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedBookingForDetails.farmer?.name || 'Farmer'}
                </span>
                <span className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedBookingForDetails.contactPhone || selectedBookingForDetails.farmer?.phone || 'Contact provided'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Crop & Consignment
                </span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedBookingForDetails.cropName || 'Crop'}
                </span>
                <span className="text-emerald-700 font-bold">
                  {selectedBookingForDetails.quantity} Quintals Payload
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
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

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Destination Mandi / Market
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedBookingForDetails.destination}
                </span>
                <span className="text-slate-500">
                  Estimated Distance: {selectedBookingForDetails.distanceKm} km
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Selected Vehicle
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedBookingForDetails.vehicleType}
                </span>
                <span className="text-slate-500 font-mono">
                  {selectedBookingForDetails.vehicleNumber || 'Verified Fleet Vehicle'}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
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
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Farmer Notes:</span>
                <p className="text-slate-600">{selectedBookingForDetails.notes}</p>
              </div>
            )}

            {/* Rejection Reason if Rejected */}
            {selectedBookingForDetails.status === 'REJECTED' && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                <span className="font-bold block">Booking Rejected:</span>
                <p>{selectedBookingForDetails.rejectionReason || 'Transporter unable to fulfill haulage on requested date'}</p>
              </div>
            )}

            {/* Action Buttons (Requirement 5 & 6: Accept Booking & Reject Booking) */}
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

      {/* Reject Booking Reason Modal (Requirement 5 & 6) */}
      {rejectionModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
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

              <div className="flex justify-end gap-2 pt-2">
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
