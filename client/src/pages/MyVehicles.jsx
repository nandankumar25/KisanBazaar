import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyTransporterProfile,
  createTransporterProfile,
  updateTransporterProfile,
} from '../services/api';
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
} from 'lucide-react';

const MyVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'BUSY'

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

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyTransporterProfile();
      if (res.success) {
        setVehicles(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load your fleet vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleToggleAvailability = async (vehicleId, currentStatus) => {
    try {
      const res = await updateTransporterProfile(vehicleId, { isAvailable: !currentStatus });
      if (res.success) {
        setVehicles((prev) =>
          prev.map((v) => (v._id === vehicleId ? { ...v, isAvailable: !currentStatus } : v))
        );
        setSuccessMsg(
          `Vehicle status updated to ${!currentStatus ? 'Available for bookings' : 'Unavailable/In Transit'}!`
        );
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to update vehicle availability.');
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
        setSuccessMsg('Vehicle successfully added to your fleet!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add new vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location?.district?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'AVAILABLE' && v.isAvailable) ||
      (statusFilter === 'BUSY' && !v.isAvailable);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-800 p-8 rounded-3xl text-white shadow-sm">
        <div>
          <Link
            to="/transporter-dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-3xl font-extrabold tracking-tight">My Vehicles</h1>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
              {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </span>
          </div>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            Register your transport fleet, set competitive per-kilometer freight rates, and toggle live availability for crop haulage bookings.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-md transition shrink-0 flex items-center justify-center gap-2 active:scale-95"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4 text-slate-600" />
              <span>Close Form</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>+ Add Vehicle</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Register Vehicle Modal / Form */}
      {showAddForm && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-emerald-200 animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Register New Commercial Vehicle</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide vehicle registration, payload capacity, and operating mandi district.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddVehicle} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Fleet / Operator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  placeholder="Kisan Express Transport"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newVehicle.phone}
                  onChange={(e) => setNewVehicle({ ...newVehicle, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle Type / Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tata 407 / Eicher 10.75"
                  value={newVehicle.vehicleType}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="PB-10-AB-1234"
                  value={newVehicle.vehicleNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payload Capacity (Quintals) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="60"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Base Rate / KM (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="28"
                  value={newVehicle.pricePerKm}
                  onChange={(e) => setNewVehicle({ ...newVehicle, pricePerKm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Operating State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Punjab"
                  value={newVehicle.state}
                  onChange={(e) => setNewVehicle({ ...newVehicle, state: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Operating District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ludhiana"
                  value={newVehicle.district}
                  onChange={(e) => setNewVehicle({ ...newVehicle, district: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Base City / Mandi Hub (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Khanna Mandi"
                  value={newVehicle.city}
                  onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Confirm & Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vehicle number, type, or district..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({vehicles.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Available ({vehicles.filter((v) => v.isAvailable).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('BUSY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              statusFilter === 'BUSY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            In Transit ({vehicles.filter((v) => !v.isAvailable).length})
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div>
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <div className="w-9 h-9 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-600">Loading your vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <span className="text-5xl block">🚛</span>
            <h3 className="text-lg font-bold text-slate-800">No Vehicles Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {vehicles.length === 0
                ? 'You have not registered any vehicles yet. Add your trucks to receive transport requests from farmers and mandi buyers.'
                : 'No vehicles match your current search or status filter.'}
            </p>
            {vehicles.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition active:scale-95"
              >
                Add Your First Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((v) => (
              <div
                key={v._id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{v.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {v.vehicleNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">• {v.vehicleType}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        v.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {v.isAvailable ? '✓ Available' : '⏳ In Transit'}
                    </span>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block font-medium">Payload Capacity</span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                        <Scale className="w-3.5 h-3.5 text-slate-500" />
                        {v.capacity} Quintals
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Rate / KM</span>
                      <span className="font-bold text-emerald-700 text-sm flex items-center gap-1 mt-0.5">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />₹{v.pricePerKm} /km
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Operating Hub</span>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {v.location?.district || 'Hub'}, {v.location?.state}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Contact Phone</span>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {v.phone || user?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Status: <strong className="text-slate-700">{v.isAvailable ? 'Open for bookings' : 'Occupied'}</strong>
                  </span>
                  <button
                    onClick={() => handleToggleAvailability(v._id, v.isAvailable)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                      v.isAvailable
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Set {v.isAvailable ? 'Unavailable' : 'Available'}
                  </button>
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
