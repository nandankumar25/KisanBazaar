import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCropLotById, createOffer } from '../services/api';
import { 
  Package, 
  IndianRupee, 
  MapPin, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  FileText,
  Calculator
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MakeOffer = () => {
  const { user } = useAuth();
  const { cropLotId } = useParams();
  const navigate = useNavigate();

  const [cropLot, setCropLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const demoBuyerId = user?._id || import.meta.env.VITE_DEMO_BUYER_ID;


  // Form State
  const [offeredPrice, setOfferedPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchLot = async () => {
      try {
        setLoading(true);
        const res = await getCropLotById(cropLotId);
        if (res.success && res.data) {
          setCropLot(res.data);
          setOfferedPrice(res.data.expectedPrice || '');
          setQuantity(res.data.quantity || '');
        } else {
          setError('Crop lot not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch crop lot details');
      } finally {
        setLoading(false);
      }
    };

    fetchLot();
  }, [cropLotId]);

  const numericPrice = Number(offeredPrice) || 0;
  const numericQuantity = Number(quantity) || 0;
  const estimatedTotal = numericPrice * numericQuantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!demoBuyerId) {
      setError('Development Error: VITE_DEMO_BUYER_ID is not configured in .env file.');
      return;
    }

    if (!cropLot) return;

    if (cropLot.status !== 'AVAILABLE') {
      setError(`Cannot place an offer on a lot with status ${cropLot.status}.`);
      return;
    }

    if (numericPrice <= 0) {
      setError('Offered price must be greater than zero.');
      return;
    }

    if (numericQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (numericQuantity > cropLot.quantity) {
      setError(`Offered quantity cannot exceed available crop lot quantity (${cropLot.quantity} quintals).`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        cropLot: cropLot._id,
        buyer: demoBuyerId,
        offeredPrice: numericPrice,
        quantity: numericQuantity,
        message: message.trim(),
      };

      const res = await createOffer(payload);
      if (res.success) {
        setSuccessMsg('Offer submitted successfully.');
        setTimeout(() => {
          navigate('/my-offers');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error && !cropLot) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
        <Link to="/find-buyers" className="mt-4 inline-flex items-center text-emerald-600 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Crop Lots
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 text-sm font-semibold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
      </button>

      {/* Development Banner */}
      {!demoBuyerId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Demo Configuration Error:</strong> Missing <code>VITE_DEMO_BUYER_ID</code> in frontend <code>.env</code> file. Please re-run the backend seed script to populate environment variables.
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Make an Offer</h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Demo Marketplace
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Submit your price and quantity proposal directly to the farmer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Crop Lot Summary */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-fit">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center">
            <Package className="w-4 h-4 mr-2 text-emerald-600" />
            Crop Lot Summary
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Crop</span>
              <span className="text-lg font-bold text-slate-800">{cropLot.crop}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Available Quantity</span>
              <span className="font-semibold text-slate-700">{cropLot.quantity} quintals</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Quality Grade</span>
              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                {cropLot.qualityGrade}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Farmer Expected Price</span>
              <span className="text-base font-bold text-emerald-600 flex items-center mt-0.5">
                <IndianRupee className="w-4 h-4" />
                {cropLot.expectedPrice?.toLocaleString('en-IN')} / quintal
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Location</span>
              <span className="text-slate-600 flex items-center mt-0.5 text-xs">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {cropLot.location?.city || cropLot.location?.district}, {cropLot.location?.state}
              </span>
            </div>

            {cropLot.farmer && (
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase block">Farmer</span>
                <span className="text-slate-700 font-semibold flex items-center mt-0.5 text-xs">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {cropLot.farmer.name}
                </span>
              </div>
            )}

            {cropLot.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-semibold uppercase block">Description</span>
                <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded">
                  "{cropLot.description}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Offer Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-emerald-600" />
            Offer Details Form
          </h2>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg mb-4 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg mb-4 text-xs flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {cropLot.status !== 'AVAILABLE' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-4 text-xs">
              This crop lot is currently <strong>{cropLot.status}</strong> and cannot accept new offers.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offered Price per Quintal (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    placeholder="e.g. 2450"
                    required
                    min="1"
                    disabled={cropLot.status !== 'AVAILABLE'}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Farmer's expected price: ₹{cropLot.expectedPrice}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity (Quintals) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                  required
                  min="1"
                  max={cropLot.quantity}
                  disabled={cropLot.status !== 'AVAILABLE'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Maximum available: {cropLot.quantity} quintals
                </span>
              </div>
            </div>

            {/* Estimated Value Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs font-semibold text-emerald-900">
                  <Calculator className="w-4 h-4 mr-1.5 text-emerald-700" />
                  Estimated Offer Value:
                </div>
                <div className="text-lg font-black text-emerald-800">
                  ₹{estimatedTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 italic">
                Calculation: ₹{numericPrice.toLocaleString('en-IN')} × {numericQuantity} quintals = ₹{estimatedTotal.toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message to Farmer (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Interested in purchasing this lot with immediate pickup."
                rows="3"
                disabled={cropLot.status !== 'AVAILABLE'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || cropLot.status !== 'AVAILABLE' || !demoBuyerId}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MakeOffer;
