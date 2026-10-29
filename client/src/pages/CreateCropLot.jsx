import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import CropLotForm from '../components/CropLotForm';
import { createCropLot } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { Store, ArrowLeft, Tag, MapPin } from 'lucide-react';

const CreateCropLot = () => {
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const farmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;
  const prefillState = location.state || {};
  const targetMandi = prefillState.targetMandi;

  const initialData = {
    crop: prefillState.crop || '',
    expectedPrice: prefillState.expectedPrice !== undefined ? prefillState.expectedPrice : '',
    targetMandi: targetMandi?._id || null,
    location: user?.farmerProfile?.farmLocation || {
      state: targetMandi?.state || '',
      district: targetMandi?.district || '',
      city: targetMandi?.city || '',
      village: '',
    },
    description: targetMandi
      ? `Produce intended for sale at ${targetMandi.name} (${targetMandi.city || targetMandi.district}, ${targetMandi.state}).`
      : '',
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...formData,
        farmer: farmerId,
        ...(targetMandi ? { targetMandi: targetMandi._id } : {}),
      };

      await createCropLot(payload);
      alert('Crop lot created successfully.');
      navigate('/my-crops');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create crop lot. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Crop Lot</h1>
          <p className="text-slate-600 mt-1">List your produce on the market</p>
        </div>
        {targetMandi && (
          <Link
            to={`/mandi/${targetMandi._id}`}
            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 px-3.5 py-2 rounded-xl transition shadow-xs self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to {targetMandi.name}
          </Link>
        )}
      </div>

      {/* Target Mandi Pre-fill Banner */}
      {targetMandi && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                  Target Mandi Selected
                </span>
                <span className="text-xs text-slate-500 flex items-center">
                  <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                  {targetMandi.city || targetMandi.district}, {targetMandi.state}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">{targetMandi.name}</h2>
              {prefillState.crop && (
                <p className="text-xs text-emerald-800 font-medium mt-0.5 flex items-center space-x-1">
                  <Tag className="w-3 h-3 mr-1 text-emerald-600" />
                  <span>Pre-filled Crop: <strong>{prefillState.crop}</strong></span>
                  {prefillState.expectedPrice ? (
                    <span className="text-slate-600">
                      {' '}• Mandi Modal Rate: <strong>₹{prefillState.expectedPrice}/quintal</strong>
                    </span>
                  ) : (
                    <span className="text-amber-700 italic"> • (Price currently unavailable at mandi)</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <Link
            to={`/mandi/${targetMandi._id}`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl shadow-xs shrink-0"
          >
            Change Mandi / View Prices
          </Link>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <CropLotForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </div>
  );
};

export default CreateCropLot;
