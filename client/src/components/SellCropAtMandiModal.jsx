import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  IndianRupee,
  RefreshCw,
  Clock,
  Tag,
} from 'lucide-react';
import { createMandiBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Returns today's date formatted as YYYY-MM-DD in local time
const getLocalTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Returns tomorrow's date formatted as YYYY-MM-DD in local time
const getLocalTomorrowDateString = () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SellCropAtMandiModal = ({
  isOpen,
  onClose,
  mandi,
  cropData,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [quantity, setQuantity] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [availableDate, setAvailableDate] = useState(getLocalTomorrowDateString());
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pre-fill fields whenever the modal opens or the cropData changes
  useEffect(() => {
    if (isOpen && cropData) {
      setQuantity('');
      setQualityGrade(cropData.qualityGrade || 'Grade A');
      // Prefill with mandi modal price if available, but keep it editable
      setExpectedPrice(
        cropData.currentModalPrice !== undefined && cropData.currentModalPrice !== null
          ? String(cropData.currentModalPrice)
          : ''
      );
      setAvailableDate(getLocalTomorrowDateString());
      setDescription('');
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, cropData, mandi]);

  if (!isOpen || !mandi || !cropData) return null;

  const referencePrice = cropData.currentModalPrice;
  const numQuantity = parseFloat(quantity);
  const numPrice = parseFloat(expectedPrice);
  const totalEstimatedValue =
    !isNaN(numQuantity) && numQuantity > 0 && !isNaN(numPrice) && numPrice > 0
      ? numQuantity * numPrice
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 1. Authenticated user validation
    if (!user) {
      setError('Please log in as a farmer to submit a mandi selling request.');
      return;
    }

    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'FARMER' && userRole !== 'ADMIN') {
      setError('Only registered farmers can submit crop sale requests to mandis.');
      return;
    }

    // 2. Mandi and crop validation
    if (!mandi || !mandi._id) {
      setError('Selected mandi information is missing. Please close and re-select the mandi.');
      return;
    }

    if (!cropData || !cropData.name) {
      setError('Selected crop information is missing. Please select a valid crop.');
      return;
    }

    // 3. Numeric & field validations
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Please enter a valid crop quantity greater than 0 quintals.');
      return;
    }

    if (!qualityGrade || !qualityGrade.trim()) {
      setError('Please select a quality grade.');
      return;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid expected selling price greater than 0 (₹/quintal).');
      return;
    }

    if (!availableDate) {
      setError('Please select your available date for yard arrival.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        mandi: mandi._id,
        crop: cropData.name.trim(),
        quantity: numQuantity,
        qualityGrade: qualityGrade.trim(),
        expectedPrice: numPrice,
        preferredArrivalDate: availableDate,
        availableDate: availableDate,
        farmerNotes: description.trim(),
        description: description.trim(),
      };

      const res = await createMandiBooking(payload);

      if (res.success && res.data) {
        const msg =
          res.message ||
          'Sell request submitted successfully. Waiting for mandi approval.';
        setSuccessMessage(msg);

        // Notify parent component to refresh requests list and show success alert
        if (onSuccess) {
          onSuccess(res.data, msg);
        }

        // Reset inputs
        setQuantity('');
        setDescription('');

        // Automatically close modal after brief delay
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to submit selling request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting mandi sell request:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit selling request to mandi. Please check connection and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden transition-all my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-700/80 rounded-xl text-emerald-100">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/90 text-emerald-100 border border-emerald-600/60">
                Sell Crop at Mandi
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {mandi.name}
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-200 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-300 shrink-0" />
            {mandi.city || mandi.district}, {mandi.state}
            {mandi.operatingHours && ` • Hours: ${mandi.operatingHours}`}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
          {/* Target Crop & Reference Price Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Selected Crop
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {cropData.name}
                </h3>
              </div>
            </div>

            {/* Reference Modal Price */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Mandi Reference Rate
              </span>
              {referencePrice !== undefined && referencePrice !== null ? (
                <div className="text-sm font-extrabold text-emerald-700 font-mono">
                  ₹{referencePrice} <span className="text-[11px] font-sans text-slate-400 font-normal">/ quintal</span>
                </div>
              ) : (
                <span className="text-xs text-amber-700 font-medium italic">
                  Price currently unavailable
                </span>
              )}
            </div>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-[11px] underline font-bold ml-2 text-red-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quantity (Quintals) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                1 Quintal = 100 kg
              </span>
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quality Grade *
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Fair)</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="FAQ">FAQ (Fair Average Quality)</option>
              </select>
            </div>

            {/* Expected Selling Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Expected Selling Price (₹/Quintal) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder={referencePrice ? `e.g. ${referencePrice}` : 'e.g. 2350'}
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prefilled with mandi rate, editable by farmer
              </span>
            </div>

            {/* Available Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Available Date for Yard Arrival *
              </label>
              <input
                type="date"
                min={getLocalTodayDateString()}
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Preferred delivery date at mandi yard
              </span>
            </div>
          </div>

          {/* Optional Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Optional Description / Notes for Mandi Admin
            </label>
            <textarea
              rows="2"
              placeholder="Mention crop moisture, packaging (e.g. 50kg jute bags), or delivery timing preferences..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Total Estimated Value Summary */}
          {totalEstimatedValue > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Estimated Total Sale Value ({numQuantity} qtl × ₹{numPrice}):
              </span>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                {formatCurrency(totalEstimatedValue)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center space-x-1.5"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Submitting Request...' : 'Submit Sell Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellCropAtMandiModal;