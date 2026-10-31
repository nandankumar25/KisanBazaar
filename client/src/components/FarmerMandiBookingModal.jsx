import React, { useState, useEffect } from 'react';
import {
  getMandis,
  getCropLots,
  createMandiBooking,
  getMandiPrices,
  getMandiDemands,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Calendar,
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  IndianRupee,
  Clock,
  Phone,
  MapPin,
  TrendingUp,
} from 'lucide-react';

const FarmerMandiBookingModal = ({
  isOpen,
  onClose,
  initialMandi = null,
  initialCropLot = null,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [mandis, setMandis] = useState([]);
  const [myCropLots, setMyCropLots] = useState([]);
  const [selectedMandiId, setSelectedMandiId] = useState(initialMandi?._id || '');
  const [selectedMandi, setSelectedMandi] = useState(initialMandi);
  const [selectedLotId, setSelectedLotId] = useState(initialCropLot?._id || '');
  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiDemands, setMandiDemands] = useState([]);

  const [formData, setFormData] = useState({
    cropName: initialCropLot?.crop || 'Wheat',
    estimatedQuantity: initialCropLot?.quantity || '',
    qualityGrade: initialCropLot?.qualityGrade || 'Grade A',
    expectedPricePerQuintal: initialCropLot?.expectedPrice || '',
    preferredArrivalDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    farmerNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      try {
        const [mandisRes, lotsRes] = await Promise.all([
          getMandis(),
          user?.role === 'FARMER' ? getCropLots({ farmer: user._id, status: 'AVAILABLE' }) : { data: [] },
        ]);

        const verifiedMandis = mandisRes.data || [];
        setMandis(verifiedMandis);
        setMyCropLots(lotsRes.data || []);

        if (initialMandi) {
          setSelectedMandiId(initialMandi._id);
          setSelectedMandi(initialMandi);
        } else if (verifiedMandis.length > 0 && !selectedMandiId) {
          setSelectedMandiId(verifiedMandis[0]._id);
          setSelectedMandi(verifiedMandis[0]);
        }
      } catch (err) {
        console.error('Failed to load mandi booking data', err);
      }
    };

    fetchInitialData();
  }, [isOpen, user, initialMandi]);

  useEffect(() => {
    if (!selectedMandiId) return;
    const found = mandis.find((m) => m._id === selectedMandiId);
    if (found) {
      setSelectedMandi(found);
      // Fetch prices & demands for this mandi
      Promise.all([
        getMandiPrices({ mandi: selectedMandiId }).catch(() => ({ data: [] })),
        getMandiDemands({ mandi: selectedMandiId, status: 'OPEN' }).catch(() => ({ data: [] })),
      ]).then(([pRes, dRes]) => {
        setMandiPrices(pRes.data || []);
        setMandiDemands(dRes.data || []);
      });
    }
  }, [selectedMandiId, mandis]);

  const handleLotSelect = (lotId) => {
    setSelectedLotId(lotId);
    if (!lotId) return;
    const lot = myCropLots.find((l) => l._id === lotId);
    if (lot) {
      setFormData({
        ...formData,
        cropName: lot.crop,
        estimatedQuantity: lot.quantity,
        qualityGrade: lot.qualityGrade || 'Grade A',
        expectedPricePerQuintal: lot.expectedPrice || '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMandiId) {
      setError('Please select a Mandi.');
      return;
    }
    if (!formData.cropName || !formData.estimatedQuantity) {
      setError('Please provide crop name and quantity.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        mandiId: selectedMandiId,
        cropLotId: selectedLotId || undefined,
        cropName: formData.cropName,
        estimatedQuantity: Number(formData.estimatedQuantity),
        qualityGrade: formData.qualityGrade,
        expectedPricePerQuintal: formData.expectedPricePerQuintal
          ? Number(formData.expectedPricePerQuintal)
          : undefined,
        preferredArrivalDate: formData.preferredArrivalDate,
        farmerNotes: formData.farmerNotes,
      };

      const res = await createMandiBooking(payload);
      if (res.success) {
        setSuccessBooking(res.data);
        if (onBookingSuccess) onBookingSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit crop sale request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-1 border border-emerald-200">
              <Store className="w-3.5 h-3.5" />
              <span>Direct APMC / Mandi Procurement</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Book Crop Sale Slot at Mandi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a verified government or private mandi yard, specify crop details, and submit your arrival slot request.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Success View */}
        {successBooking ? (
          <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-emerald-950">
                Sale Booking Request Submitted!
              </h3>
              <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                Your request has been delivered to <strong>{selectedMandi?.name}</strong>. The mandi admin will review, propose arrival pricing, and assign a gate token.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-left space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Mandi:</span>
                <span className="font-bold text-slate-900">{selectedMandi?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crop:</span>
                <span className="font-bold text-slate-900">{successBooking.cropName} ({successBooking.estimatedQuantity} Qtl)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {successBooking.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`/transport?destination=${encodeURIComponent(selectedMandi?.name || 'Mandi Yard')}&crop=${encodeURIComponent(successBooking.cropName)}&quantity=${successBooking.estimatedQuantity || ''}&mandiBookingId=${successBooking._id}&cropLot=${selectedLotId || ''}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Truck className="w-4 h-4" />
                <span>Book Transport for Delivery</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Mandi Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Select Verified Mandi Yard *
              </label>
              <select
                required
                value={selectedMandiId}
                onChange={(e) => setSelectedMandiId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {mandis.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} — {m.city || m.district}, {m.state} ({m.mandiType || 'Govt'})
                  </option>
                ))}
              </select>
            </div>

            {/* Mandi Preview Card */}
            {selectedMandi && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedMandi.address || `${selectedMandi.district}, ${selectedMandi.state}`}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedMandi.mandiType || 'Government APMC'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-slate-600 pt-1">
                  {selectedMandi.operatingHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{selectedMandi.operatingHours}</span>
                    </div>
                  )}
                  {selectedMandi.contactPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedMandi.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Live reported prices for this mandi */}
                {mandiPrices.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Today's Rates at this Yard:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {mandiPrices.slice(0, 4).map((p) => (
                        <span key={p._id} className="bg-white border border-slate-200 px-2 py-1 rounded-md text-[11px] font-medium text-slate-800">
                          {p.crop}: <strong className="text-emerald-700">₹{p.modalPrice}</strong>/Qtl
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Crop Source Selection (From My Crop Lots or Custom) */}
            {myCropLots.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Select from My Crop Lots (Optional)
                </label>
                <select
                  value={selectedLotId}
                  onChange={(e) => handleLotSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">-- Or enter custom crop lot below --</option>
                  {myCropLots.map((lot) => (
                    <option key={lot._id} value={lot._id}>
                      {lot.crop} — {lot.quantity} {lot.unit || 'Quintals'} (Grade: {lot.qualityGrade || 'A'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Crop Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Crop Name *</label>
                <input
                  type="text"
                  required
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  placeholder="e.g. Wheat, Gram"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity (Quintals) *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={formData.estimatedQuantity}
                  onChange={(e) => setFormData({ ...formData, estimatedQuantity: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quality Grade</label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Sub-standard)</option>
                  <option value="FAQ">FAQ (Fair Average Quality)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expected Rate (₹/Quintal)</label>
                <input
                  type="number"
                  value={formData.expectedPricePerQuintal}
                  onChange={(e) => setFormData({ ...formData, expectedPricePerQuintal: e.target.value })}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Arrival Date *</label>
                <input
                  type="date"
                  required
                  value={formData.preferredArrivalDate}
                  onChange={(e) => setFormData({ ...formData, preferredArrivalDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Farmer Notes (Optional)</label>
              <textarea
                rows="2"
                value={formData.farmerNotes}
                onChange={(e) => setFormData({ ...formData, farmerNotes: e.target.value })}
                placeholder="e.g. Bringing lot in standard 50kg jute bags"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Submitting Request...' : 'Submit Sale Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FarmerMandiBookingModal;
