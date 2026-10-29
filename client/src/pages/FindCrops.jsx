import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCropLots } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Search, MapPin, Calendar, User, IndianRupee, Sprout, Filter, ArrowRight } from 'lucide-react';

const FindCrops = () => {
  const [cropLots, setCropLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  useEffect(() => {
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

    fetchLots();
  }, []);

  // Extract unique filter options dynamically
  const uniqueCrops = ['ALL', ...new Set(cropLots.map((lot) => lot.crop).filter(Boolean))];
  const uniqueStates = ['ALL', ...new Set(cropLots.map((lot) => lot.location?.state).filter(Boolean))];
  const uniqueGrades = ['ALL', ...new Set(cropLots.map((lot) => lot.qualityGrade).filter(Boolean))];

  // Filtered lots
  const filteredLots = cropLots.filter((lot) => {
    // Search query filter (matches crop, district, city, village, farmer name)
    const matchesSearch =
      !searchQuery ||
      lot.crop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.location?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.location?.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCrop = selectedCrop === 'ALL' || lot.crop === selectedCrop;
    const matchesState = selectedState === 'ALL' || lot.location?.state === selectedState;
    const matchesGrade = selectedGrade === 'ALL' || lot.qualityGrade === selectedGrade;

    return matchesSearch && matchesCrop && matchesState && matchesGrade;
  });

  if (loading) return <Loading message="Loading available crop lots..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Sprout className="w-6 h-6 mr-2 text-emerald-600" /> Browse Crop Lots
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Buyer Marketplace
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Discover fresh farm produce directly listed by farmers across various mandis and regions.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop, location, or farmer name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Crops</option>
                {uniqueCrops.filter((c) => c !== 'ALL').map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All States</option>
                {uniqueStates.filter((s) => s !== 'ALL').map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Grades</option>
                {uniqueGrades.filter((g) => g !== 'ALL').map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>Showing {filteredLots.length} available crop lot(s)</span>
          {(selectedCrop !== 'ALL' || selectedState !== 'ALL' || selectedGrade !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCrop('ALL');
                setSelectedState('ALL');
                setSelectedGrade('ALL');
                setSearchQuery('');
              }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Crop Lot Cards Grid */}
      {filteredLots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No crop lots match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filters to discover more produce.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLots.map((lot) => (
            <div
              key={lot._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Lot Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{lot.crop}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      {lot.location?.district || lot.location?.city}, {lot.location?.state}
                    </p>
                  </div>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    AVAILABLE
                  </span>
                </div>

                {/* Lot Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Quantity</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {lot.quantity} {lot.unit || 'quintal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Expected Price</span>
                    <span className="font-bold text-emerald-700 text-sm flex items-center">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {lot.expectedPrice?.toLocaleString('en-IN')} / {lot.unit || 'qtl'}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 w-24">Quality Grade:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                      {lot.qualityGrade}
                    </span>
                  </div>

                  {lot.farmer && (
                    <div className="flex items-center">
                      <span className="font-semibold text-slate-700 w-24">Farmer:</span>
                      <span className="flex items-center text-slate-800">
                        <User className="w-3 h-3 mr-1 text-slate-400" />
                        {lot.farmer.name}
                      </span>
                    </div>
                  )}

                  {lot.availableFrom && (
                    <div className="flex items-center">
                      <span className="font-semibold text-slate-700 w-24">Available From:</span>
                      <span className="flex items-center text-slate-600">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {new Date(lot.availableFrom).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {lot.description && (
                    <p className="text-slate-500 italic mt-2 line-clamp-2 bg-slate-50 p-2 rounded text-[11px]">
                      "{lot.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={`/crop-lot/${lot._id}`}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition shadow-sm"
                >
                  <span>View Crop Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindCrops;
