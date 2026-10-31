import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCropLots, deleteCropLot } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Search, 
  Sprout, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Calendar,
  DollarSign,
  Scale,
  Sparkles,
  Layers,
  Banknote,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getCropTheme = (cropName) => {
  const c = (cropName || '').toLowerCase();
  if (c.includes('wheat') || c.includes('kanak')) {
    return {
      emoji: '🌾',
      gradient: 'from-amber-950 via-amber-900 to-yellow-950',
      accent: 'text-amber-300',
      borderAccent: 'hover:border-amber-400',
      badge: 'Rabi Harvest',
    };
  }
  if (c.includes('rice') || c.includes('paddy') || c.includes('basmati')) {
    return {
      emoji: '🍚',
      gradient: 'from-emerald-950 via-emerald-900 to-teal-950',
      accent: 'text-emerald-300',
      borderAccent: 'hover:border-emerald-400',
      badge: 'Kharif Harvest',
    };
  }
  if (c.includes('mustard') || c.includes('sarson') || c.includes('oil')) {
    return {
      emoji: '🌼',
      gradient: 'from-yellow-950 via-amber-900 to-yellow-900',
      accent: 'text-yellow-300',
      borderAccent: 'hover:border-yellow-400',
      badge: 'Oilseed Crop',
    };
  }
  if (c.includes('potato') || c.includes('aalu')) {
    return {
      emoji: '🥔',
      gradient: 'from-orange-950 via-stone-900 to-amber-950',
      accent: 'text-amber-300',
      borderAccent: 'hover:border-orange-400',
      badge: 'Cash Tuber Crop',
    };
  }
  if (c.includes('maize') || c.includes('makka')) {
    return {
      emoji: '🌽',
      gradient: 'from-yellow-950 via-amber-900 to-emerald-950',
      accent: 'text-yellow-300',
      borderAccent: 'hover:border-yellow-400',
      badge: 'Cereal Grain',
    };
  }
  if (c.includes('cotton') || c.includes('kapas')) {
    return {
      emoji: '🌿',
      gradient: 'from-teal-950 via-slate-900 to-emerald-950',
      accent: 'text-teal-300',
      borderAccent: 'hover:border-teal-400',
      badge: 'Commercial Fiber',
    };
  }
  return {
    emoji: '🌱',
    gradient: 'from-emerald-950 via-teal-900 to-emerald-900',
    accent: 'text-emerald-300',
    borderAccent: 'hover:border-emerald-400',
    badge: 'Seasonal Harvest',
  };
};

