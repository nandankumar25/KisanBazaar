import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FileText,
} from 'lucide-react';
import {
  getMandiById,
  getMandiPrices,
  getMandiDemands,
  getFarmerBookings,
} from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import SellCropAtMandiModal from '../components/SellCropAtMandiModal';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return `${d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} at ${d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const getStatusBadge = (status, rejectionReason, tokenNumber) => {
  const norm = (status || 'PENDING').toUpperCase();
  switch (norm) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 mr-1 text-amber-600 animate-pulse" />
          Pending Mandi Review
        </span>
      );
    case 'ACCEPTED':
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
          Accepted {tokenNumber ? `• Token: ${tokenNumber}` : ''}
        </span>
      );
    case 'ARRIVED':
    case 'QUALITY_CHECKED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <Store className="w-3 h-3 mr-1 text-blue-600" />
          At Mandi Yard
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1 text-green-700" />
          Completed & Confirmed
        </span>
      );
    case 'REJECTED':
      return (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200"
          title={rejectionReason ? `Reason: ${rejectionReason}` : 'Declined by Mandi'}
        >
          <XCircle className="w-3 h-3 mr-1 text-red-600" />
          Rejected {rejectionReason ? `(${rejectionReason})` : ''}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {norm}
        </span>
      );
  }
};

const MandiDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mandi, setMandi] = useState(null);
  const [prices, setPrices] = useState([]);
  const [demands, setDemands] = useState([]);
  const [farmerRequests, setFarmerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Dedicated Sell Crop at Mandi modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedCropForSale, setSelectedCropForSale] = useState(null);

  const fetchMandiData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        getMandiById(id),
        getMandiPrices({ mandi: id }),
        getMandiDemands({ mandi: id, status: 'OPEN' }).catch(() => ({ data: [] })),
      ];

      // If farmer or admin is logged in, also fetch farmer's sale requests
      if (user && (user.role === 'FARMER' || user.role === 'ADMIN')) {
        promises.push(getFarmerBookings().catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);
      const mandiRes = results[0];
      const pricesRes = results[1];
      const demandsRes = results[2];
      const bookingsRes = results[3];

      setMandi(mandiRes.data || null);
      setPrices(pricesRes.data || []);
      setDemands(demandsRes.data || []);

      if (bookingsRes && bookingsRes.data) {
        // Filter requests submitted to this specific mandi
        const filtered = (bookingsRes.data || []).filter(
          (b) =>
            (b.mandi?._id && b.mandi._id.toString() === id.toString()) ||
            (b.mandi && b.mandi.toString() === id.toString())
        );
        setFarmerRequests(filtered);
      }
    } catch (err) {
      console.error('Error fetching mandi details:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load mandi details and live prices. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMandiData();
    }
  }, [id, user]);

  // Aggregate crops procured by this mandi with actual reported prices
  const procuredCrops = useMemo(() => {
    if (!mandi) return [];

    const supportedList = Array.isArray(mandi.cropsSupported) ? mandi.cropsSupported : [];
    const priceCrops = prices.map((p) => p.crop).filter(Boolean);

    // Deduplicate (case-insensitive)
    const allCropNames = [];
    const seen = new Set();

    [...supportedList, ...priceCrops].forEach((cropName) => {
      const cleanName = cropName.trim();
      const lower = cleanName.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        allCropNames.push(cleanName);
      }
    });

    return allCropNames.map((cropName) => {
      const matchingPrices = prices.filter(
        (p) => p.crop && p.crop.toLowerCase().trim() === cropName.toLowerCase()
      );

      // Latest price is first
      const latestPrice = matchingPrices.length > 0 ? matchingPrices[0] : null;

      const matchingDemand = demands.find(
        (d) => d.crop && d.crop.toLowerCase().trim() === cropName.toLowerCase()
      );

      return {
        name: cropName,
        hasPrice: !!latestPrice,
        priceData: latestPrice,
        currentModalPrice: latestPrice?.modalPrice,
        minPrice: latestPrice?.minPrice,
        maxPrice: latestPrice?.maxPrice,
        qualityGrade: latestPrice?.qualityGrade || 'Grade A',
        priceSource: latestPrice?.priceSource || 'MANDI_ENTRY',
        isOfficiallyVerified: latestPrice?.isOfficiallyVerified || false,
        lastUpdated: latestPrice?.date || latestPrice?.updatedAt,
        demand: matchingDemand || null,
      };
    });
  }, [mandi, prices, demands]);

  // Open the dedicated Sell Crop at Mandi Form
  const handleOpenSellForm = (cropItem) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedCropForSale(cropItem);
    setSellModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Loading message="Loading Mandi details & live crop prices..." />
      </div>
    );
  }

  if (error || !mandi) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Available Mandis
        </button>
        <ErrorMessage
          message={error || 'Mandi details could not be found.'}
          onRetry={fetchMandiData}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Navigation / Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white border border-slate-200 hover:border-emerald-300 px-4 py-2.5 rounded-xl transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-emerald-600" />
          Back to Available Mandis
        </button>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchMandiData}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-2 rounded-xl transition shadow-xs"
            title="Refresh prices"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Refresh Rates
          </button>
          {procuredCrops.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSuccessMessage('');
                handleOpenSellForm(procuredCrops[0]);
              }}
              className="inline-flex items-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Sell Crop at This Mandi
            </button>
          )}
        </div>
      </div>

      {/* Success Confirmation Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Mandi Header & Details Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Main Title & Badges */}
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0 mt-1">
              <Store className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {mandi.mandiType || 'Government'} Mandi
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Verified Agricultural Yard
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {mandi.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-slate-400 shrink-0" />
                <span>
                  {mandi.city || mandi.district}, {mandi.state}
                  {mandi.district && mandi.district !== mandi.city ? ` (${mandi.district} District)` : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Sell Crop Action */}
          {procuredCrops.length > 0 && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenSellForm(procuredCrops[0])}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Sell Request to Mandi</span>
              </button>
            </div>
          )}
        </div>

        {/* Contact & Facility Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          {/* Address */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 block mb-0.5">Physical Address:</span>
              <p className="text-slate-600 leading-relaxed">
                {mandi.address || `${mandi.city || mandi.district}, ${mandi.state}`}
              </p>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 block mb-0.5">Operating Hours:</span>
              <p className="text-slate-700 font-medium">
                {mandi.operatingHours || '08:00 AM - 06:00 PM (Monday to Saturday)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Daily grain weighing & procurement</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block mb-0.5">Mandi Contact:</span>
              {mandi.contactPhone ? (
                <a
                  href={`tel:${mandi.contactPhone}`}
                  className="font-medium text-emerald-700 hover:underline flex items-center"
                >
                  {mandi.contactPhone}
                </a>
              ) : (
                <span className="text-slate-400">Phone not published</span>
              )}
              {mandi.contactEmail && (
                <a
                  href={`mailto:${mandi.contactEmail}`}
                  className="text-slate-500 hover:text-emerald-700 hover:underline flex items-center text-[11px]"
                >
                  <Mail className="w-3 h-3 mr-1 text-slate-400" />
                  {mandi.contactEmail}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Procured Crops & Live Prices Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Crops Procured & Current Market Rates</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review current prices and click "Sell Crop at This Mandi" to submit your selling request.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {procuredCrops.length} {procuredCrops.length === 1 ? 'Crop' : 'Crops'} Procured
          </span>
        </div>

        {procuredCrops.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No crop rates published yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This mandi has not yet published its current crop procurement prices.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-4 px-5">Crop Name</th>
                    <th className="py-4 px-4">Quality Grade</th>
                    <th className="py-4 px-4 text-right">Modal Rate (₹/q)</th>
                    <th className="py-4 px-4 text-right">Min Rate</th>
                    <th className="py-4 px-4 text-right">Max Rate</th>
                    <th className="py-4 px-4">Last Updated</th>
                    <th className="py-4 px-4">Rate Source</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {procuredCrops.map((item) => (
                    <tr
                      key={item.name}
                      className="hover:bg-emerald-50/40 transition duration-150 group"
                    >
                      {/* Crop Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <div>
                            <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition">
                              {item.name}
                            </span>
                            {item.demand && (
                              <span className="block text-[10px] text-emerald-700 font-semibold">
                                Actively Purchasing • {item.demand.requiredQuantity} quintals required
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-600">
                        {item.hasPrice ? item.qualityGrade : 'FAQ / Standard'}
                      </td>

                      {/* Modal Price */}
                      <td className="py-4 px-4 text-right font-mono">
                        {item.hasPrice && item.currentModalPrice !== undefined ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-base font-extrabold text-emerald-700">
                              {formatCurrency(item.currentModalPrice)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">per quintal</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            <AlertCircle className="w-3 h-3 mr-1 text-amber-600 shrink-0" />
                            Price currently unavailable
                          </span>
                        )}
                      </td>

                      {/* Min Price */}
                      <td className="py-4 px-4 text-right font-mono text-xs text-slate-600">
                        {item.hasPrice ? formatCurrency(item.minPrice) : '—'}
                      </td>

                      {/* Max Price */}
                      <td className="py-4 px-4 text-right font-mono text-xs text-slate-600">
                        {item.hasPrice ? formatCurrency(item.maxPrice) : '—'}
                      </td>

                      {/* Last Updated */}
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {item.hasPrice && item.lastUpdated ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatDateTime(item.lastUpdated)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-4 px-4 text-xs">
                        {item.hasPrice ? (
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.isOfficiallyVerified
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.isOfficiallyVerified ? 'Official MSP' : 'Mandi Reported'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not reported</span>
                        )}
                      </td>

                      {/* Action: Open Dedicated Sell Crop at Mandi Form */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenSellForm(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center space-x-1"
                        >
                          <span>Sell Crop at This Mandi</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Note Footer */}
            <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
              <p className="italic">
                * Prices shown are actual rates reported by verified mandi representatives.
              </p>
              <div className="flex items-center space-x-4 shrink-0">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                  Mandi Reported Rate
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Farmer's Submitted Requests at This Mandi */}
      {user && (user.role === 'FARMER' || user.role === 'ADMIN') && farmerRequests.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>My Sell Requests at This Mandi</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status, proposed rates, and arrival tokens assigned by {mandi.name}.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {farmerRequests.length} {farmerRequests.length === 1 ? 'Request' : 'Requests'}
            </span>
          </div>

          <div className="overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Request #</th>
                    <th className="py-3.5 px-4">Crop & Qty</th>
                    <th className="py-3.5 px-4">Quality Grade</th>
                    <th className="py-3.5 px-4 text-right">Asking Price</th>
                    <th className="py-3.5 px-4 text-right">Mandi Rate</th>
                    <th className="py-3.5 px-4">Arrival Date</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {farmerRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs">
                        {req.bookingNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                        {req.crop} • {req.quantity} Qtl
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {req.qualityGrade || 'Standard'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-mono font-semibold text-slate-800">
                        ₹{req.expectedPrice}/q
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-mono font-bold text-emerald-700">
                        {req.proposedPrice ? `₹${req.proposedPrice}/q` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(
                          req.scheduledArrivalDate || req.preferredArrivalDate
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(req.status, req.rejectionReason, req.tokenNumber)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Dedicated Sell Crop at Mandi Form Modal */}
      <SellCropAtMandiModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        mandi={mandi}
        cropData={selectedCropForSale}
        onSuccess={(data, msg) => {
          setSuccessMessage(msg || 'Sell request submitted successfully. Waiting for mandi approval.');
          fetchMandiData();
        }}
      />
    </div>
  );
};

export default MandiDetails;