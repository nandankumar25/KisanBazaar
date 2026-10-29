import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCropLots, getTransporters } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Calculator, 
  Sprout, 
  Truck, 
  IndianRupee, 
  Package, 
  MapPin, 
  Info, 
  ArrowLeft, 
  TrendingUp, 
  AlertCircle,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NetPriceCalculator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const initialLotId = queryParams.get('cropLot');
  const initialTransporterId = queryParams.get('transporter');
  const initialDistance = queryParams.get('distance') || '35';
  const initialDestination = queryParams.get('destination') || 'Ludhiana Grain Market';

  const demoFarmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;


  const [cropLots, setCropLots] = useState([]);
  const [transporters, setTransporters] = useState([]);

  // Selections & Inputs
  const [selectedLotId, setSelectedLotId] = useState(initialLotId || '');
  const [selectedTransporterId, setSelectedTransporterId] = useState(initialTransporterId || '');
  const [distanceKm, setDistanceKm] = useState(initialDistance);
  const [destination, setDestination] = useState(initialDestination);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!demoFarmerId) {
        setError('Development Error: VITE_DEMO_FARMER_ID is missing in client/.env.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [lotsRes, transRes] = await Promise.all([
          getCropLots({ farmer: demoFarmerId, status: 'AVAILABLE' }),
          getTransporters({ isAvailable: 'true' }),
        ]);

        const lots = lotsRes.data || [];
        const transList = transRes.data || [];

        setCropLots(lots);
        setTransporters(transList);

        if (!selectedLotId && lots.length > 0) {
          setSelectedLotId(lots[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch calculation parameters.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [demoFarmerId]);

  const selectedLot = cropLots.find((l) => l._id === selectedLotId);
  const lotQuantity = selectedLot?.quantity || 0;

  // STRICT FILTERING: Transporters must be available AND capacity >= crop quantity
  const suitableTransporters = transporters.filter((t) => {
    return t.isAvailable && t.capacity >= lotQuantity;
  });

  // Automatically reset/update selected transporter if current selection is invalid for the selected lot
  useEffect(() => {
    if (!selectedLotId || transporters.length === 0) return;

    const isCurrentTransporterValid = suitableTransporters.some((t) => t._id === selectedTransporterId);

    if (!isCurrentTransporterValid) {
      if (suitableTransporters.length > 0) {
        // Default to first valid suitable transporter
        setSelectedTransporterId(suitableTransporters[0]._id);
      } else {
        // Clear selection if no transporter is suitable
        setSelectedTransporterId('');
      }
    }
  }, [selectedLotId, transporters, suitableTransporters.length]);

  const selectedTransporter = suitableTransporters.find((t) => t._id === selectedTransporterId);

  // Dynamic Live Calculations (recalculated whenever transporter, distance, or lot changes)
  const quantity = selectedLot?.quantity || 0;
  const expectedPrice = selectedLot?.expectedPrice || 0;
  const distance = Number(distanceKm) || 0;
  const pricePerKm = selectedTransporter?.pricePerKm || 0;

  // Frontend Validation Rules
  const isDistanceValid = distance > 0;
  const isTransporterValid = Boolean(
    selectedTransporter &&
    selectedTransporter.isAvailable &&
    selectedTransporter.capacity >= quantity
  );
  const isCalculationValid = Boolean(selectedLot && isTransporterValid && isDistanceValid);

  // Formulas
  const grossSaleValue = expectedPrice * quantity;
  const totalTransportCost = isCalculationValid ? pricePerKm * distance : 0;
  const estimatedNetRealization = isCalculationValid ? grossSaleValue - totalTransportCost : 0;
  const estimatedNetPricePerQuintal = isCalculationValid && quantity > 0 ? estimatedNetRealization / quantity : 0;
  const transportCostPerQuintal = isCalculationValid && quantity > 0 ? totalTransportCost / quantity : 0;

  if (loading) return <Loading message="Loading calculator variables..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/transport')} 
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 text-sm font-semibold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Transport Finder
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-emerald-600" /> Net Price Realization Calculator
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Financial Estimator
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Calculate your estimated net earnings after deducting logistics and freight expenses per quintal.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Parameter Selection Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center">
              <Scale className="w-4 h-4 mr-2 text-emerald-600" />
              Calculation Parameters
            </h2>

            <div className="space-y-4 text-xs">
              {/* Select Crop Lot */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Crop Lot</label>
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {cropLots.map((lot) => (
                    <option key={lot._id} value={lot._id}>
                      {lot.crop} - {lot.quantity} qtl (₹{lot.expectedPrice}/qtl)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Transporter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Transporter (Capacity ≥ {lotQuantity}q)
                </label>
                {suitableTransporters.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs font-medium">
                    No suitable transporter available for this crop quantity.
                  </div>
                ) : (
                  <select
                    value={selectedTransporterId}
                    onChange={(e) => setSelectedTransporterId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {suitableTransporters.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.vehicleType}, Cap: {t.capacity}q, ₹{t.pricePerKm}/km)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Destination */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Mandi / Market</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Ludhiana Grain Market"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Estimated Distance */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Distance (KM)</label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="e.g. 35"
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Validation Alerts */}
            {!isDistanceValid && (
              <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs flex items-start">
                <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>Please enter a valid estimated distance greater than 0 KM.</div>
              </div>
            )}

            {suitableTransporters.length === 0 && (
              <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-start">
                <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  No suitable transporter available for <strong>{selectedLot?.crop} ({quantity} quintals)</strong>. Vehicles with lower capacity are excluded.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Breakdown Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded uppercase">
                  Estimated Financial Summary
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedLot ? `${selectedLot.crop} (${quantity} quintals)` : 'Net Calculation'}
                </h2>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Pickup: {selectedLot?.location?.district || 'Farm'} ──► Destination: {destination || 'Mandi'} ({distance} km)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Rate / KM</span>
                <span className="text-base font-bold text-slate-800">
                  {selectedTransporter ? `₹${pricePerKm}` : '—'} <span className="text-xs text-slate-500 font-normal">/ km</span>
                </span>
              </div>
            </div>

            {/* Validation Check Before Showing Math */}
            {!isCalculationValid ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl text-center text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="font-bold text-sm text-rose-900">Calculation Invalid</h3>
                <p>
                  {suitableTransporters.length === 0
                    ? `No suitable transporter available for this crop quantity (${quantity} quintals). Cannot compute estimated net price.`
                    : 'Please select a valid transporter and enter a positive distance (> 0 KM) to calculate net realization.'}
                </p>
              </div>
            ) : (
              /* Calculation Steps Breakdown */
              <div className="space-y-4">
                {/* Step 1: Gross Sale Value */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase block">1. Gross Sale Value (Estimated)</span>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      Expected Price (₹{expectedPrice?.toLocaleString('en-IN')}/qtl) × Quantity ({quantity} qtl)
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{grossSaleValue.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Step 2: Total Transport Cost */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase block">2. Transport Cost (Estimated)</span>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      Price/KM (₹{pricePerKm}) × Distance ({distance} km) • (₹{transportCostPerQuintal.toFixed(2)}/qtl)
                    </span>
                  </div>
                  <div className="text-base font-bold text-rose-600">
                    - ₹{totalTransportCost.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Step 3: Estimated Net Realization */}
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                      3. Estimated Net Realization
                    </span>
                    <span className="text-xs text-emerald-700 mt-1 block">
                      Gross Sale Value (₹{grossSaleValue.toLocaleString('en-IN')}) - Transport Cost (₹{totalTransportCost.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800">
                    ₹{estimatedNetRealization.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Step 4: Estimated Net Price Per Quintal Highlight Box */}
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">
                        Estimated Net Price Per Quintal
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100 mt-1">
                      Calculation: Estimated Net Realization (₹{estimatedNetRealization.toLocaleString('en-IN')}) ÷ Quantity ({quantity} qtl)
                    </p>
                  </div>

                  <div className="text-3xl font-black text-emerald-300">
                    ₹{estimatedNetPricePerQuintal.toFixed(2)} <span className="text-sm font-normal text-white">/ qtl</span>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-start text-xs text-slate-500 bg-amber-50/50 p-3 rounded-lg">
              <Info className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> All figures above are <strong>Estimated</strong> based on expected farmer prices and manually entered distance. Final payout depends on actual mandi auction prices, moisture testing, and finalized transporter charges.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetPriceCalculator;
