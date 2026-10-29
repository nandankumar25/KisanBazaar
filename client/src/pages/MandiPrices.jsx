import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Tag, 
  Info, 
  Calendar, 
  RefreshCw,
  Store,
  LineChart as LineChartIcon
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

const CROPS = ['All', 'Wheat', 'Rice', 'Maize', 'Potato', 'Mustard'];

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
  const filteredPrices = prices.filter((item) => {
    const cropMatches = item.crop.toLowerCase().includes(searchTerm.toLowerCase());
    const mandiMatches = item.mandi?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const cityMatches = item.mandi?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return cropMatches || mandiMatches || cityMatches;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* A. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Mandi Prices
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Yard Data
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Compare actual market prices reported across verified regional mandis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedMandiForBooking(null);
            setBookingModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-fit"
        >
          <Store className="w-4 h-4" />
          <span>Sell Crops to a Mandi</span>
        </button>
      </div>

      {/* B. Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Crop Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1" /> Crop:
          </span>
          {CROPS.map((crop) => (
            <button
              key={crop}
              onClick={() => {
                setSelectedCrop(crop);
                if (crop !== 'All') setTrendCrop(crop);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCrop === crop
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search crop or mandi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All States</option>
              <option value="Punjab">Punjab</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Districts</option>
              <option value="Jalandhar">Jalandhar</option>
              <option value="Kapurthala">Kapurthala</option>
              <option value="Ludhiana">Ludhiana</option>
              <option value="Amritsar">Amritsar</option>
            </select>
          </div>

          {/* Mandi Select */}
          <div>
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Mandis</option>
              {mandis.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* C. Price Trend Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <LineChartIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {trendCrop} Price Trend
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Sample modal price history per quintal across markets.
            </p>
          </div>

          {/* Crop Switcher for Trend */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Select Crop:</span>
            <select
              value={trendCrop}
              onChange={(e) => setTrendCrop(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {CROPS.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full pt-4">
          {loadingTrend ? (
            <Loading message="Loading price trend chart..." />
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} unit=" ₹" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [`₹${value}`, 'Modal Rate']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="modalPrice" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No trend data available for {trendCrop}.
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 text-center italic">
          * Price trend is based on actual reported mandi trade history.
        </p>
      </div>

      {/* D. Main Price Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            Live Mandi Rates ({filteredPrices.length})
          </h2>
          <button
            onClick={fetchPrices}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </button>
        </div>

        {loadingPrices ? (
          <Loading message="Loading current mandi rates..." />
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

      {/* Farmer Booking Modal */}
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
