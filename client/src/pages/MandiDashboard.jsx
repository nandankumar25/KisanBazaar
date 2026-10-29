import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyMandi,
  updateMyMandi,
  getMandiStats,
  getMandiPrices,
  createMandiPrice,
  deleteMandiPrice,
  getMyMandiDemands,
  createMandiDemand,
  updateMandiDemand,
  deleteMandiDemand,
  getMandiBookings,
  reviewMandiBooking,
  markMandiBookingArrived,
  recordQualityAndWeighing,
  completeMandiSale,
  updateMandiBookingPayment,
} from '../services/api';
import {
  Store,
  TrendingUp,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Truck,
  Plus,
  RefreshCw,
  Scale,
  Award,
  Filter,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react';

const MandiDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'prices', 'demands', 'profile'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mandi Profile & Stats
  const [mandi, setMandi] = useState(null);
  const [stats, setStats] = useState(null);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'REVIEW', 'ARRIVE', 'QUALITY', 'COMPLETE', 'PAYMENT'
  const [actionLoading, setActionLoading] = useState(false);

  // Prices state
  const [prices, setPrices] = useState([]);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceFormError, setPriceFormError] = useState('');
  const [priceFormSuccess, setPriceFormSuccess] = useState('');
  const [priceFormData, setPriceFormData] = useState({
    crop: 'Wheat',
    variety: '',
    qualityGrade: 'Grade A',
    minPrice: '',
    maxPrice: '',
    modalPrice: '',
  });

  // Demands state
  const [demands, setDemands] = useState([]);
  const [showDemandForm, setShowDemandForm] = useState(false);
  const [demandFormData, setDemandFormData] = useState({
    crop: 'Wheat',
    variety: '',
    requiredQuantity: '',
    unit: 'Quintal',
    qualityRequirements: 'Clean dry grains with moisture below 12%',
    minExpectedPrice: '',
    maxExpectedPrice: '',
    validUntil: '',
  });

  // Action form data
  const [reviewData, setReviewData] = useState({
    action: 'ACCEPT',
    scheduledDate: '',
    tokenNumber: '',
    proposedPricePerQuintal: '',
    rejectionReason: '',
    mandiNotes: '',
  });

  const [arrivalData, setArrivalData] = useState({
    gateEntryNumber: '',
    mandiNotes: '',
  });

  const [qualityData, setQualityData] = useState({
    actualQuantity: '',
    qualityGrade: 'Grade A',
    agreedPricePerQuintal: '',
    deductionAmount: 0,
    deductionReason: '',
    mandiNotes: '',
  });

  const [paymentData, setPaymentData] = useState({
    paymentStatus: 'PAID',
    paymentMode: 'Bank Transfer',
    paymentReference: '',
    paymentNotes: '',
  });

  const [mandiEditData, setMandiEditData] = useState({
    operatingHours: '',
    contactPhone: '',
    address: '',
    cropsSupported: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [mandiRes, statsRes, bookingsRes, demandsRes] = await Promise.all([
        getMyMandi(),
        getMandiStats().catch(() => ({ success: false, data: null })),
        getMandiBookings({ status: bookingFilter || undefined }).catch(() => ({ success: false, data: [] })),
        getMyMandiDemands().catch(() => ({ success: false, data: [] })),
      ]);

      if (mandiRes.success && mandiRes.data) {
        setMandi(mandiRes.data);
        setMandiEditData({
          operatingHours: mandiRes.data.operatingHours || '',
          contactPhone: mandiRes.data.contactPhone || '',
          address: mandiRes.data.address || '',
          cropsSupported: (mandiRes.data.cropsSupported || []).join(', '),
        });

        // Fetch prices for this mandi
        const pricesRes = await getMandiPrices({ mandi: mandiRes.data._id }).catch(() => ({ success: false, data: [] }));
        if (pricesRes.success) setPrices(pricesRes.data || []);
      }

      if (statsRes.success) setStats(statsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (demandsRes.success) setDemands(demandsRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load Mandi data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookingFilter]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Price Management Handlers
  const handleCreatePrice = async (e) => {
    e.preventDefault();
    setPriceFormError('');
    setPriceFormSuccess('');
    setError('');

    // Client-side validations
    if (!priceFormData.crop || !priceFormData.crop.trim()) {
      setPriceFormError('Crop name is required.');
      return;
    }

    const numMin = Number(priceFormData.minPrice);
    const numMax = Number(priceFormData.maxPrice);
    const numModal = Number(priceFormData.modalPrice);

    if (isNaN(numMin) || numMin <= 0) {
      setPriceFormError('Minimum price must be a valid number greater than 0.');
      return;
    }

    if (isNaN(numMax) || numMax <= 0) {
      setPriceFormError('Maximum price must be a valid number greater than 0.');
      return;
    }

    if (isNaN(numModal) || numModal <= 0) {
      setPriceFormError('Modal price must be a valid number greater than 0.');
      return;
    }

    if (numMin > numMax) {
      setPriceFormError('Minimum price cannot be greater than maximum price.');
      return;
    }

    if (numModal < numMin || numModal > numMax) {
      setPriceFormError('Modal price must fall within the minimum and maximum price range.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        mandi: mandi?._id,
        crop: priceFormData.crop.trim(),
        variety: priceFormData.variety ? priceFormData.variety.trim() : '',
        qualityGrade: priceFormData.qualityGrade || 'Grade A',
        minPrice: numMin,
        maxPrice: numMax,
        modalPrice: numModal,
        unit: 'quintal',
        date: new Date().toISOString(),
      };

      const res = await createMandiPrice(payload);
      if (res.success) {
        const successMessage = res.message || 'Live Mandi price published successfully.';
        setPriceFormSuccess(successMessage);
        showToast(successMessage);

        // Prepend new price immediately to state so it appears instantly
        if (res.data) {
          setPrices((prev) => [res.data, ...prev.filter((p) => p._id !== res.data._id)]);
        }

        // Reset the form fields
        setPriceFormData({
          crop: '',
          variety: '',
          qualityGrade: 'Grade A',
          minPrice: '',
          maxPrice: '',
          modalPrice: '',
        });

        // Close form after a brief confirmation
        setTimeout(() => {
          setShowPriceForm(false);
          setPriceFormSuccess('');
        }, 1200);

        // Refresh prices from backend to guarantee complete sync
        if (mandi?._id) {
          const pricesRes = await getMandiPrices({ mandi: mandi._id });
          if (pricesRes.success && pricesRes.data) {
            setPrices(pricesRes.data);
          }
        }
      } else {
        setPriceFormError(res.message || 'Failed to publish price.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to publish price.';
      console.error('Error publishing price:', err);
      setPriceFormError(errMsg);
      setError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePrice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this price entry?')) return;
    try {
      const res = await deleteMandiPrice(id);
      if (res.success) {
        showToast('Price entry removed.');
        setPrices((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete price.');
    }
  };

  // Demand Management Handlers
  const handleCreateDemand = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...demandFormData,
        requiredQuantity: Number(demandFormData.requiredQuantity),
        minExpectedPrice: demandFormData.minExpectedPrice ? Number(demandFormData.minExpectedPrice) : undefined,
        maxExpectedPrice: demandFormData.maxExpectedPrice ? Number(demandFormData.maxExpectedPrice) : undefined,
      };
      const res = await createMandiDemand(payload);
      if (res.success) {
        showToast('Procurement demand published to farmers.');
        setShowDemandForm(false);
        setDemands((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish demand.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDemandStatus = async (id, status) => {
    try {
      const res = await updateMandiDemand(id, { status });
      if (res.success) {
        showToast(`Demand status updated to ${status}.`);
        setDemands((prev) => prev.map((d) => (d._id === id ? res.data : d)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update demand status.');
    }
  };

  const handleDeleteDemand = async (id) => {
    if (!window.confirm('Delete this procurement demand?')) return;
    try {
      const res = await deleteMandiDemand(id);
      if (res.success) {
        showToast('Demand deleted.');
        setDemands((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete demand.');
    }
  };

  // Booking Flow Handlers
  const openActionModal = (type, booking) => {
    setSelectedBooking(booking);
    setActionModalType(type);

    if (type === 'REVIEW') {
      const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setReviewData({
        action: 'ACCEPT',
        scheduledDate: booking.preferredArrivalDate ? booking.preferredArrivalDate.split('T')[0] : dateTomorrow,
        tokenNumber: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        proposedPricePerQuintal: booking.expectedPricePerQuintal || '',
        rejectionReason: '',
        mandiNotes: '',
      });
    } else if (type === 'ARRIVE') {
      setArrivalData({
        gateEntryNumber: `GATE-${Math.floor(100 + Math.random() * 900)}`,
        mandiNotes: '',
      });
    } else if (type === 'QUALITY') {
      setQualityData({
        actualQuantity: booking.estimatedQuantity || '',
        qualityGrade: booking.qualityGrade || 'Grade A',
        agreedPricePerQuintal: booking.proposedPricePerQuintal || booking.expectedPricePerQuintal || '',
        deductionAmount: 0,
        deductionReason: '',
        mandiNotes: '',
      });
    } else if (type === 'PAYMENT') {
      setPaymentData({
        paymentStatus: 'PAID',
        paymentMode: 'Bank Transfer',
        paymentReference: `PAY-MND-${Date.now().toString().slice(-6)}`,
        paymentNotes: 'Settled at Mandi accounts counter',
      });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await reviewMandiBooking(selectedBooking._id, {
        action: reviewData.action,
        scheduledDate: reviewData.scheduledDate,
        tokenNumber: reviewData.tokenNumber,
        proposedPricePerQuintal: Number(reviewData.proposedPricePerQuintal) || undefined,
        rejectionReason: reviewData.rejectionReason,
        mandiNotes: reviewData.mandiNotes,
      });
      if (res.success) {
        showToast(`Sale request ${reviewData.action === 'ACCEPT' ? 'Accepted & Scheduled' : 'Rejected'}.`);
        setActionModalType(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrivalSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await markMandiBookingArrived(selectedBooking._id, arrivalData);
      if (res.success) {
        showToast('Farmer arrival recorded at Mandi yard.');
        setActionModalType(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark arrival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQualitySubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const deductions = qualityData.deductionAmount > 0 ? [{
        reason: qualityData.deductionReason || 'Grading & Moisture deduction',
        amount: Number(qualityData.deductionAmount),
      }] : [];

      const res = await recordQualityAndWeighing(selectedBooking._id, {
        actualQuantity: Number(qualityData.actualQuantity),
        qualityGrade: qualityData.qualityGrade,
        agreedPricePerQuintal: Number(qualityData.agreedPricePerQuintal),
        deductions,
        mandiNotes: qualityData.mandiNotes,
      });
      if (res.success) {
        showToast('Quality and weighment recorded. Payable amount calculated.');
        setActionModalType(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record quality and weighing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSaleSubmit = async (bookingId) => {
    if (!window.confirm('Confirm and complete this crop sale transaction?')) return;
    try {
      const res = await completeMandiSale(bookingId);
      if (res.success) {
        showToast('Crop sale completed successfully!');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sale.');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await updateMandiBookingPayment(selectedBooking._id, paymentData);
      if (res.success) {
        showToast('Payment settled and recorded with reference.');
        setActionModalType(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const cropsArr = mandiEditData.cropsSupported
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await updateMyMandi({
        operatingHours: mandiEditData.operatingHours,
        contactPhone: mandiEditData.contactPhone,
        address: mandiEditData.address,
        cropsSupported: cropsArr,
      });

      if (res.success) {
        setMandi(res.data);
        showToast('Mandi profile updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update Mandi details.');
    } finally {
      setActionLoading(false);
    }
  };

  const isVerified = mandi?.verificationStatus === 'VERIFIED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Status Banner */}
      {mandi && mandi.verificationStatus === 'PENDING' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 flex items-start sm:items-center gap-4 text-amber-900 shadow-sm">
          <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-700 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base">Mandi Verification Pending Approval</h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
              Your Mandi registration is currently under review by the platform administrator. Once verified, your mandi will be published to farmers across your district to receive live crop sale requests.
            </p>
          </div>
        </div>
      )}

      {mandi && mandi.verificationStatus === 'REJECTED' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-50 border border-red-200 flex items-start sm:items-center gap-4 text-red-900 shadow-sm">
          <div className="p-2.5 bg-red-100 rounded-2xl text-red-700 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base">Mandi Registration Rejected</h3>
            <p className="text-xs sm:text-sm text-red-800 mt-0.5">
              Reason: {mandi.rejectionReason || 'Details could not be verified. Please update your profile information.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>{mandi?.mandiType || 'Government'} APMC Yard</span>
            {isVerified && (
              <span className="bg-emerald-400 text-emerald-950 font-black px-2 py-0.2 rounded-full text-[10px]">
                ✓ VERIFIED
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mandi?.name || 'Mandi Administration Console'}
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            {mandi?.address ? `${mandi.address}, ${mandi.district}, ${mandi.state}` : `${mandi?.district || ''}, ${mandi?.state || ''}`} • Hours: {mandi?.operatingHours || '08:00 AM - 06:00 PM'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh Live Data"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold border border-white/20 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Dashboard Metrics (Actual MongoDB Data) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500 block">Total Requests</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {stats?.totalRequests || 0}
          </span>
          <span className="text-[11px] text-slate-500 mt-2 block">Crop sale bookings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-amber-700 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {stats?.pendingRequests || 0}
          </span>
          <span className="text-[11px] text-amber-800 mt-2 block">Requires scheduling</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-blue-700 block">Accepted & Scheduled</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {stats?.acceptedBookings || 0}
          </span>
          <span className="text-[11px] text-blue-800 mt-2 block">Arrival tokens assigned</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-teal-700 block">Today's Arrivals</span>
          <span className="text-2xl font-black text-teal-700 mt-1 block">
            {stats?.arrivedToday || 0}
          </span>
          <span className="text-[11px] text-teal-800 mt-2 block">Crops in yard</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-emerald-700 block">Purchased Quantity</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {stats?.totalQuantityPurchasedQuintals || 0} <span className="text-xs font-medium">Qtl</span>
          </span>
          <span className="text-[11px] text-emerald-800 mt-2 block">
            {stats?.completedSales || 0} sales finalized
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'bookings', label: 'Farmer Sale Requests & Yard Weighing', icon: Package, badge: stats?.pendingRequests },
          { id: 'prices', label: 'Live Mandi Prices', icon: TrendingUp },
          { id: 'demands', label: 'Procurement Demand', icon: Store },
          { id: 'profile', label: 'Mandi Profile & Hours', icon: Building },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="bg-white text-emerald-950 font-black px-2 py-0.5 rounded-full text-xs">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOOKINGS & QUALITY WEIGHING */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Crop Sale Bookings & Yard Logistics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review farmer requests, assign arrival tokens, perform weighment, record deductions, and settle payments.
              </p>
            </div>

            {/* Filter by status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="">All Bookings</option>
                <option value="PENDING">Pending Review</option>
                <option value="ACCEPTED">Accepted / Scheduled</option>
                <option value="ARRIVED">Arrived at Yard</option>
                <option value="QUALITY_CHECKED">Quality Checked</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Farmer & Token</th>
                  <th className="px-5 py-3.5">Crop & Quantity</th>
                  <th className="px-5 py-3.5">Schedule & Arrival</th>
                  <th className="px-5 py-3.5">Price & Payout</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-400 text-sm">
                      No crop sale bookings found matching the filter.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{b.farmer?.name || 'Farmer'}</div>
                        <div className="text-xs text-slate-500">{b.farmer?.phone || '—'}</div>
                        {b.tokenNumber && (
                          <span className="inline-block mt-1 font-mono text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                            Token: {b.tokenNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-emerald-800">{b.cropName}</div>
                        <div className="text-xs text-slate-600">
                          Est: <span className="font-semibold">{b.estimatedQuantity} Qtl</span> ({b.qualityGrade})
                        </div>
                        {b.actualQuantity && (
                          <div className="text-xs text-teal-700 font-bold mt-0.5">
                            Weighed: {b.actualQuantity} Qtl ({b.cropQualityGrade || b.qualityGrade})
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {b.scheduledArrivalDate ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {new Date(b.scheduledArrivalDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Preferred: {new Date(b.preferredArrivalDate).toLocaleDateString()}</span>
                        )}
                        {b.actualArrivalTime && (
                          <div className="text-[11px] text-teal-700 mt-0.5">
                            Arrived: {new Date(b.actualArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-800">
                          Rate: <span className="font-bold">₹{b.agreedPricePerQuintal || b.proposedPricePerQuintal || b.expectedPricePerQuintal}/Qtl</span>
                        </div>
                        {b.finalPayableAmount > 0 && (
                          <div className="text-xs font-black text-emerald-700 mt-0.5">
                            Total: ₹{b.finalPayableAmount.toLocaleString()}
                          </div>
                        )}
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          Payment: {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : b.status === 'REJECTED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : b.status === 'QUALITY_CHECKED'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : b.status === 'ARRIVED'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : b.status === 'ACCEPTED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {b.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => openActionModal('REVIEW', b)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Review & Schedule
                            </button>
                          )}

                          {b.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => openActionModal('ARRIVE', b)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Mark Arrived
                            </button>
                          )}

                          {b.status === 'ARRIVED' && (
                            <button
                              type="button"
                              onClick={() => openActionModal('QUALITY', b)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Weigh & Grade
                            </button>
                          )}

                          {b.status === 'QUALITY_CHECKED' && (
                            <button
                              type="button"
                              onClick={() => handleCompleteSaleSubmit(b._id)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Complete Sale
                            </button>
                          )}

                          {b.status === 'COMPLETED' && b.paymentStatus === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => openActionModal('PAYMENT', b)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Record Payment
                            </button>
                          )}

                          {b.paymentStatus === 'PAID' && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE MANDI PRICES */}
      {activeTab === 'prices' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Live Mandi Prices & Daily Rates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update crop-wise Min, Max, and Modal prices. All entered prices are verified and published directly from this Mandi yard.
              </p>
            </div>

            <button
              onClick={() => {
                setShowPriceForm((prev) => !prev);
                setPriceFormError('');
                setPriceFormSuccess('');
              }}
              disabled={!isVerified}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                isVerified
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Publish Today's Rate</span>
            </button>
          </div>

          {!isVerified && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              Notice: Price updating is disabled until your Mandi account has been verified by the administrator.
            </div>
          )}

          {/* New Price Form */}
          {showPriceForm && (
            <form onSubmit={handleCreatePrice} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Publish New Daily Rate</h3>
                <span className="text-[11px] text-slate-500">* All price fields are in ₹ per quintal</span>
              </div>

              {/* In-form Success Alert */}
              {priceFormSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{priceFormSuccess}</span>
                </div>
              )}

              {/* In-form Error Alert */}
              {priceFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{priceFormError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPriceFormError('')}
                    className="text-[11px] underline font-bold ml-2 text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={priceFormData.crop}
                    onChange={(e) => setPriceFormData({ ...priceFormData, crop: e.target.value })}
                    placeholder="e.g. Wheat, Soybean, Mustard"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Variety (Optional)</label>
                  <input
                    type="text"
                    value={priceFormData.variety}
                    onChange={(e) => setPriceFormData({ ...priceFormData, variety: e.target.value })}
                    placeholder="e.g. Sharbati, Lok-1"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quality Grade</label>
                  <select
                    value={priceFormData.qualityGrade}
                    onChange={(e) => setPriceFormData({ ...priceFormData, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Fair)</option>
                    <option value="FAQ">FAQ (Fair Average Quality)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.minPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, minPrice: e.target.value })}
                    placeholder="e.g. 2350"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.maxPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, maxPrice: e.target.value })}
                    placeholder="e.g. 2650"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modal Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.modalPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, modalPrice: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriceForm(false);
                    setPriceFormError('');
                    setPriceFormSuccess('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center space-x-1.5 transition"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{actionLoading ? 'Publishing...' : 'Save & Publish Price'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Price List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Crop & Variety</th>
                  <th className="px-5 py-3.5">Quality Grade</th>
                  <th className="px-5 py-3.5">Min - Max Price</th>
                  <th className="px-5 py-3.5">Modal Price</th>
                  <th className="px-5 py-3.5">Price Source</th>
                  <th className="px-5 py-3.5">Reported Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-sm">
                      No live price entries published yet. Click "Publish Today's Rate" above to publish actual mandi rates.
                    </td>
                  </tr>
                ) : (
                  prices.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {p.crop} {p.variety ? `(${p.variety})` : ''}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700">
                        {p.qualityGrade || 'Standard'}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                        ₹{p.minPrice} - ₹{p.maxPrice} / Qtl
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        ₹{p.modalPrice} / Qtl
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {p.priceSource || 'MANDI_ADMIN'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(p.date || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePrice(p._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROCUREMENT DEMAND */}
      {activeTab === 'demands' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mandi Procurement Demand</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish crops your Mandi yard is actively procuring so farmers can book guaranteed sale slots.
              </p>
            </div>

            <button
              onClick={() => setShowDemandForm((prev) => !prev)}
              disabled={!isVerified}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                isVerified
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Demand Listing</span>
            </button>
          </div>

          {showDemandForm && (
            <form onSubmit={handleCreateDemand} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-slate-900">New Procurement Requirement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Crop *</label>
                  <input
                    type="text"
                    required
                    value={demandFormData.crop}
                    onChange={(e) => setDemandFormData({ ...demandFormData, crop: e.target.value })}
                    placeholder="e.g. Wheat, Gram, Mustard"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Required Quantity (Quintals) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={demandFormData.requiredQuantity}
                    onChange={(e) => setDemandFormData({ ...demandFormData, requiredQuantity: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expected Price Range (₹/Qtl)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={demandFormData.minExpectedPrice}
                      onChange={(e) => setDemandFormData({ ...demandFormData, minExpectedPrice: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={demandFormData.maxExpectedPrice}
                      onChange={(e) => setDemandFormData({ ...demandFormData, maxExpectedPrice: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quality Requirements & Guidelines</label>
                <textarea
                  rows="2"
                  value={demandFormData.qualityRequirements}
                  onChange={(e) => setDemandFormData({ ...demandFormData, qualityRequirements: e.target.value })}
                  placeholder="e.g. Clean dry grains, foreign matter below 2%, moisture max 12%"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemandForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Demand'}
                </button>
              </div>
            </form>
          )}

          {/* Demands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                No active procurement demands posted yet.
              </div>
            ) : (
              demands.map((d) => (
                <div key={d._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">{d.crop}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      d.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : d.status === 'FULFILLED'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div>
                      Target Quantity: <span className="font-bold text-slate-900">{d.requiredQuantity} Qtl</span>
                    </div>
                    <div>
                      Purchased: <span className="font-bold text-teal-700">{d.purchasedQuantity || 0} Qtl</span>
                    </div>
                    {d.minExpectedPrice && d.maxExpectedPrice && (
                      <div>
                        Rate: <span className="font-bold text-emerald-700">₹{d.minExpectedPrice} - ₹{d.maxExpectedPrice} / Qtl</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 pt-1 line-clamp-2">{d.qualityRequirements}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateDemandStatus(d._id, d.status === 'OPEN' ? 'FULFILLED' : 'OPEN')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Mark {d.status === 'OPEN' ? 'Fulfilled' : 'Open'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDemand(d._id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MANDI PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mandi Details & Operating Hours</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your contact information, market yard timings, and supported crops updated for farmers.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mandi Name</label>
                <input
                  type="text"
                  disabled
                  value={mandi?.name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mandi Type</label>
                <input
                  type="text"
                  disabled
                  value={mandi?.mandiType || 'Government'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={mandiEditData.operatingHours}
                  onChange={(e) => setMandiEditData({ ...mandiEditData, operatingHours: e.target.value })}
                  placeholder="08:00 AM - 06:00 PM"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={mandiEditData.contactPhone}
                  onChange={(e) => setMandiEditData({ ...mandiEditData, contactPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Yard Address / Gate Details</label>
              <input
                type="text"
                value={mandiEditData.address}
                onChange={(e) => setMandiEditData({ ...mandiEditData, address: e.target.value })}
                placeholder="Market Yard Road, Gate 3"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Crops Procured (comma-separated)</label>
              <input
                type="text"
                value={mandiEditData.cropsSupported}
                onChange={(e) => setMandiEditData({ ...mandiEditData, cropsSupported: e.target.value })}
                placeholder="Wheat, Rice, Soybean, Mustard, Maize"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              {actionLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* WORKFLOW MODAL: REVIEW & SCHEDULE */}
      {actionModalType === 'REVIEW' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              Review Farmer Sale Booking Request
            </h3>
            <p className="text-xs text-slate-600">
              Farmer: <span className="font-bold">{selectedBooking.farmer?.name}</span> • Crop: <span className="font-bold text-emerald-800">{selectedBooking.cropName}</span> ({selectedBooking.estimatedQuantity} Qtl)
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, action: 'ACCEPT' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reviewData.action === 'ACCEPT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✓ Accept & Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, action: 'REJECT' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reviewData.action === 'REJECT'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✗ Reject Request
                  </button>
                </div>
              </div>

              {reviewData.action === 'ACCEPT' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Date *</label>
                      <input
                        type="date"
                        required
                        value={reviewData.scheduledDate}
                        onChange={(e) => setReviewData({ ...reviewData, scheduledDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Yard Token Number *</label>
                      <input
                        type="text"
                        required
                        value={reviewData.tokenNumber}
                        onChange={(e) => setReviewData({ ...reviewData, tokenNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Proposed Price (₹/Qtl)</label>
                    <input
                      type="number"
                      value={reviewData.proposedPricePerQuintal}
                      onChange={(e) => setReviewData({ ...reviewData, proposedPricePerQuintal: e.target.value })}
                      placeholder={`Farmer expected: ₹${selectedBooking.expectedPricePerQuintal || '—'}`}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rejection Reason *</label>
                  <textarea
                    required
                    rows="2"
                    value={reviewData.rejectionReason}
                    onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                    placeholder="e.g. Mandi yard procurement limit reached for today"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instructions for Farmer (Optional)</label>
                <input
                  type="text"
                  value={reviewData.mandiNotes}
                  onChange={(e) => setReviewData({ ...reviewData, mandiNotes: e.target.value })}
                  placeholder="e.g. Bring lot directly to Gate No. 2 Weighbridge"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: ARRIVAL */}
      {actionModalType === 'ARRIVE' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Farmer Arrival at Mandi Yard</h3>
            <p className="text-xs text-slate-600">
              Token: <span className="font-mono font-bold">{selectedBooking.tokenNumber}</span> • Farmer: <span className="font-bold">{selectedBooking.farmer?.name}</span>
            </p>

            <form onSubmit={handleArrivalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gate Entry Slip / Number</label>
                <input
                  type="text"
                  value={arrivalData.gateEntryNumber}
                  onChange={(e) => setArrivalData({ ...arrivalData, gateEntryNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Yard Notes</label>
                <input
                  type="text"
                  value={arrivalData.mandiNotes}
                  onChange={(e) => setArrivalData({ ...arrivalData, mandiNotes: e.target.value })}
                  placeholder="e.g. Parked at Bay 4, ready for sampling"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {actionLoading ? 'Recording...' : 'Confirm Arrival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: QUALITY & WEIGHING */}
      {actionModalType === 'QUALITY' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              Weighment & Quality Inspection
            </h3>
            <p className="text-xs text-slate-600">
              Crop: <span className="font-bold text-emerald-800">{selectedBooking.cropName}</span> • Estimated: {selectedBooking.estimatedQuantity} Qtl
            </p>

            <form onSubmit={handleQualitySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Actual Net Weight (Quintals) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qualityData.actualQuantity}
                    onChange={(e) => setQualityData({ ...qualityData, actualQuantity: e.target.value })}
                    placeholder="Weighbridge net weight"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quality Grade Assessed</label>
                  <select
                    value={qualityData.qualityGrade}
                    onChange={(e) => setQualityData({ ...qualityData, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Sub-standard)</option>
                    <option value="FAQ">FAQ (Fair Average Quality)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Agreed Final Rate (₹/Quintal) *</label>
                <input
                  type="number"
                  required
                  value={qualityData.agreedPricePerQuintal}
                  onChange={(e) => setQualityData({ ...qualityData, agreedPricePerQuintal: e.target.value })}
                  placeholder="Rate agreed with farmer"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-800"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700">Deductions (if any)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Deduction ₹ (e.g. 200)"
                    value={qualityData.deductionAmount}
                    onChange={(e) => setQualityData({ ...qualityData, deductionAmount: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. moisture excess)"
                    value={qualityData.deductionReason}
                    onChange={(e) => setQualityData({ ...qualityData, deductionReason: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Live Preview of Payable Amount */}
              {qualityData.actualQuantity && qualityData.agreedPricePerQuintal && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Calculated Total Payout:</span>
                  <span className="text-emerald-950 font-black text-sm">
                    ₹{(
                      Number(qualityData.actualQuantity) * Number(qualityData.agreedPricePerQuintal) -
                      (Number(qualityData.deductionAmount) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Weighment & Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: RECORD PAYMENT */}
      {actionModalType === 'PAYMENT' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Record Mandi Payment Settlement</h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>Farmer: <span className="font-bold text-slate-800">{selectedBooking.farmer?.name}</span></div>
              <div>Final Quantity: <span className="font-bold">{selectedBooking.actualQuantity} Qtl</span></div>
              <div className="text-sm font-black text-emerald-800">
                Amount Payable: ₹{selectedBooking.finalPayableAmount?.toLocaleString()}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="Bank Transfer">Direct Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cheque">Mandi Account Cheque</option>
                  <option value="Cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Reference / UTR Number *</label>
                <input
                  type="text"
                  required
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  placeholder="e.g. UTR-98231023812"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={paymentData.paymentNotes}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentNotes: e.target.value })}
                  placeholder="e.g. Paid in full via Mandi Treasury"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MandiDashboard;
