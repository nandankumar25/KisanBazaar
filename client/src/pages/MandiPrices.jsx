import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter, 
  Tag, 
  Info, 
  Calendar, 
  RefreshCw,
  Store,
  LineChart as LineChartIcon,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
  SlidersHorizontal,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import PriceTable from '../components/PriceTable';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import FarmerMandiBookingModal from '../components/FarmerMandiBookingModal';
import { getMandiPrices, getMandiPriceTrends, getMandis } from '../services/api';

const CROPS = [
  { name: 'All', icon: '🌱' },
  { name: 'Wheat', icon: '🌾' },
  { name: 'Rice', icon: '🍚' },
  { name: 'Maize', icon: '🌽' },
  { name: 'Potato', icon: '🥔' },
  { name: 'Mustard', icon: '🟡' },
  { name: 'Cotton', icon: '☁️' },
  { name: 'Sugarcane', icon: '🎋' },
  { name: 'Soybean', icon: '🫘' },
  { name: 'Onion', icon: '🧅' },
  { name: 'Tomato', icon: '🍅' },
];

const MandiPrices = () => {
  const [prices, setPrices] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [errorPrices, setErrorPrices] = useState(null);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandi, setSelectedMandi] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Historical Trends
  const [trendCrop, setTrendCrop] = useState('Wheat');
  const [trendData, setTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(false);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMandiForBooking, setSelectedMandiForBooking] = useState(null);

  const fetchPrices = async () => {
    try {
      setLoadingPrices(true);
      setErrorPrices(null);

      const params = {};
      if (selectedCrop !== 'All') params.crop = selectedCrop;
      if (selectedState) params.state = selectedState;
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedMandi) params.mandi = selectedMandi;

      const [pricesRes, mandisRes] = await Promise.all([
        getMandiPrices(params),
        getMandis(),
      ]);

      setPrices(pricesRes.data || []);
      setMandis(mandisRes.data || []);
    } catch (err) {
      console.error('Error loading mandi prices:', err);
      setErrorPrices('Unable to load mandi prices. Please ensure backend is connected.');
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchTrends = async (cropName) => {
    try {
      setLoadingTrend(true);
      const res = await getMandiPriceTrends(cropName);
      
      const formatted = (res.data || []).map((item) => ({
        date: item.date ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today',
        modalPrice: item.modalPrice,
        mandi: item.mandi?.name || 'Mandi',
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
      }));

      setTrendData(formatted);
    } catch (err) {
      console.error('Error loading price trends:', err);
    } finally {
      setLoadingTrend(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedCrop, selectedState, selectedDistrict, selectedMandi]);

  useEffect(() => {
    fetchTrends(trendCrop);
  }, [trendCrop]);

  // Client-side text search filter
  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const term = searchTerm.toLowerCase();
      const cropMatches = (item.crop || '').toLowerCase().includes(term);
      const mandiMatches = (item.mandi?.name || '').toLowerCase().includes(term);
      const cityMatches = (item.mandi?.city || '').toLowerCase().includes(term);
      const districtMatches = (item.mandi?.district || '').toLowerCase().includes(term);
      return cropMatches || mandiMatches || cityMatches || districtMatches;
    });
  }, [prices, searchTerm]);

  // Dynamic Market Overview Stats
  const marketStats = useMemo(() => {
    const list = filteredPrices.length > 0 ? filteredPrices : prices;
    if (!list || list.length === 0) {
      return { avgModal: 0, maxPrice: 0, totalMandis: mandis.length || 0, totalCrops: 0 };
    }

    const avgModal = Math.round(list.reduce((acc, cur) => acc + (Number(cur.modalPrice) || 0), 0) / list.length);
    const maxPrice = Math.max(...list.map(p => Number(p.maxPrice) || Number(p.modalPrice) || 0));
    const uniqueMandis = new Set(list.map(p => p.mandi?._id || p.mandi?.name).filter(Boolean)).size;
    const uniqueCrops = new Set(list.map(p => p.crop)).size;

    return {
      avgModal,
      maxPrice: maxPrice > 0 ? maxPrice : avgModal,
      totalMandis: uniqueMandis || mandis.length,
      totalCrops: uniqueCrops,
    };
  }, [filteredPrices, prices, mandis]);

  // Check if any filters are currently active
  const hasActiveFilters = Boolean(
    selectedCrop !== 'All' || selectedState || selectedDistrict || selectedMandi || searchTerm
  );

  const resetFilters = () => {
    setSelectedCrop('All');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMandi('');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Signature Hero Banner */}
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
              <span>LIVE APMC MARKET RATES & TRENDS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Mandi Market Intelligence</span>
              <span className="text-2xl sm:text-3xl">🌾</span>
            </h1>

            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Explore real-time modal prices, minimum & maximum yard bids, and historical price movements reported across verified agricultural mandis.
            </p>
          </div>

          {/* Header Action Button */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedMandiForBooking(null);
                setBookingModalOpen(true);
              }}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Store className="w-4 h-4" />
              <span>Book & Sell Crops to a Mandi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <span className="text-[11px] text-emerald-300/70 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% MSP & Yard Guarantee</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Market Overview Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Stat 1: Avg Modal Price */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Modal Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            ₹{marketStats.avgModal.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {filteredPrices.length} reported lots
          </span>
        </div>

        {/* Stat 2: Peak Auction Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peak Recorded Bid</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
            ₹{marketStats.maxPrice.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Highest rate reported today
          </span>
        </div>

        {/* Stat 3: Mandis Reporting */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Mandi Yards</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {marketStats.totalMandis} APMCs
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Government registered yards
          </span>
        </div>

        {/* Stat 4: Monitored Commodities */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Crops Tracked</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {marketStats.totalCrops || CROPS.length - 1} Crops
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Updated with daily trade feeds
          </span>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Control Deck */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        
        {/* Crop Pills with Agricultural Icons */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Commodity Filter:</span>
            </span>
            {selectedCrop !== 'All' && (
              <button 
                onClick={() => setSelectedCrop('All')} 
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
                  onClick={() => {
                    setSelectedCrop(crop.name);
                    if (crop.name !== 'All') setTrendCrop(crop.name);
                  }}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <span className="text-sm">{crop.icon}</span>
                  <span>{crop.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search crop, mandi, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
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
              <option value="">All States</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
            </select>
          </div>

          {/* District Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="">All Districts</option>
              <option value="Jalandhar">Jalandhar</option>
              <option value="Kapurthala">Kapurthala</option>
              <option value="Ludhiana">Ludhiana</option>
              <option value="Amritsar">Amritsar</option>
              <option value="Bathinda">Bathinda</option>
              <option value="Patiala">Patiala</option>
            </select>
          </div>

          {/* Mandi Select */}
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="">All Mandis</option>
              {mandis.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.city || m.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-bold text-slate-900">Active Filters:</span>
              {selectedCrop !== 'All' && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold">
                  {selectedCrop}
                </span>
              )}
              {selectedState && (
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-semibold">
                  State: {selectedState}
                </span>
              )}
              {selectedDistrict && (
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-semibold">
                  District: {selectedDistrict}
                </span>
              )}
              {searchTerm && (
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 font-semibold">
                  "{searchTerm}"
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Price Trend Visual Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <LineChartIcon className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {trendCrop} Modal Price Trajectory
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                APMC History
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Historical auction modal prices reported across key regional yards.
            </p>
          </div>

          {/* Quick Crop Switcher for Trend */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Track Commodity:</span>
            <select
              value={trendCrop}
              onChange={(e) => setTrendCrop(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {CROPS.filter(c => c.name !== 'All').map(c => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 sm:h-72 w-full pt-3">
          {loadingTrend ? (
            <Loading message="Loading price trend chart..." />
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={['auto', 'auto']} 
                  unit=" ₹" 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-extrabold text-emerald-400">{trendCrop} • {label}</p>
                          <p className="text-slate-300 font-medium">{data.mandi}</p>
                          <div className="pt-1 border-t border-slate-800 flex justify-between gap-4 font-mono">
                            <span className="text-slate-400">Modal Rate:</span>
                            <span className="font-black text-white text-sm">₹{data.modalPrice?.toLocaleString('en-IN')}</span>
                          </div>
                          {data.minPrice && (
                            <div className="text-[11px] text-slate-400 flex justify-between gap-4 font-mono">
                              <span>Range:</span>
                              <span>₹{data.minPrice} - ₹{data.maxPrice}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="modalPrice" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#priceGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
              <span className="text-2xl">📊</span>
              <span>No trade history recorded yet for {trendCrop}.</span>
            </div>
          )}
        </div>

        {/* Market Advisory Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              <strong className="font-bold">Farmer Tip:</strong> Sorting and cleaning grains to Grade A standard commands ₹120-₹240/quintal above standard modal rates in mandi auctions.
            </span>
          </div>
          <span className="hidden md:inline-flex text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
            APMC Standard
          </span>
        </div>
      </div>

      {/* 5. Main Live Rates Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Live Mandi Arrival Rates
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {filteredPrices.length} Records
            </span>
          </div>

          <button
            onClick={fetchPrices}
            disabled={loadingPrices}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Refresh Yard Feeds</span>
          </button>
        </div>

        {/* Live Table or States */}
        {loadingPrices ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
            <Loading message="Syncing verified mandi rates..." />
          </div>
        ) : errorPrices ? (
          <ErrorMessage message={errorPrices} onRetry={fetchPrices} />
        ) : (
          <PriceTable
            prices={filteredPrices}
            onBookMandi={(mandi) => {
              setSelectedMandiForBooking(mandi);
              setBookingModalOpen(true);
            }}
          />
        )}
      </div>

      {/* 6. Farmer Booking Modal */}
      <FarmerMandiBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialMandi={selectedMandiForBooking}
        onBookingSuccess={() => {
          fetchPrices();
        }}
      />

    </div>
  );
};

export default MandiPrices;
