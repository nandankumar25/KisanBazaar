import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const baseCrops = ['Wheat', 'Rice', 'Maize', 'Potato', 'Mustard', 'Cotton', 'Soybean', 'Bajra', 'Barley', 'Vegetables', 'Other'];
const qualityGrades = ['Grade A', 'Grade B', 'Premium', 'Standard'];

const CropLotForm = ({ initialData, onSubmit, isEditing = false, isLoading = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    crop: initialData?.crop || '',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'quintal',
    qualityGrade: initialData?.qualityGrade || '',
    location: initialData?.location || {
      state: '',
      district: '',
      city: '',
      village: ''
    },
    expectedPrice: initialData?.expectedPrice || '',
    availableFrom: new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    status: initialData?.status || 'AVAILABLE',
    targetMandi: initialData?.targetMandi || null
  });

  const [errors, setErrors] = useState({});

  const crops = React.useMemo(() => {
    const list = [...baseCrops];
    if (formData.crop && !list.includes(formData.crop)) {
      return [formData.crop, ...list];
    }
    return list;
  }, [formData.crop]);

  useEffect(() => {
    if (initialData) {
      const formattedDate = initialData.availableFrom 
        ? new Date(initialData.availableFrom).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        ...initialData,
        crop: initialData.crop !== undefined ? initialData.crop : prev.crop,
        expectedPrice: initialData.expectedPrice !== undefined ? initialData.expectedPrice : prev.expectedPrice,
        location: initialData.location || prev.location || { state: '', district: '', city: '', village: '' },
        availableFrom: formattedDate
      }));
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.crop) newErrors.crop = 'Crop is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.qualityGrade) newErrors.qualityGrade = 'Quality Grade is required';
    if (!formData.location.state) newErrors.state = 'State is required';
    if (!formData.location.district) newErrors.district = 'District is required';
    if (!formData.location.city) newErrors.city = 'City is required';
    if (!formData.location.village) newErrors.village = 'Village is required';
    if (!formData.expectedPrice || formData.expectedPrice <= 0) newErrors.expectedPrice = 'Expected Price must be greater than 0';
    if (!formData.availableFrom) newErrors.availableFrom = 'Available From date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locField = name.split('.')[1];
      setFormData(prev => ({ ...prev, location: { ...prev.location, [locField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const isSold = formData.status === 'SOLD';
  const isReserved = formData.status === 'RESERVED';

  // For reserved, we might only allow updating price, description and status.
  const isFieldDisabled = (fieldName) => {
    if (isSold) return true;
    if (isReserved && !['expectedPrice', 'description', 'status'].includes(fieldName)) return true;
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 max-w-4xl mx-auto">
      {isSold && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm font-medium">
          This crop lot is marked as SOLD. It cannot be edited.
        </div>
      )}
      {isReserved && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg mb-6 text-sm font-medium">
          This crop lot is RESERVED. Only price, description, and status can be edited.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crop Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-emerald-800 border-b border-emerald-100 pb-2">Crop Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Crop *</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              disabled={isFieldDisabled('crop')}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.crop ? 'border-red-500' : 'border-slate-300'}`}
            >
              <option value="">Select Crop</option>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.crop && <p className="text-red-500 text-xs mt-1">{errors.crop}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isFieldDisabled('quantity')}
                min="0.1"
                step="0.1"
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                disabled
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quality Grade *</label>
            <select
              name="qualityGrade"
              value={formData.qualityGrade}
              onChange={handleChange}
              disabled={isFieldDisabled('qualityGrade')}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.qualityGrade ? 'border-red-500' : 'border-slate-300'}`}
            >
              <option value="">Select Grade</option>
              {qualityGrades.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            {errors.qualityGrade && <p className="text-red-500 text-xs mt-1">{errors.qualityGrade}</p>}
          </div>
        </div>

        {/* Location & Pricing */}
        <div className="space-y-4">
          <h3 className="font-semibold text-emerald-800 border-b border-emerald-100 pb-2">Location & Pricing</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
              <input
                type="text"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                disabled={isFieldDisabled('location')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.state ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
              <input
                type="text"
                name="location.district"
                value={formData.location.district}
                onChange={handleChange}
                disabled={isFieldDisabled('location')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.district ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                disabled={isFieldDisabled('location')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.city ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Village *</label>
              <input
                type="text"
                name="location.village"
                value={formData.location.village}
                onChange={handleChange}
                disabled={isFieldDisabled('location')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.village ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.village && <p className="text-red-500 text-xs mt-1">{errors.village}</p>}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Price (₹) *</label>
              <input
                type="number"
                name="expectedPrice"
                value={formData.expectedPrice}
                onChange={handleChange}
                disabled={isFieldDisabled('expectedPrice')}
                min="0"
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.expectedPrice ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.expectedPrice && <p className="text-red-500 text-xs mt-1">{errors.expectedPrice}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Available From *</label>
              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleChange}
                disabled={isFieldDisabled('availableFrom')}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.availableFrom ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.availableFrom && <p className="text-red-500 text-xs mt-1">{errors.availableFrom}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isFieldDisabled('status')}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="RESERVED">RESERVED</option>
              <option value="SOLD">SOLD</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isFieldDisabled('description')}
            rows="3"
            placeholder="Add any additional details about the crop..."
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          ></textarea>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate('/my-crops')}
          className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        {!isSold && (
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Crop Lot' : 'Create Crop Lot')}
          </button>
        )}
      </div>
    </form>
  );
};

export default CropLotForm;