const MyCrops = () => {
  const { user } = useAuth();
  const [cropLots, setCropLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const farmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;

  const fetchCropLots = async () => {
    try {
      setLoading(true);
      const res = await getCropLots({ farmer: farmerId, status: 'ALL' });
      setCropLots(res.data || []);
      setError(null);
    } catch (err) {
      setError('Unable to load your crop lots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCropLots();
  }, []);

  const handleDelete = async (id, status) => {
    if (status === 'SOLD') return;
    
    if (window.confirm('Are you sure you want to delete this crop lot? This will cancel any active buyer discovery.')) {
      try {
        await deleteCropLot(id);
        fetchCropLots();
      } catch (err) {
        alert('Error deleting crop lot.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          pill: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
          dot: 'bg-emerald-400 animate-pulse',
          label: 'Active For Sale',
        };
      case 'RESERVED':
        return {
          pill: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
          dot: 'bg-amber-400 animate-pulse',
          label: 'Reserved Deal',
        };
      case 'SOLD':
        return {
          pill: 'bg-slate-500/25 text-slate-300 border-slate-400/40',
          dot: 'bg-slate-400',
          label: 'Sold Out',
        };
      default:
        return {
          pill: 'bg-white/20 text-white border-white/20',
          dot: 'bg-white',
          label: status,
        };
    }
  };

  const filteredLots = cropLots.filter((lot) => {
    const matchesSearch = 
      lot.crop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.qualityGrade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.location?.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.location?.village?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals for stats strip
  const totalValue = cropLots.reduce((acc, curr) => {
    const price = Number(curr.expectedPrice || 0);
    const qty = Number(curr.quantity || 0);
    return acc + (price * qty);
  }, 0);

  const availableCount = cropLots.filter(l => l.status === 'AVAILABLE').length;
  const reservedCount = cropLots.filter(l => l.status === 'RESERVED').length;
  const soldCount = cropLots.filter(l => l.status === 'SOLD').length;

  if (loading) return <Loading message="Loading your crop lots..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCropLots} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Page Header & Key Inventory Highlights */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-700/50">
        {/* Ambient Subtle Lighting Orbs */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Sprout className="w-3.5 h-3.5 text-emerald-300" />
              <span>Farmer Crop Inventory • Direct Trade Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              My Crop <span className="text-emerald-300">Lots</span> 🌾
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Manage your harvest listings, set competitive expected prices, and receive direct purchase offers from verified APMC mandis and commercial grain buyers.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Total Listings: <strong className="text-white text-sm">{cropLots.length}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Est. Harvest Value: <strong className="text-amber-300 text-sm">₹{totalValue.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Primary Call to Action Button */}
          <div className="relative z-20 shrink-0">
            <Link 
              to="/create-crop-lot"
              className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/50 hover:from-emerald-300 hover:to-teal-300 hover:-translate-y-0.5 transition-all text-sm group"
            >
              <Plus className="w-5 h-5 text-slate-950 stroke-[2.8] group-hover:rotate-90 transition-transform duration-300" />
              <span>+ Add New Crop Lot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Search Strip */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All Crops ({cropLots.length})
          </button>
          <button
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available ({availableCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('RESERVED')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'RESERVED'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Reserved ({reservedCount})</span>
          </button>
          {soldCount > 0 && (
            <button
              onClick={() => setStatusFilter('SOLD')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'SOLD'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sold ({soldCount})</span>
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crop, grade, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition"
          />
        </div>
      </div>

      {/* 3. Crop Lots Card Grid */}
      {filteredLots.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-inner text-emerald-700">
            <Sprout className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {searchTerm || statusFilter !== 'ALL' ? 'No matching crop lots found' : 'No crop lots listed yet'}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? `Try clearing your search query "${searchTerm}" or switching the status filter.`
              : 'List your harvested produce here with quantity, quality grade, and expected MSP prices to start receiving competitive buyer bids.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {searchTerm || statusFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Clear Filters
              </button>
            ) : (
              <Link 
                to="/create-crop-lot"
                className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md shadow-emerald-600/20 transition text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                <span>Create Your First Crop Listing</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredLots.map((lot) => {
            const statusConfig = getStatusBadge(lot.status);
            const theme = getCropTheme(lot.crop);

            return (
              <div 
                key={lot._id} 
                className={`group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-2xl ${theme.borderAccent} hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  {/* Card Cover Header with Crop-Specific Aesthetic Theme */}
                  <div className={`relative bg-gradient-to-br ${theme.gradient} text-white p-4 sm:p-5 overflow-hidden`}>
                    {/* Ambient Glow Orb */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                    {/* Top Row: Crop Tag & Status Badge */}
                    <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-black/30 text-emerald-200 border border-white/15 backdrop-blur-md">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        <span>{theme.badge}</span>
                      </span>

                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border backdrop-blur-md ${statusConfig.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    {/* Crop Emoji Icon, Title & Variety */}
                    <div className="relative z-10 flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                        {theme.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-white text-lg group-hover:text-emerald-300 transition-colors leading-snug truncate">
                          {lot.crop}
                        </h3>
                        <p className={`text-xs ${theme.accent} font-bold flex items-center mt-0.5 truncate`}>
                          <span>Grade {lot.qualityGrade || 'A'}</span>
                          {lot.variety && (
                            <>
                              <span className="mx-1.5 opacity-60">•</span>
                              <span className="truncate">{lot.variety}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Details Body (Compact) */}
                  <div className="p-4 space-y-3">
                    {/* Quantity & Expected Rate Dual Tiles */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Quantity
                        </span>
                        <div className="text-sm font-black text-slate-900 flex items-center space-x-1 mt-0.5">
                          <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{lot.quantity}</span>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">{lot.unit || 'qtl'}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/90 hover:bg-emerald-50 transition">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Expected Rate
                        </span>
                        <div className="text-sm font-black text-emerald-800 flex items-center space-x-1 mt-0.5">
                          <span>₹{Number(lot.expectedPrice || 0).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-semibold text-emerald-700">/{lot.unit || 'qtl'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Farm Location & Ready Date Strip */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium text-slate-700">
                      <div className="flex items-center space-x-1.5 truncate mr-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold text-slate-900">
                          {lot.location?.district || 'Punjab'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{lot.availableFrom ? new Date(lot.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ready'}</span>
                      </span>
                    </div>

                    {/* Description snippet if provided */}
                    {lot.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-100/60">
                        "{lot.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar (Compact) */}
                <div className="p-3.5 bg-gradient-to-b from-slate-50/50 to-slate-100/80 border-t border-slate-100 space-y-2">
                  {lot.status === 'AVAILABLE' && (
                    <button 
                      onClick={() => navigate(`/find-buyers?cropLot=${lot._id}`)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Find Verified Buyers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {lot.status === 'RESERVED' && (
                    <button 
                      onClick={() => navigate(`/transactions`)}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
                    >
                      <span>View Active Deal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => lot.status !== 'SOLD' && navigate(`/edit-crop-lot/${lot._id}`)}
                      disabled={lot.status === 'SOLD'}
                      className="flex-1 py-1.5 px-2.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 bg-white rounded-xl transition border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(lot._id, lot.status)}
                      disabled={lot.status === 'SOLD'}
                      className="py-1.5 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 bg-white rounded-xl transition border border-rose-200/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                      title="Delete Crop Lot"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
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

export default MyCrops;
