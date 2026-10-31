import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyTransporterProfile,
  createTransporterProfile,
  updateTransporterProfile,
} from '../services/api';
import DashboardCard from '../components/DashboardCard';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Phone,
  MapPin,
  Scale,
  IndianRupee,
  Shield,
  ArrowLeft,
  X,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Star
} from 'lucide-react';

const MyVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'BUSY'
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Add vehicle modal/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: user?.name ? `${user.name} Logistics` : 'Fleet Logistics',
    phone: user?.phone || '',
    vehicleType: '',
    vehicleNumber: '',
    capacity: '',
    pricePerKm: '',
    state: user?.location?.state || '',
    district: user?.location?.district || '',
    city: user?.location?.city || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const fetchVehicles = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');
      const res = await getMyTransporterProfile();
      if (res.success) {
        setVehicles(res.data || []);
      }
    } catch (err) {
      console.error(err);
      if (showLoading) {
        setError('Unable to load your fleet vehicles.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles(true);
  }, []);

  const handleToggleAvailability = async (vehicleId, currentStatus) => {
    try {
      setToggleLoadingId(vehicleId);
      const res = await updateTransporterProfile(vehicleId, { isAvailable: !currentStatus });
      if (res.success) {
        setVehicles((prev) =>
          prev.map((v) => (v._id === vehicleId ? { ...v, isAvailable: !currentStatus } : v))
        );
        setSuccessMsg(
          `Vehicle status updated to ${!currentStatus ? 'Available' : 'Unavailable'}!`
        );
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to update vehicle availability.');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (
      !newVehicle.vehicleType ||
      !newVehicle.vehicleNumber ||
      !newVehicle.capacity ||
      !newVehicle.pricePerKm ||
      !newVehicle.state ||
      !newVehicle.district
    ) {
      setError('Please fill in all mandatory vehicle specifications and location details.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await createTransporterProfile({
        name: newVehicle.name,
        phone: newVehicle.phone || user?.phone,
        vehicleType: newVehicle.vehicleType.trim(),
        vehicleNumber: newVehicle.vehicleNumber.trim().toUpperCase(),
        capacity: Number(newVehicle.capacity),
        pricePerKm: Number(newVehicle.pricePerKm),
        location: {
          state: newVehicle.state.trim(),
          district: newVehicle.district.trim(),
          city: newVehicle.city.trim(),
        },
      });

      if (res.success) {
        setVehicles((prev) => [...prev, res.data]);
        setShowAddForm(false);
        setNewVehicle({
          name: user?.name ? `${user.name} Logistics` : 'Fleet Logistics',
          phone: user?.phone || '',
          vehicleType: '',
          vehicleNumber: '',
          capacity: '',
          pricePerKm: '',
          state: user?.location?.state || '',
          district: user?.location?.district || '',
          city: user?.location?.city || '',
        });
        setSuccessMsg('Vehicle successfully registered in your commercial fleet!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add new vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fleet Statistics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.isAvailable).length;
  const busyVehicles = vehicles.filter((v) => !v.isAvailable).length;
  const totalFleetCapacity = vehicles.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        !searchQuery ||
        v.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.state?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AVAILABLE' && v.isAvailable) ||
        (statusFilter === 'BUSY' && !v.isAvailable);

      const matchesType =
        typeFilter === 'ALL' ||
        v.vehicleType?.toLowerCase().includes(typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. High-Aesthetic Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/40">
        {/* Subtle Ambient Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Back Link & Live Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/transporter-dashboard"
                className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Transporter Dashboard</span>
              </Link>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Commercial Fleet Management 🚛</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              My Fleet & <span className="text-emerald-300">Vehicles</span> 🚚
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Register commercial vehicles, configure competitive per-kilometer freight pricing, and toggle live dispatch readiness to accept haulage orders from local farmers and mandis.
            </p>

            {/* Quick Metrics Bar in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Truck className="w-3.5 h-3.5 text-purple-400" />
                <span>Total Fleet: <strong className="text-white text-sm">{totalVehicles}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Available: <strong className="text-emerald-300 text-sm">{availableVehicles}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Unavailable: <strong className="text-amber-300 text-sm">{busyVehicles}</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-20 flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm active:scale-95"
            >
              {showAddForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Register Vehicle</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fetchVehicles(false)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Fleet"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. KPI Metrics Row (DashboardCard format matching user screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardCard
          title="Total Fleet"
          value={totalVehicles}
          subtitle="Commercial vehicles registered"
          icon={Truck}
          color="purple"
        />
        <DashboardCard
          title="Available"
          value={availableVehicles}
          subtitle="Available for farmer bookings"
          icon={CheckCircle2}
          color="emerald"
        />
        <DashboardCard
          title="Unavailable"
          value={busyVehicles}
          subtitle="Active on routes / maintenance"
          icon={Clock}
          color="amber"
        />
        <DashboardCard
          title="Combined Capacity"
          value={`${totalFleetCapacity} Qtl`}
          subtitle="Total fleet payload capacity"
          icon={Scale}
          color="teal"
        />
      </div>

      {/* 3. Register Vehicle Modal / Form */}
      {showAddForm && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-300/80 animate-in fade-in zoom-in-98 duration-150 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-1 border border-emerald-200">
                <Truck className="w-3.5 h-3.5" />
                <span>Commercial Fleet Enrollment</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">Register New Commercial Vehicle</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide vehicle registration, payload capacity, and operating territory.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddVehicle} className="space-y-6">
            {/* Quick Vehicle Type Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Quick Select Vehicle Category:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Mini Truck (Tata Ace)', cap: 15, rate: 22 },
                  { name: 'Pickup (Bolero Maxi Truck)', cap: 25, rate: 26 },
                  { name: 'Medium Truck (Tata 407)', cap: 60, rate: 32 },
                  { name: 'Heavy Truck (Eicher 10.75)', cap: 110, rate: 45 },
                  { name: 'Tractor Trolley', cap: 45, rate: 28 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNewVehicle((prev) => ({
                        ...prev,
                        vehicleType: preset.name,
                        capacity: String(preset.cap),
                        pricePerKm: String(preset.rate),
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      newVehicle.vehicleType === preset.name
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.name} ({preset.cap} Qtl)
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fleet / Operator Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  placeholder="Kisan Express Transport"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newVehicle.phone}
                  onChange={(e) => setNewVehicle({ ...newVehicle, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Vehicle Type / Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tata 407 / Eicher 10.75"
                  value={newVehicle.vehicleType}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="PB-10-AB-1234"
                  value={newVehicle.vehicleNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Payload Capacity (Quintals) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="60"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Base Rate / KM (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="28"
                  value={newVehicle.pricePerKm}
                  onChange={(e) => setNewVehicle({ ...newVehicle, pricePerKm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Operating State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Punjab"
                  value={newVehicle.state}
                  onChange={(e) => setNewVehicle({ ...newVehicle, state: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Operating District <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ludhiana"
                  value={newVehicle.district}
                  onChange={(e) => setNewVehicle({ ...newVehicle, district: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Base City / Mandi Hub (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Khanna Mandi"
                  value={newVehicle.city}
                  onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Confirm & Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Filter and Search Toolbar */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by registration number, model, district..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Fleet ({vehicles.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available ({availableVehicles})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('BUSY')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
              statusFilter === 'BUSY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Unavailable ({busyVehicles})</span>
          </button>
        </div>
      </div>

      {/* 5. Vehicles Grid */}
      <div>
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 space-y-3">
            <div className="w-9 h-9 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading your fleet vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Truck className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">No Vehicles Found</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {vehicles.length === 0
                  ? 'You have not registered any vehicles yet. Add your trucks to receive transport requests from farmers and mandi buyers.'
                  : 'No vehicles match your current search or status filter.'}
              </p>
            </div>
            {vehicles.length === 0 ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Register Your First Vehicle</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((v) => (
              <div
                key={v._id}
                className="group relative bg-white rounded-3xl shadow-xs border border-slate-200/90 hover:shadow-2xl hover:border-emerald-400/90 hover:-translate-y-2 hover:scale-[1.01] transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent Gradient Strip */}
                <div
                  className={`h-1.5 w-full transition-all duration-300 group-hover:h-2 ${
                    v.isAvailable
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                  }`}
                />

                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Row: Vehicle Avatar + Name + Number & Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs border ${
                            v.isAvailable
                              ? 'bg-emerald-50/80 border-emerald-100/90 text-emerald-700'
                              : 'bg-amber-50/80 border-amber-100/90 text-amber-700'
                          }`}
                        >
                          🚛
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors truncate">
                            {v.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                              {v.vehicleNumber}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              • {v.vehicleType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-extrabold rounded-full shadow-2xs shrink-0 ${
                          v.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            v.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span>{v.isAvailable ? 'Available' : 'Unavailable'}</span>
                      </span>
                    </div>

                    {/* Specifications Deck */}
                    <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Payload Capacity
                        </span>
                        <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{v.capacity} Quintals</span>
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Freight Rate
                        </span>
                        <span className="font-black text-emerald-700 text-sm flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>₹{v.pricePerKm}/km</span>
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Operating Hub
                        </span>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{v.location?.district || 'Hub'}, {v.location?.state}</span>
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Contact Phone
                        </span>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{v.phone || user?.phone || 'Verified'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Rating: {v.rating || 5.0}</span>
                    </div>

                    <button
                      type="button"
                      disabled={toggleLoadingId === v._id}
                      onClick={() => handleToggleAvailability(v._id, v.isAvailable)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50 ${
                        v.isAvailable
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 hover:shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-md'
                      }`}
                    >
                      {toggleLoadingId === v._id
                        ? 'Updating...'
                        : v.isAvailable
                        ? 'Set Unavailable'
                        : 'Set Available'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehicles;
