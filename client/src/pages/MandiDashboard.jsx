import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  completeFarmerMandiBooking,
} from '../services/api';
import DashboardCard from '../components/DashboardCard';
import {
  Sparkles,
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
  Search,
  X,
  Phone,
  Ticket,
  ClipboardCheck,
  Receipt,
  Trash2,
} from 'lucide-react';

const getCropEmoji = (cropName) => {
  const map = {
    wheat: '🌾',
    rice: '🍚',
    paddy: '🌾',
    maize: '🌽',
    corn: '🌽',
    potato: '🥔',
    mustard: '🟡',
    cotton: '☁️',
    sugarcane: '🎋',
    soybean: '🫘',
    onion: '🧅',
    tomato: '🍅',
    chilli: '🌶️',
    gram: '🌱',
    barley: '🌾',
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

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
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'REVIEW', 'ARRIVE', 'QUALITY', 'COMPLETE', 'PAYMENT'
  const [actionLoading, setActionLoading] = useState(false);

  // Prices state
  const [prices, setPrices] = useState([]);
  const [priceSearch, setPriceSearch] = useState('');
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

    const handleQuickAccept = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await reviewMandiBooking(bookingId, {
        action: 'ACCEPT',
        tokenNumber: `TK-${Date.now().toString().slice(-4)}`,
      });
      if (res.success) {
        showToast('Mandi accepted farmer offer! Token issued & Transport unlocked.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickReject = async (bookingId) => {
    const reason = window.prompt('Reason for rejecting this offer (optional):', 'Mandi capacity full');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await reviewMandiBooking(bookingId, {
        action: 'REJECT',
        rejectionReason: reason || 'Mandi capacity full',
      });
      if (res.success) {
        showToast('Farmer offer rejected.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async (bookingId) => {
    if (!window.confirm('Confirm that this crop produce has arrived at Mandi Yard and mark as Delivered?')) return;
    try {
      setActionLoading(true);
      const res = await completeFarmerMandiBooking(bookingId);
      if (res.success) {
        showToast('Crop marked as Delivered & Deal completed!');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as delivered.');
    } finally {
      setActionLoading(false);
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

  // Filtered Bookings for Yard Table
  const displayBookings = bookings.filter((b) => {
    if (!b) return false;
    if (!bookingSearch.trim()) return true;
    const term = bookingSearch.toLowerCase();
    const farmerName = (b.farmer?.name || '').toLowerCase();
    const farmerPhone = (b.farmer?.phone || '').toLowerCase();
    const cropName = (b.crop || b.cropName || '').toLowerCase();
    const token = (b.tokenNumber || '').toLowerCase();
    const bookingNum = (b.bookingNumber || '').toLowerCase();
    return (
      farmerName.includes(term) ||
      farmerPhone.includes(term) ||
      cropName.includes(term) ||
      token.includes(term) ||
      bookingNum.includes(term)
    );
  });

  // Filtered Prices
  const displayPrices = prices.filter((p) => {
    if (!p) return false;
    if (!priceSearch.trim()) return true;
    const term = priceSearch.toLowerCase();
    const crop = (p.crop || '').toLowerCase();
    const variety = (p.variety || '').toLowerCase();
    const grade = (p.qualityGrade || '').toLowerCase();
    return crop.includes(term) || variety.includes(term) || grade.includes(term);
  });

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

      {/* 1. Signature Dark Emerald Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/40">
        {/* Ambient Subtle Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>APMC Mandi Administration • Gate Operations & Procurement Console 🏛️</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {mandi?.name || 'Mandi Administration Console'}
                </h1>
                {isVerified && (
                  <span className="bg-emerald-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                    ✓ APMC VERIFIED
                  </span>
                )}
              </div>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
                {mandi?.address ? `${mandi.address}, ${mandi.district}, ${mandi.state}` : `${mandi?.district || ''}, ${mandi?.state || ''}`} • Hours: <strong className="text-white">{mandi?.operatingHours || '08:00 AM - 06:00 PM'}</strong>
              </p>
            </div>

            {/* Quick Metrics Bar in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending Approvals: <strong className="text-white text-sm">{stats?.pendingRequests || 0}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Truck className="w-3.5 h-3.5 text-teal-400" />
                <span>Today's Arrivals: <strong className="text-teal-300 text-sm">{stats?.arrivedToday || 0}</strong></span>
              </div>

              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Procured Volume: <strong className="text-white text-sm">{stats?.totalQuantityPurchasedQuintals || 0} Qtl</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="relative z-20 flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('prices');
                setShowPriceForm(true);
              }}
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm active:scale-95"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Publish Price</span>
            </button>

            <Link
              to="/mandi-offers"
              className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 transition text-xs sm:text-sm"
            >
              <Package className="w-4 h-4 text-emerald-300" />
              <span>Mandi Offers</span>
            </Link>

            <button
              type="button"
              onClick={fetchData}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur transition"
              title="Refresh Mandi Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* 2. KPI Metrics Row (DashboardCard format matching user screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DashboardCard
          title="Total Bookings"
          value={stats?.totalRequests || bookings.length}
          subtitle="Crop sale bookings"
          icon={Package}
          color="purple"
        />
        <DashboardCard
          title="Pending Review"
          value={stats?.pendingRequests || 0}
          subtitle="Requires scheduling"
          icon={Clock}
          color="amber"
        />
        <DashboardCard
          title="Scheduled Arrivals"
          value={stats?.acceptedBookings || 0}
          subtitle="Arrival tokens assigned"
          icon={Calendar}
          color="blue"
        />
        <DashboardCard
          title="Today's Arrivals"
          value={stats?.arrivedToday || 0}
          subtitle="Crops in yard"
          icon={Truck}
          color="teal"
        />
        <DashboardCard
          title="Procured Volume"
          value={`${stats?.totalQuantityPurchasedQuintals || 0} Qtl`}
          subtitle={`${stats?.completedSales || 0} sales finalized`}
          icon={Scale}
          color="emerald"
        />
      </div>

      {/* Tabs Navigation (Exact match to screenshot) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'bookings', label: 'Farmer Sale Requests & Yard Weighing', icon: Package, badge: stats?.pendingRequests },
          { id: 'prices', label: 'Live Mandi Prices', icon: TrendingUp },
          { id: 'demands', label: 'Procurement Demand', icon: Store },
          { id: 'profile', label: 'Mandi Profile & Hours', icon: Building },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOOKINGS & QUALITY WEIGHING */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Crop Sale Bookings & Yard Logistics
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {displayBookings.length} Bookings
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Review farmer requests, assign arrival tokens, perform weighment, record deductions, and settle payments.
                </p>
              </div>
            </div>

            {/* Filter by status, Search & View Cards shortcut */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Live Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search farmer, crop, token..."
                  className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-44 sm:w-56 transition font-medium"
                />
                {bookingSearch && (
                  <button
                    type="button"
                    onClick={() => setBookingSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
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

              {/* View Cards Shortcut */}
              <Link
                to="/mandi-offers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/20 active:scale-95"
              >
                <Package className="w-3.5 h-3.5 text-emerald-100" />
                <span>View Offers Cards</span>
              </Link>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Farmer & Token</th>
                    <th className="px-5 py-3.5">Crop & Quantity</th>
                    <th className="px-5 py-3.5">Schedule & Arrival</th>
                    <th className="px-5 py-3.5">Price & Payout</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-slate-800 text-sm">No Crop Sale Bookings Found</div>
                          <p className="text-xs text-slate-500">
                            {bookingSearch
                              ? `No bookings matched "${bookingSearch}". Try adjusting your search query.`
                              : 'No bookings found under the selected status filter.'}
                          </p>
                          {(bookingSearch || bookingFilter) && (
                            <button
                              type="button"
                              onClick={() => {
                                setBookingSearch('');
                                setBookingFilter('');
                              }}
                              className="text-xs font-bold text-emerald-700 hover:underline pt-1 inline-block"
                            >
                              Reset filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                        {/* FARMER & TOKEN */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-emerald-500/20">
                              {(b.farmer?.name || 'F').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 group-hover:text-emerald-950 text-sm">
                                {b.farmer?.name || 'Farmer'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{b.farmer?.phone || '—'}</span>
                              </div>
                              {b.tokenNumber ? (
                                <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] bg-slate-900 text-emerald-300 font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                                  <Ticket className="w-3 h-3 text-emerald-400" />
                                  <span>Token: {b.tokenNumber}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic block mt-1">No token assigned</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CROP & QUANTITY */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2.5">
                            <span className="text-2xl leading-none mt-0.5">{getCropEmoji(b.crop || b.cropName)}</span>
                            <div>
                              <div className="font-black text-slate-900 text-sm">
                                {b.crop || b.cropName || 'Crop Produce'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs text-slate-600 font-medium">
                                  Est: <strong className="text-slate-900 font-bold">{b.quantity || b.estimatedQuantity || 0} Qtl</strong>
                                </span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                                  {b.qualityGrade || 'Grade A'}
                                </span>
                              </div>
                              {b.actualQuantity && (
                                <div className="inline-flex items-center gap-1 text-[11px] text-teal-800 font-black mt-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                  <Scale className="w-3 h-3 text-teal-600" />
                                  <span>Weighed: {b.actualQuantity} Qtl ({b.cropQualityGrade || b.qualityGrade})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SCHEDULE & ARRIVAL */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {b.scheduledArrivalDate 
                                  ? new Date(b.scheduledArrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : <span className="italic text-slate-500 font-normal">Pref: {new Date(b.preferredArrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                }
                              </span>
                            </div>
                            {b.actualArrivalTime ? (
                              <div className="inline-flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                                <Clock className="w-3 h-3 text-teal-600" />
                                <span>Arrived: {new Date(b.actualArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 font-medium">Awaiting arrival</div>
                            )}
                          </div>
                        </td>

                        {/* PRICE & PAYOUT */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-slate-700">
                              Rate: <strong className="text-slate-900 font-black">₹{(b.acceptedPricePerQuintal || b.proposedPrice || b.expectedPrice || b.agreedPricePerQuintal || b.proposedPricePerQuintal || b.expectedPricePerQuintal || 0).toLocaleString()}</strong> / Qtl
                            </div>
                            {b.finalPayableAmount > 0 ? (
                              <div className="text-xs font-black text-emerald-700">
                                Total: ₹{b.finalPayableAmount.toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">Total pending weighment</div>
                            )}
                            <div>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                b.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {b.paymentStatus === 'PAID' ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> : <Clock className="w-2.5 h-2.5 text-amber-600" />}
                                <span>Payment: {b.paymentStatus || 'PENDING'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                            b.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black'
                              : b.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-black'
                              : b.status === 'QUALITY_CHECKED'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-black'
                              : b.status === 'ARRIVED'
                              ? 'bg-teal-50 text-teal-800 border-teal-300 font-black'
                              : b.status === 'ACCEPTED'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 font-black'
                              : 'bg-amber-50 text-amber-800 border-amber-300 font-black'
                          }`}>
                            {b.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {b.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {b.status === 'ARRIVED' && <Truck className="w-3.5 h-3.5 text-teal-600" />}
                            {b.status === 'QUALITY_CHECKED' && <Scale className="w-3.5 h-3.5 text-indigo-600" />}
                            {b.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            {b.status === 'ACCEPTED' && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
                            <span>{b.status}</span>
                          </span>
                        </td>

                        {/* WORKFLOW ACTIONS */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {b.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAccept(b._id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickReject(b._id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openActionModal('REVIEW', b)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
                                >
                                  Schedule
                                </button>
                              </>
                            )}

                            {(b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'ARRIVED' || b.status === 'QUALITY_CHECKED') && (
                              <button
                                type="button"
                                onClick={() => handleMarkDelivered(b._id)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark as Delivered</span>
                              </button>
                            )}

                            {b.status === 'ARRIVED' && (
                              <button
                                type="button"
                                onClick={() => openActionModal('QUALITY', b)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
                              >
                                Weigh & Grade
                              </button>
                            )}

                            {b.status === 'QUALITY_CHECKED' && (
                              <button
                                type="button"
                                onClick={() => handleCompleteSaleSubmit(b._id)}
                                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
                              >
                                Complete Sale
                              </button>
                            )}

                            {b.status === 'COMPLETED' && (
                              <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50/90 px-3 py-1.5 rounded-xl border border-emerald-300/80 shadow-2xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Delivered & Settled</span>
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
        </div>
      )}

      {/* TAB 2: LIVE MANDI PRICES */}
      {activeTab === 'prices' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Live Mandi Prices & Daily Rates
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {displayPrices.length} Rates
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Update crop-wise Min, Max, and Modal prices. All entered prices are verified and published directly from this Mandi yard.
                </p>
              </div>
            </div>

            {/* Toolbar: Search & Publish CTA */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  placeholder="Search crop or variety..."
                  className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-44 sm:w-56 transition font-medium"
                />
                {priceSearch && (
                  <button
                    type="button"
                    onClick={() => setPriceSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Publish Rate CTA */}
              <button
                type="button"
                onClick={() => {
                  setShowPriceForm((prev) => !prev);
                  setPriceFormError('');
                  setPriceFormSuccess('');
                }}
                disabled={!isVerified}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm active:scale-95 ${
                  isVerified
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Publish Today's Rate</span>
              </button>
            </div>
          </div>

          {!isVerified && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Notice: Price updating is disabled until your Mandi account has been verified by the administrator.</span>
            </div>
          )}

          {/* New Price Form Modal/Expandable */}
          {showPriceForm && (
            <form onSubmit={handleCreatePrice} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">Publish New Daily Rate</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">* All price fields are in ₹ per quintal</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={priceFormData.crop}
                    onChange={(e) => setPriceFormData({ ...priceFormData, crop: e.target.value })}
                    placeholder="e.g. Wheat, Soybean, Mustard"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Variety (Optional)</label>
                  <input
                    type="text"
                    value={priceFormData.variety}
                    onChange={(e) => setPriceFormData({ ...priceFormData, variety: e.target.value })}
                    placeholder="e.g. Sharbati, Lok-1"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quality Grade</label>
                  <select
                    value={priceFormData.qualityGrade}
                    onChange={(e) => setPriceFormData({ ...priceFormData, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.minPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, minPrice: e.target.value })}
                    placeholder="e.g. 2350"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.maxPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, maxPrice: e.target.value })}
                    placeholder="e.g. 2650"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modal Price (₹/Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceFormData.modalPrice}
                    onChange={(e) => setPriceFormData({ ...priceFormData, modalPrice: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
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

          {/* Price Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayPrices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-slate-800 text-sm">No Live Prices Found</div>
                          <p className="text-xs text-slate-500">
                            {priceSearch
                              ? `No prices matched "${priceSearch}". Try adjusting your search query.`
                              : 'No live price entries published yet. Click "Publish Today\'s Rate" above to publish actual rates.'}
                          </p>
                          {priceSearch && (
                            <button
                              type="button"
                              onClick={() => setPriceSearch('')}
                              className="text-xs font-bold text-emerald-700 hover:underline pt-1 inline-block"
                            >
                              Reset search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayPrices.map((p) => (
                      <tr key={p._id} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                        {/* CROP & VARIETY */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl leading-none">{getCropEmoji(p.crop)}</span>
                            <div>
                              <div className="font-black text-slate-900 group-hover:text-emerald-950 text-sm">
                                {p.crop}
                              </div>
                              {p.variety ? (
                                <span className="inline-block mt-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] px-1.5 py-0.2 rounded border border-slate-200">
                                  {p.variety}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Standard Variety</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* QUALITY GRADE */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>{p.qualityGrade || 'Grade A'}</span>
                          </span>
                        </td>

                        {/* MIN - MAX PRICE */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-800">
                            ₹{Number(p.minPrice || 0).toLocaleString()} – ₹{Number(p.maxPrice || 0).toLocaleString()} <span className="text-slate-500 font-normal">/ Qtl</span>
                          </div>
                        </td>

                        {/* MODAL PRICE */}
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-1 text-xs font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
                            <span>₹{Number(p.modalPrice || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">/ Qtl</span>
                          </div>
                        </td>

                        {/* PRICE SOURCE */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-emerald-300 font-mono shadow-2xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>{p.priceSource || 'MANDI_ENTRY'}</span>
                          </span>
                        </td>

                        {/* REPORTED DATE */}
                        <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePrice(p._id)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-bold transition active:scale-95"
                            title="Delete this price entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCUREMENT DEMAND */}
      {activeTab === 'demands' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Mandi Procurement Demand
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {demands.length} Demands
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Publish crops your Mandi yard is actively procuring so farmers can book guaranteed sale slots.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDemandForm((prev) => !prev)}
              disabled={!isVerified}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm active:scale-95 ${
                isVerified
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Demand Listing</span>
            </button>
          </div>

          {showDemandForm && (
            <form onSubmit={handleCreateDemand} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <h3 className="font-black text-sm sm:text-base text-slate-900">New Procurement Requirement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop *</label>
                  <input
                    type="text"
                    required
                    value={demandFormData.crop}
                    onChange={(e) => setDemandFormData({ ...demandFormData, crop: e.target.value })}
                    placeholder="e.g. Wheat, Gram, Mustard"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required Quantity (Quintals) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={demandFormData.requiredQuantity}
                    onChange={(e) => setDemandFormData({ ...demandFormData, requiredQuantity: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Price Range (₹/Qtl)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={demandFormData.minExpectedPrice}
                      onChange={(e) => setDemandFormData({ ...demandFormData, minExpectedPrice: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={demandFormData.maxExpectedPrice}
                      onChange={(e) => setDemandFormData({ ...demandFormData, maxExpectedPrice: e.target.value })}
                      className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quality Requirements & Guidelines</label>
                <textarea
                  rows="2"
                  value={demandFormData.qualityRequirements}
                  onChange={(e) => setDemandFormData({ ...demandFormData, qualityRequirements: e.target.value })}
                  placeholder="e.g. Clean dry grains, foreign matter below 2%, moisture max 12%"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemandForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Demand'}
                </button>
              </div>
            </form>
          )}

          {/* Demands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {demands.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">No Active Demands</div>
                  <p className="text-xs text-slate-500">
                    No active procurement demands posted yet. Click "Create Demand Listing" above to announce procurement requirements.
                  </p>
                </div>
              </div>
            ) : (
              demands.map((d) => {
                const pct = Math.min(100, Math.round(((d.purchasedQuantity || 0) / (d.requiredQuantity || 1)) * 100));
                return (
                  <div key={d._id} className="p-5 rounded-3xl border border-slate-200/90 bg-white hover:shadow-md transition-all duration-200 space-y-4 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{getCropEmoji(d.crop)}</span>
                        <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-950">{d.crop}</h3>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        d.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : d.status === 'FULFILLED'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {d.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Procured: <strong className="text-emerald-700">{d.purchasedQuantity || 0} Qtl</strong></span>
                        <span className="text-slate-500">Target: {d.requiredQuantity} Qtl</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {d.minExpectedPrice && d.maxExpectedPrice && (
                        <div>
                          Offer Rate: <strong className="text-emerald-700 font-bold">₹{d.minExpectedPrice} - ₹{d.maxExpectedPrice} / Qtl</strong>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{d.qualityRequirements}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleUpdateDemandStatus(d._id, d.status === 'OPEN' ? 'FULFILLED' : 'OPEN')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
                      >
                        Mark {d.status === 'OPEN' ? 'Fulfilled' : 'Open'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDemand(d._id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MANDI PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Mandi Details & Operating Hours
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Keep your contact information, market yard timings, and supported crops updated for farmers.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandi Name</label>
                <input
                  type="text"
                  disabled
                  value={mandi?.name || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandi Type</label>
                <input
                  type="text"
                  disabled
                  value={mandi?.mandiType || 'Government APMC'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={mandiEditData.operatingHours}
                  onChange={(e) => setMandiEditData({ ...mandiEditData, operatingHours: e.target.value })}
                  placeholder="08:00 AM - 06:00 PM"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={mandiEditData.contactPhone}
                  onChange={(e) => setMandiEditData({ ...mandiEditData, contactPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yard Address / Gate Details</label>
              <input
                type="text"
                value={mandiEditData.address}
                onChange={(e) => setMandiEditData({ ...mandiEditData, address: e.target.value })}
                placeholder="Market Yard Road, Gate 3"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Crops Procured (comma-separated)</label>
              <input
                type="text"
                value={mandiEditData.cropsSupported}
                onChange={(e) => setMandiEditData({ ...mandiEditData, cropsSupported: e.target.value })}
                placeholder="Wheat, Rice, Soybean, Mustard, Maize"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition"
              >
                {actionLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
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
