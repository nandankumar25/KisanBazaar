import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCropLots, getTransporters } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Truck, 
  MapPin, 
  Package, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  Sprout, 
  ShieldCheck, 
  TrendingDown, 
  Navigation 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TransportFinder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const preSelectedLotId = queryParams.get('cropLot');
  const queryDestination = queryParams.get('destination');
  const queryDistance = queryParams.get('distance');

  const demoFarmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;

  const [quantity, setQuantity] = useState(queryParams.get('quantity') || '');
  const [cropName, setCropName] = useState(queryParams.get('crop') || '');
  const [selectedLot, setSelectedLot] = useState(null);
  const [transporters, setTransporters] = useState([]);
  const [cropLots, setCropLots] = useState([]);

  // Form Inputs
  const [destination, setDestination] = useState(queryDestination || 'Ludhiana Grain Market');
  const [distanceKm, setDistanceKm] = useState(queryDistance || '35');

  // Selected Transporter
  const [selectedTransporter, setSelectedTransporter] = useState(null);

  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingTransporters, setLoadingTransporters] = useState(false);
  const [error, setError] = useState(null);

  // Helper to safely format location object or string
  const formatLocation = (loc) => {
    if (!loc) return 'Local Region';
    if (typeof loc === 'string') return loc;
    return [loc.village, loc.city || loc.district, loc.state].filter(Boolean).join(', ') || 'Local Region';
  };

  // Fetch available crop lots (User's lots if FARMER, with fallback to all available marketplace lots)
  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoadingLots(true);
        let res = null;
        if (user?.role === 'FARMER' && user?._id) {
          res = await getCropLots({ farmer: user._id, status: 'AVAILABLE' });
        } else if (demoFarmerId) {
          res = await getCropLots({ farmer: demoFarmerId, status: 'AVAILABLE' });
        }

        let lots = res?.data || [];
        if (lots.length === 0) {
          const fallbackRes = await getCropLots({ status: 'AVAILABLE' });
          lots = fallbackRes?.data || [];
        }

        setCropLots(lots);

        if (preSelectedLotId) {
          const matched = lots.find((l) => l._id === preSelectedLotId);
          if (matched) setSelectedLot(matched);
          else if (lots.length > 0) setSelectedLot(lots[0]);
        } else if (lots.length > 0) {
          setSelectedLot(lots[0]);
        }
      } catch (err) {
        console.error('Failed to load crop lots:', err);
        setError('Failed to load crop lots.');
      } finally {
        setLoadingLots(false);
      }
    };

    fetchLots();
  }, [user, demoFarmerId, preSelectedLotId]);

  // Fetch available transporters
  useEffect(() => {
    const fetchTransporterList = async () => {
      try {
        setLoadingTransporters(true);
        const res = await getTransporters({ isAvailable: 'true' });
        setTransporters(res.data || []);
      } catch (err) {
        console.error('Failed to load transporters:', err);
      } finally {
        setLoadingTransporters(false);
      }
    };

    fetchTransporterList();
  }, []);

  const numDistance = Number(distanceKm) || 0;
  const numQuantity = Number(quantity) || (selectedLot?.quantity ? Number(selectedLot.quantity) : 0);

  // Filter transporters: capacity >= crop quantity AND isAvailable === true
  const suitableTransporters = transporters.filter((t) => {
    return t.isAvailable && (numQuantity === 0 || t.capacity >= numQuantity);
  });

  // Calculate costs and find lowest cost option
  const transportersWithCost = suitableTransporters.map((t) => {
    const totalCost = (Number(t.pricePerKm) || 0) * numDistance;
    const costPerQuintal = numQuantity > 0 ? totalCost / numQuantity : 0;
    return { ...t, totalCost, costPerQuintal };
  });

  // Sort by total cost (ascending)
  transportersWithCost.sort((a, b) => a.totalCost - b.totalCost);

  const lowestCostTransporterId = transportersWithCost.length > 0 ? transportersWithCost[0]._id : null;

  const queryMandiBookingId = queryParams.get('mandiBookingId') || '';

  const handleProceedToBooking = () => {
    if (!selectedTransporter) return;

    const lotId = selectedLot?._id || preSelectedLotId || '';
    const pickup = formatLocation(user?.location || selectedLot?.location) || 'Local Region Farm Yard';

    const searchParams = new URLSearchParams({
      transporter: selectedTransporter._id,
      transporterName: selectedTransporter.name || '',
      vehicleType: selectedTransporter.vehicleType || 'Commercial Truck',
      vehicleNumber: selectedTransporter.vehicleNumber || '',
      capacity: selectedTransporter.capacity || '',
      ratePerKm: selectedTransporter.pricePerKm || 0,
      totalCost: selectedTransporter.totalCost || 0,
      costPerQuintal: (selectedTransporter.costPerQuintal || 0).toFixed(2),
      distance: numDistance,
      destination: destination,
      crop: cropName || selectedLot?.crop || '',
      quantity: numQuantity,
      pickupLocation: pickup,
      ...(lotId ? { cropLot: lotId } : {}),
      ...(queryMandiBookingId ? { mandiBookingId: queryMandiBookingId } : {}),
    });

    navigate(`/book-transport?${searchParams.toString()}`, {
      state: {
        selectedTransporter,
        selectedLot,
        cropName: cropName || selectedLot?.crop || '',
        quantity: numQuantity,
        destination,
        distanceKm: numDistance,
        totalCost: selectedTransporter.totalCost,
        costPerQuintal: selectedTransporter.costPerQuintal,
        mandiBookingId: queryMandiBookingId,
        pickupLocation: pickup,
      },
    });
  };

  if (loadingLots) return <Loading message="Loading crop lots and transporter network..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Truck className="w-6 h-6 mr-2 text-emerald-600" /> Transport Finder & Rate Comparison
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Farmer Logistics
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Discover available agri-transporters, compare per-quintal freight rates, and calculate net realization.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Request Details / Quantity Input */}
        <div className="lg:col-span-1 space-y-6">
          {/* If opened from a Mandi request (quantity & crop provided) */}
          {quantity && cropName ? (
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Sprout className="w-4 h-4 mr-2 text-emerald-600" />
                Selected Mandi Request
              </h2>
              <div className="mt-4 text-sm space-y-1">
                <p className="text-slate-700"><strong>Crop:</strong> {cropName}</p>
                <p className="text-slate-700"><strong>Quantity:</strong> {quantity} quintals</p>
                <p className="text-slate-700"><strong>Destination:</strong> {destination}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-emerald-600" />
                Enter Transport Details
              </h2>
              <label className="block text-xs font-semibold text-slate-700 mt-3">
                Quantity (quintals)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter required quantity"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
              />
            </div>
          )}

          {/* Destination & Distance Form Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
              Destination & Distance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Mandi / City
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Ludhiana Grain Market"
                    className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Distance (KM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    placeholder="Distance in km"
                    className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard transit distance used to compute freight cost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Available Transporters & Rate Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                Available Transporters
                <span className="ml-2 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {transportersWithCost.length} Suitable
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtered for minimum payload capacity of {numQuantity} quintals.
              </p>
            </div>
          </div>

          {loadingTransporters ? (
            <Loading message="Fetching verified transporters..." />
          ) : transportersWithCost.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Suitable Transporters Available</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active transporters found capable of hauling {numQuantity} quintals. Try reducing the lot size or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transportersWithCost.map((transporter) => {
                const isSelected = selectedTransporter?._id === transporter._id;
                const isLowestCost = transporter._id === lowestCostTransporterId;

                return (
                  <div
                    key={transporter._id}
                    onClick={() => setSelectedTransporter(transporter)}
                    className={`cursor-pointer rounded-xl border p-5 transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    {isLowestCost && (
                      <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" /> Lowest Transport Cost
                      </span>
                    )}

                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-base">{transporter.name}</h3>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Truck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {transporter.vehicleType || 'Commercial Truck'} {transporter.vehicleNumber ? `(${transporter.vehicleNumber})` : ''} • Capacity: {transporter.capacity} qtl
                          </p>
                          <p className="text-xs text-slate-500 flex items-center mt-0.5">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {formatLocation(transporter.operatingLocation || transporter.location)}
                          </p>
                        </div>
                        <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
                          {transporter.rating ? Number(transporter.rating).toFixed(1) : '4.8'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                          <span className="text-[11px] text-slate-500 block">Base Freight</span>
                          <span className="font-bold text-slate-800 text-sm">₹{transporter.pricePerKm}/km</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                          <span className="text-[11px] text-slate-500 block">Est. Cost / Qtl</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            ₹{(Number(transporter.costPerQuintal) || 0).toFixed(2)}/qtl
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 bg-emerald-50/60 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Total Transit Cost:</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          ₹{(Number(transporter.totalCost) || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransporter(transporter);
                      }}
                      className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Selected
                        </>
                      ) : (
                        'Select Transport'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection Confirmation Bar */}
          {selectedTransporter && (
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div>
                <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block">
                  Transport Selected
                </span>
                <h4 className="text-base font-bold mt-0.5">
                  {selectedTransporter.name} – ₹{(Number(selectedTransporter.totalCost) || 0).toLocaleString('en-IN')} Total (₹{(Number(selectedTransporter.costPerQuintal) || 0).toFixed(2)}/qtl)
                </h4>
                <p className="text-xs text-emerald-100 mt-1">
                  {cropName ? `Crop: ${cropName} • ` : ''}Quantity: {numQuantity} qtl • Distance: {numDistance} km to {destination}
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg flex items-center justify-center whitespace-nowrap"
              >
                <span>Proceed to Book Transport</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportFinder;
