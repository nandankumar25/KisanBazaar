import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCropLots } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  IndianRupee, 
  Sprout, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  Tag,
  X,
  RefreshCw,
  Sparkles,
  Building2,
  Package,
  Layers,
  Activity,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CROPS = [
  { name: 'ALL', label: 'All Crops', icon: '🌱' },
  { name: 'Wheat', label: 'Wheat', icon: '🌾' },
  { name: 'Rice', label: 'Rice', icon: '🍚' },
  { name: 'Maize', label: 'Maize', icon: '🌽' },
  { name: 'Potato', label: 'Potato', icon: '🥔' },
  { name: 'Mustard', label: 'Mustard', icon: '🟡' },
  { name: 'Cotton', label: 'Cotton', icon: '☁️' },
  { name: 'Sugarcane', label: 'Sugarcane', icon: '🎋' },
  { name: 'Soybean', label: 'Soybean', icon: '🫘' },
  { name: 'Onion', label: 'Onion', icon: '🧅' },
  { name: 'Tomato', label: 'Tomato', icon: '🍅' },
];

const getCropEmoji = (cropName) => {
  const map = {
    wheat: '🌾',
    rice: '🍚',
    paddy: '🌾',
    maize: '🌽',
    corn: '🌽',
    potato: '🥔',
    mustard: '🟡',
    cotton: '☁️',
    sugarcane: '🎋',
    soybean: '🫘',
    onion: '🧅',
    tomato: '🍅',
    chilli: '🌶️',
    barley: '🌾',
    gram: '🫘',
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

const FindCrops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cropLots, setCropLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await getCropLots({ status: 'AVAILABLE' });
      setCropLots(res.data || []);
      setError(null);
    } catch (err) {
      setError('Unable to fetch available crop lots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  // Extract unique filter options dynamically
  const uniqueStates = useMemo(() => {
    return ['ALL', ...new Set(cropLots.map((lot) => lot.location?.state).filter(Boolean))];
  }, [cropLots]);

  const uniqueGrades = useMemo(() => {
    return ['ALL', ...new Set(cropLots.map((lot) => lot.qualityGrade).filter(Boolean))];
  }, [cropLots]);

  // Filtered lots
  const filteredLots = useMemo(() => {
    return cropLots.filter((lot) => {
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (lot.crop || '').toLowerCase().includes(term) ||
        (lot.location?.district || '').toLowerCase().includes(term) ||
        (lot.location?.state || '').toLowerCase().includes(term) ||
        (lot.farmer?.name || '').toLowerCase().includes(term) ||
        (lot.variety || '').toLowerCase().includes(term);

      const matchesCrop = selectedCrop === 'ALL' || (lot.crop || '').toLowerCase() === selectedCrop.toLowerCase();
      const matchesState = selectedState === 'ALL' || lot.location?.state === selectedState;
      const matchesGrade = selectedGrade === 'ALL' || lot.qualityGrade === selectedGrade;

      return matchesSearch && matchesCrop && matchesState && matchesGrade;
    });
  }, [cropLots, searchQuery, selectedCrop, selectedState, selectedGrade]);

  // Overall Sourcing KPIs
  const kpiStats = useMemo(() => {
    const totalVolume = filteredLots.reduce((acc, lot) => acc + (Number(lot.quantity) || 0), 0);
    const avgPrice = filteredLots.length > 0 
      ? Math.round(filteredLots.reduce((acc, lot) => acc + (Number(lot.expectedPrice) || 0), 0) / filteredLots.length) 
      : 0;
    const uniqueFarmers = new Set(filteredLots.map(lot => lot.farmer?._id || lot.farmer?.name).filter(Boolean)).size;
    const uniqueDistricts = new Set(filteredLots.map(lot => lot.location?.district).filter(Boolean)).size;

    return {
      totalVolume,
      avgPrice,
      uniqueFarmers,
      uniqueDistricts,
    };
  }, [filteredLots]);

  const hasActiveFilters = Boolean(
    searchQuery || selectedCrop !== 'ALL' || selectedState !== 'ALL' || selectedGrade !== 'ALL'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCrop('ALL');
    setSelectedState('ALL');
    setSelectedGrade('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Signature Hero Header Banner */}
      <div className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-emerald-800/40 shadow-xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30 backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE BUYER SOURCING PORTAL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Buyer Sourcing Dashboard</span>
              <span className="text-2xl sm:text-3xl">🛒</span>
            </h1>

            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Source verified farmgate crop produce directly from farmers across regional mandis. Compare quality grades, negotiate terms, and lock in escrow deals.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <Link
              to={user?.role === 'BUYER' ? '/my-offers' : '/offers'}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-950/40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Active Bids & Offers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/transactions"
                className="flex-1 text-center px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-md"
              >
                Fulfilled Deals
              </Link>
              <Link
                to="/mandi-prices"
                className="flex-1 text-center px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-md"
              >
                Mandi Rates
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Procurement KPI Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Available Lots */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Listings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {filteredLots.length} Lots
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Ready for instant procurement
          </span>
        </div>

        {/* Card 2: Total Volume */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Volume</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {kpiStats.totalVolume.toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-500">Qtl</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across verified farm lots
          </span>
        </div>

        {/* Card 3: Avg Farmgate Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Expected Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
            ₹{kpiStats.avgPrice.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Per quintal modal benchmark
          </span>
        </div>

        {/* Card 4: Verified Farmers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Farmers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {kpiStats.uniqueFarmers} Sellers
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {kpiStats.uniqueDistricts} farming districts
          </span>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* 3. Commodity Filter Pill Carousel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Commodity to Source:</span>
            </span>
            {selectedCrop !== 'ALL' && (
              <button
                onClick={() => setSelectedCrop('ALL')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                Clear crop filter
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {CROPS.map((crop) => {
              const isSelected = selectedCrop === crop.name;
              return (
                <button
                  key={crop.name}
                  onClick={() => setSelectedCrop(crop.name)}
                  className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <span className="text-sm">{crop.icon}</span>
                  <span>{crop.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Inputs Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop, farmer, district..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="ALL">All States</option>
              {uniqueStates.filter(s => s !== 'ALL').map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Quality Grade Filter */}
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="ALL">All Quality Grades</option>
              {uniqueGrades.filter(g => g !== 'ALL').map((grade) => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchLots}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Refresh Produce</span>
          </button>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
            <div className="flex items-center space-x-2 text-slate-600 flex-wrap gap-y-1">
              <span className="font-bold text-slate-900">Active Filters:</span>
              {selectedCrop !== 'ALL' && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold">
                  Crop: {selectedCrop}
                </span>
              )}
              {selectedState !== 'ALL' && (
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-semibold">
                  State: {selectedState}
                </span>
              )}
              {selectedGrade !== 'ALL' && (
                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                  Grade {selectedGrade}
                </span>
              )}
              {searchQuery && (
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 font-semibold">
                  "{searchQuery}"
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Crop Lots Grid Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Available Farm Produce ({filteredLots.length})
          </h2>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            Verified Farmer Lots
          </span>
        </div>
      </div>

      {/* 5. Crop Lot Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
          <Loading message="Syncing available farmer listings..." />
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-inner">
            🌱
          </div>
          <h3 className="text-base font-bold text-slate-800">No crop lots match your criteria</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Try adjusting your search terms or resetting filters above to discover more produce listings.
          </p>
          <div className="pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredLots.map((lot) => {
            const cropEmoji = getCropEmoji(lot.crop);

            return (
              <div
                key={lot._id}
                className="group relative bg-white rounded-3xl shadow-xs border border-slate-200/90 hover:shadow-xl hover:border-emerald-400/90 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent Gradient Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 group-hover:h-2 transition-all duration-300" />

                <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Row: Crop Avatar + Name + Grade & Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100/90 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                          {cropEmoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors truncate">
                              {lot.crop}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                              Grade {lot.qualityGrade || 'A'}
                            </span>
                          </div>
                          {lot.variety && (
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                              Variety: <span className="font-bold text-slate-700">{lot.variety}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>AVAILABLE</span>
                      </span>
                    </div>

                    {/* Farmer Seller & Farm Location Tile */}
                    <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Farmer (Seller)</span>
                        <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                          <User className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                          <span className="truncate">{lot.farmer?.name || 'Verified Farmer'}</span>
                        </span>
                        {lot.farmer?.phone && (
                          <span className="text-slate-500 block text-[11px] mt-0.5 ml-4.5 truncate">{lot.farmer.phone}</span>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Farmgate Location</span>
                        <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                          <span className="truncate">{lot.location?.district || lot.location?.city || 'Punjab'}</span>
                        </span>
                        <span className="text-slate-500 block text-[11px] mt-0.5 ml-4.5 truncate">
                          {lot.location?.state || 'India'}
                        </span>
                      </div>
                    </div>

                    {/* Dual-Metric Quantity & Rate Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Available Lot
                        </span>
                        <div className="text-base font-black text-slate-900 flex items-center mt-0.5">
                          <Package className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                          <span>{lot.quantity}</span>
                          <span className="text-xs font-semibold text-slate-500 ml-1 uppercase">{lot.unit || 'qtl'}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/90 hover:bg-emerald-50 transition">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                          Expected Rate
                        </span>
                        <div className="text-base font-black text-emerald-900 flex items-center mt-0.5 font-mono">
                          <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{lot.expectedPrice?.toLocaleString('en-IN')}</span>
                          <span className="text-xs font-semibold text-emerald-700 ml-1">/{lot.unit || 'qtl'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Harvest / Ready Date & Description */}
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ready: <strong>{lot.availableFrom ? new Date(lot.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ready for pickup'}</strong></span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        Farmgate Direct
                      </span>
                    </div>

                    {lot.description && (
                      <p className="mt-2 text-slate-600 italic bg-slate-50/70 p-2 rounded-xl text-[11px] line-clamp-1 border border-slate-100">
                        "{lot.description}"
                      </p>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-3">
                    <Link
                      to={`/crop-lot/${lot._id}`}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs hover:shadow-md"
                    >
                      <span>Make Offer & Procure</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to={`/messages?user=${lot.farmer?._id || ''}`}
                      className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition shadow-2xs"
                      title="Chat with Farmer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindCrops;
