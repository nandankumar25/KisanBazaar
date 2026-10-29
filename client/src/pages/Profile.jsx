import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  Sprout,
  Info,
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const fileInputRef = useRef(null);

  // Core Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    state: '',
    district: '',
    city: '',
    village: '',
    // Farmer specific
    farmSize: '',
    primaryCrops: '',
    experienceYears: '',
    farmingType: 'Conventional',
    // Buyer specific
    businessName: '',
    businessType: 'Independent Buyer',
    minQuantity: '',
    maxQuantity: '',
    requiredQuantity: '',
    interestedCrops: '',
    preferredQualityGrades: '',
    preferredLocations: '',
    buyingRequirements: '',
    buyerDescription: '',
    // Transporter specific
    vehicleType: '',
    vehicleNumber: '',
    capacity: '',
    pricePerKm: '',
    isAvailable: true,
  });

  // Avatar Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Status & UI State
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hydrate form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        state: user.location?.state || '',
        district: user.location?.district || '',
        city: user.location?.city || '',
        village: user.location?.village || '',
        // Farmer fields
        farmSize: user.farmerProfile?.farmSize || '',
        primaryCrops: (user.farmerProfile?.primaryCrops || []).join(', '),
        experienceYears: user.farmerProfile?.experienceYears || '',
        farmingType: user.farmerProfile?.farmingType || 'Conventional',
        // Buyer fields
        businessName: user.buyerProfile?.businessName || '',
        businessType: user.buyerProfile?.businessType || 'Independent Buyer',
        minQuantity: user.buyerProfile?.minQuantity || '',
        maxQuantity: user.buyerProfile?.maxQuantity || '',
        requiredQuantity: user.buyerProfile?.requiredQuantity || '',
        interestedCrops: (user.buyerProfile?.interestedCrops || []).join(', '),
        preferredQualityGrades: (user.buyerProfile?.preferredQualityGrades || []).join(', '),
        preferredLocations: (user.buyerProfile?.preferredLocations || []).join(', '),
        buyingRequirements: user.buyerProfile?.buyingRequirements || '',
        buyerDescription: user.buyerProfile?.description || '',
        // Transporter fields
        vehicleType: user.transporterProfile?.vehicleType || '',
        vehicleNumber: user.transporterProfile?.vehicleNumber || '',
        capacity: user.transporterProfile?.capacity || '',
        pricePerKm: user.transporterProfile?.pricePerKm || '',
        isAvailable:
          user.transporterProfile?.isAvailable !== undefined
            ? user.transporterProfile.isAvailable
            : true,
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setIsRemovingAvatar(false);
    }
  }, [user]);

  // Clean up preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');

    // Allowed file types: JPG, JPEG, PNG, WebP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;

    if (!validTypes.includes(file.type) || !validExtensions.test(file.name)) {
      setErrorMessage(
        'Invalid file type. Please upload a JPG, JPEG, PNG, or WebP image.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Size validation: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        'Profile photo exceeds the 5MB size limit. Please choose a smaller image.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create instant preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(newPreview);
    setIsRemovingAvatar(false);
  };

  const handleRemoveAvatarClick = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setSelectedFile(null);
    setIsRemovingAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        state: user.location?.state || '',
        district: user.location?.district || '',
        city: user.location?.city || '',
        village: user.location?.village || '',
        farmSize: user.farmerProfile?.farmSize || '',
        primaryCrops: (user.farmerProfile?.primaryCrops || []).join(', '),
        experienceYears: user.farmerProfile?.experienceYears || '',
        farmingType: user.farmerProfile?.farmingType || 'Conventional',
        businessName: user.buyerProfile?.businessName || '',
        businessType: user.buyerProfile?.businessType || 'Independent Buyer',
        minQuantity: user.buyerProfile?.minQuantity || '',
        maxQuantity: user.buyerProfile?.maxQuantity || '',
        requiredQuantity: user.buyerProfile?.requiredQuantity || '',
        interestedCrops: (user.buyerProfile?.interestedCrops || []).join(', '),
        preferredQualityGrades: (user.buyerProfile?.preferredQualityGrades || []).join(', '),
        preferredLocations: (user.buyerProfile?.preferredLocations || []).join(', '),
        buyingRequirements: user.buyerProfile?.buyingRequirements || '',
        buyerDescription: user.buyerProfile?.description || '',
        vehicleType: user.transporterProfile?.vehicleType || '',
        vehicleNumber: user.transporterProfile?.vehicleNumber || '',
        capacity: user.transporterProfile?.capacity || '',
        pricePerKm: user.transporterProfile?.pricePerKm || '',
        isAvailable:
          user.transporterProfile?.isAvailable !== undefined
            ? user.transporterProfile.isAvailable
            : true,
      });
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
      setSelectedFile(null);
      setIsRemovingAvatar(false);
      setErrorMessage('');
      setSuccessMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Handle avatar changes if any
      if (isRemovingAvatar && user.avatar) {
        await removeAvatar();
      } else if (selectedFile) {
        const uploadRes = await uploadAvatar(selectedFile);
        if (!uploadRes.success) {
          throw new Error(uploadRes.message || 'Failed to upload profile photo');
        }
      }

      // 2. Prepare profile payload
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: {
          state: formData.state.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
          village: formData.village.trim(),
        },
      };

      if (user.role === 'FARMER') {
        payload.farmerProfile = {
          farmSize: Number(formData.farmSize) || 0,
          primaryCrops: formData.primaryCrops
            ? formData.primaryCrops.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
          experienceYears: Number(formData.experienceYears) || 0,
          farmingType: formData.farmingType,
        };
      } else if (user.role === 'BUYER') {
        payload.buyerProfile = {
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          minQuantity: Number(formData.minQuantity) || 0,
          maxQuantity: Number(formData.maxQuantity) || 0,
          requiredQuantity: Number(formData.requiredQuantity) || 0,
          interestedCrops: formData.interestedCrops
            ? formData.interestedCrops.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
          preferredQualityGrades: formData.preferredQualityGrades
            ? formData.preferredQualityGrades.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
          preferredLocations: formData.preferredLocations
            ? formData.preferredLocations.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
          buyingRequirements: formData.buyingRequirements.trim(),
          description: formData.buyerDescription.trim(),
        };
      } else if (user.role === 'TRANSPORTER') {
        payload.transporterProfile = {
          vehicleType: formData.vehicleType.trim(),
          vehicleNumber: formData.vehicleNumber.trim(),
          capacity: Number(formData.capacity) || 0,
          pricePerKm: Number(formData.pricePerKm) || 0,
          isAvailable: formData.isAvailable,
        };
      }

      const res = await updateProfile(payload);
      if (res.success) {
        setSuccessMessage('Profile updated successfully!');
        setSelectedFile(null);
        setIsRemovingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error updating profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
        };
      case 'MANDI_ADMIN':
        return {
          label: 'Mandi Admin / APMC',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
        };
      case 'BUYER':
        return {
          label: 'Crop Buyer / Trader',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ShoppingBag className="w-3.5 h-3.5 mr-1" />,
        };
      case 'TRANSPORTER':
        return {
          label: 'Logistics Transporter',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Truck className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          label: 'Farmer / Producer',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Sprout className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);
  const currentAvatarSrc = isRemovingAvatar
    ? ''
    : previewUrl || user.avatar;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800" />

        <div className="relative pt-12 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Avatar Area with Upload Overlay */}
          <div className="relative group shrink-0">
            <div className="p-1.5 bg-white rounded-full shadow-md">
              <Avatar
                src={currentAvatarSrc}
                name={formData.name || user.name}
                role={user.role}
                size="2xl"
                className="w-28 h-28 text-3xl"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Photo"
              className="absolute bottom-1 right-1 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg border-2 border-white transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          {/* User Info Overview */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formData.name || user.name}
              </h1>
              <span
                className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${roleBadge.bg}`}
              >
                {roleBadge.icon}
                {roleBadge.label}
              </span>
            </div>

            <p className="text-sm text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user.email}</span>
              {user.isEmailVerified ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Verified
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Unverified
                </span>
              )}
            </p>

            <p className="text-xs text-slate-500">
              Member since{' '}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '2026'}
            </p>
          </div>

          {/* Avatar Actions */}
          {(currentAvatarSrc || selectedFile) && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRemoveAvatarClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-sm font-semibold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-900 text-sm font-semibold shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Patel"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address <span className="text-slate-400 font-normal">(Read-only)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                Email is tied to account credentials and cannot be edited.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Role <span className="text-slate-400 font-normal">(System-assigned)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  value={user.role}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 shrink-0" />
                User role is protected and managed by system administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Location Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Location & Mandi Region</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Punjab"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                District
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Ludhiana"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                City / Tehsil / Mandi Hub
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Khanna"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Village / Landmark
              </label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder="Samrala Road"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Role-Specific Details */}
        {user.role === 'FARMER' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Farmer & Crop Production Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Farm Size (in Acres)
                </label>
                <input
                  type="number"
                  name="farmSize"
                  min="0"
                  step="0.5"
                  value={formData.farmSize}
                  onChange={handleChange}
                  placeholder="12.5"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Years of Farming Experience
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="15"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Farming Method
                </label>
                <select
                  name="farmingType"
                  value={formData.farmingType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="Conventional">Conventional Farming</option>
                  <option value="Organic Certified">Organic Certified</option>
                  <option value="Natural / Zero Budget">Natural / ZBNF</option>
                  <option value="Hydroponic / Greenhouse">Greenhouse / Protected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Crops Cultivated
                </label>
                <input
                  type="text"
                  name="primaryCrops"
                  value={formData.primaryCrops}
                  onChange={handleChange}
                  placeholder="Wheat, Paddy, Mustard, Potato"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Comma-separated crop names</span>
              </div>
            </div>
          </div>
        )}

        {user.role === 'BUYER' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Buyer Business Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Business / Firm Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Malwa Agro Traders Pvt Ltd"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="Independent Buyer">Independent Buyer</option>
                  <option value="Wholesale Trader">Wholesale Trader / Commission Agent</option>
                  <option value="Food Processing Mill">Food Processing Mill</option>
                  <option value="Retail Chain">Supermarket / Retail Chain</option>
                  <option value="Exporter">Agri Commodities Exporter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Minimum Order Quantity (Quintals)
                </label>
                <input
                  type="number"
                  name="minQuantity"
                  min="0"
                  value={formData.minQuantity}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Maximum Capacity (Quintals)
                </label>
                <input
                  type="number"
                  name="maxQuantity"
                  min="0"
                  value={formData.maxQuantity}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Typical Required Quantity (Quintals)
                </label>
                <input
                  type="number"
                  name="requiredQuantity"
                  min="0"
                  value={formData.requiredQuantity}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Interested Crops for Purchase
                </label>
                <input
                  type="text"
                  name="interestedCrops"
                  value={formData.interestedCrops}
                  onChange={handleChange}
                  placeholder="Wheat, Paddy, Maize, Cotton, Mustard"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Comma-separated crop names</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Quality Grades
                </label>
                <input
                  type="text"
                  name="preferredQualityGrades"
                  value={formData.preferredQualityGrades}
                  onChange={handleChange}
                  placeholder="Grade A, Premium, Organic"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Comma-separated grades (e.g. Grade A, Organic)</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Sourcing Districts / States
                </label>
                <input
                  type="text"
                  name="preferredLocations"
                  value={formData.preferredLocations}
                  onChange={handleChange}
                  placeholder="Ludhiana, Sangrur, Karnal"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Comma-separated locations</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Procurement Requirements & Specifications
                </label>
                <textarea
                  name="buyingRequirements"
                  rows="2"
                  value={formData.buyingRequirements}
                  onChange={handleChange}
                  placeholder="e.g. Moisture content below 12%, clean 50kg gunny bags, immediate RTGS payment upon weighing..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Business Description / Mandi Profile
                </label>
                <textarea
                  name="buyerDescription"
                  rows="3"
                  value={formData.buyerDescription}
                  onChange={handleChange}
                  placeholder="Licensed mandi trader with direct bank payment guarantees..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        )}

        {user.role === 'TRANSPORTER' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Truck className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Transporter Fleet Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Vehicle Type
                </label>
                <input
                  type="text"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  placeholder="Tata 407 / 10-Ton Truck"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="PB-10-AB-5678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Carrying Capacity (Quintals)
                </label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Base Rate per Kilometer (₹)
                </label>
                <input
                  type="number"
                  name="pricePerKm"
                  min="0"
                  value={formData.pricePerKm}
                  onChange={handleChange}
                  placeholder="28"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isAvailable" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Available for new transit bookings in Transport Finder
                </label>
              </div>
            </div>
          </div>
        )}

        {user.role === 'ADMIN' && (
          <div className="bg-purple-50/50 rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-200">
              <Shield className="w-5 h-5 text-purple-700" />
              <h2 className="text-lg font-bold text-purple-900">Administrator Privileges</h2>
            </div>
            <p className="text-sm text-purple-800 leading-relaxed">
              You are logged in as a <strong>Platform Super Administrator</strong> with access to user management, role assignments, system analytics, and all marketplace operations.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
