import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Register = () => {
  const { register, googleRegister } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'FARMER',
    state: '',
    district: '',
    businessName: '',
    vehicleType: '',
    vehicleNumber: '',
    capacity: '',
    pricePerKm: '',
    mandiName: '',
    mandiType: 'Government',
    operatingHours: '08:00 AM - 06:00 PM',
    mandiAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({
      ...formData,
      role: selectedRole,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill in all essential personal details.');
      return;
    }

    if (!formData.state || !formData.district) {
      setError('Please provide state and district.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
      location: {
        state: formData.state,
        district: formData.district,
      },
    };

    if (formData.role === 'BUYER' && formData.businessName) {
      payload.buyerProfile = {
        businessName: formData.businessName,
      };
    }

    if (formData.role === 'TRANSPORTER') {
      payload.transporterProfile = {
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        capacity: Number(formData.capacity) || 0,
        pricePerKm: Number(formData.pricePerKm) || 0,
      };
    }

    if (formData.role === 'MANDI_ADMIN') {
      if (!formData.mandiName) {
        setError('Please provide the Mandi name.');
        setLoading(false);
        return;
      }
      payload.mandiName = formData.mandiName;
      payload.mandiType = formData.mandiType || 'Government';
      payload.operatingHours = formData.operatingHours || '08:00 AM - 06:00 PM';
      payload.address = formData.mandiAddress;
    }

    setError('');
    setInfoMessage('');

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      setError('');
      setInfoMessage(
        res.message || 'Account created successfully! Please check your email to verify your account.'
      );
      // Wait a moment then navigate
      setTimeout(() => {
        if (formData.role === 'FARMER') navigate('/farmer');
        else if (formData.role === 'BUYER') navigate('/buyers');
        else if (formData.role === 'TRANSPORTER') navigate('/transporter-dashboard');
        else if (formData.role === 'MANDI_ADMIN') navigate('/mandi-dashboard');
        else navigate('/');
      }, 2000);
    } else {
      setInfoMessage('');
      setError(res.message || 'Registration failed.');
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setError('');
    const res = await googleRegister(credential, formData.role, {
      mandiName: formData.mandiName,
      mandiType: formData.mandiType,
      operatingHours: formData.operatingHours,
      contactPhone: formData.contactPhone,
    });
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.role === 'FARMER') navigate('/farmer');
      else if (res.user.role === 'BUYER') navigate('/buyers');
      else if (res.user.role === 'TRANSPORTER') navigate('/transporter-dashboard');
      else if (res.user.role === 'MANDI_ADMIN') navigate('/mandi-dashboard');
      else navigate('/');
    } else {
      setError(res.message || 'Google registration failed.');
    }
  };

  const handleGoogleError = (err) => {
    setError(err || 'Google sign-in encountered an error.');
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            KB
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Join KisanBazaar to streamline crop trade and logistics
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {infoMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-emerald-900">{infoMessage}</p>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'FARMER', label: 'Farmer / Producer', desc: 'Sell crops directly' },
                { id: 'BUYER', label: 'Crop Buyer / Trader', desc: 'Purchase crop lots' },
                { id: 'TRANSPORTER', label: 'Transporter / Fleet', desc: 'Provide transit' },
                { id: 'MANDI_ADMIN', label: 'Mandi Admin / APMC', desc: 'Procure & trade crops' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    formData.role === r.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm block">{r.label}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block leading-tight">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Patel"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password (min 6 chars)
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder="Madhya Pradesh"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                District
              </label>
              <input
                type="text"
                name="district"
                required
                value={formData.district}
                onChange={handleChange}
                placeholder="Indore"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Role specific extras */}
          {formData.role === 'BUYER' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Business / Firm Name (Optional)
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Patel Agro Traders Ltd"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          )}

          {formData.role === 'TRANSPORTER' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Initial Fleet Vehicle Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    placeholder="e.g. Tata 407 / 10-Ton Truck"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="MP-09-AB-1234"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Capacity (Quintals)</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price Per KM (₹)</label>
                  <input
                    type="number"
                    name="pricePerKm"
                    value={formData.pricePerKm}
                    onChange={handleChange}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'MANDI_ADMIN' && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">Mandi / Yard Registration Details</h4>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Requires Admin Verification</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mandi Name *</label>
                  <input
                    type="text"
                    name="mandiName"
                    required
                    value={formData.mandiName}
                    onChange={handleChange}
                    placeholder="e.g. Indore APMC Grain Market"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mandi Type</label>
                  <select
                    name="mandiType"
                    value={formData.mandiType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Government">Government (APMC / Sub-Yard)</option>
                    <option value="Private">Private / Corporate Market Yard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    name="operatingHours"
                    value={formData.operatingHours}
                    onChange={handleChange}
                    placeholder="08:00 AM - 06:00 PM"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Yard Address / Location</label>
                  <input
                    type="text"
                    name="mandiAddress"
                    value={formData.mandiAddress}
                    onChange={handleChange}
                    placeholder="e.g. Market Yard Rd, Gate 2"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                Note: Mandi accounts are verified by the platform admin before your mandi is listed as an official procurement destination for farmers.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-500 font-medium">Or sign up with</span>
          </div>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="signup_with"
        />

        <p className="text-center text-sm text-slate-600 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
