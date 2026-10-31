import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getBuyerById, getCropLotById, getCropLots } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Package, 
  IndianRupee, 
  MapPin, 
  User, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  FileText,
  Phone,
  Tag,
  MessageSquare,
  ShieldCheck,
  Building2,
  Banknote,
  Scale,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';

const getCropEmoji = (crop) => {
  const c = (crop || '').toLowerCase();
  if (c.includes('wheat') || c.includes('kanak')) return '🌾';
  if (c.includes('rice') || c.includes('paddy') || c.includes('basmati')) return '🍚';
  if (c.includes('potato') || c.includes('aalu')) return '🥔';
  if (c.includes('mustard') || c.includes('sarson') || c.includes('oil')) return '🌼';
  if (c.includes('maize') || c.includes('makka')) return '🌽';
  if (c.includes('onion') || c.includes('pyaz')) return '🧅';
  if (c.includes('tomato') || c.includes('tamatar')) return '🍅';
  if (c.includes('cotton') || c.includes('kapas')) return '🌿';
  if (c.includes('veg')) return '🥬';
  return '🌱';
};

const BuyerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [buyer, setBuyer] = useState(null);
  const [cropLot, setCropLot] = useState(null);
  const [farmerLots, setFarmerLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const lotIdQuery = searchParams.get('cropLot');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Buyer details
        const buyerRes = await getBuyerById(id);
        if (buyerRes.success && buyerRes.data) {
          setBuyer(buyerRes.data);
        } else if (buyerRes.data) {
          setBuyer(buyerRes.data);
        } else {
          setError('Buyer not found');
          return;
        }

        // If a specific crop lot was passed in query param, fetch it
        let selectedLot = null;
        if (lotIdQuery) {
          try {
            const lotRes = await getCropLotById(lotIdQuery);
            if (lotRes.success && lotRes.data) {
              selectedLot = lotRes.data;
              setCropLot(selectedLot);
            }
          } catch (e) {
            console.warn('Could not load specific crop lot query', e);
          }
        }

        // If authenticated farmer, fetch their available lots to enable switching
        if (user?._id) {
          try {
            const lotsRes = await getCropLots({ farmer: user._id, status: 'AVAILABLE' });
            if (lotsRes.data && lotsRes.data.length > 0) {
              setFarmerLots(lotsRes.data);
              if (!selectedLot) {
                setCropLot(lotsRes.data[0]);
              }
            }
          } catch (e) {
            console.warn('Could not load farmer lots', e);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load buyer details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, lotIdQuery, user?._id]);

  if (loading) return <Loading message="Loading buyer details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!buyer) return <ErrorMessage message="Buyer not found." />;

  const profile = buyer.buyerProfile || {};

  // Derive display values based on linked crop lot or buyer requirements
  const displayCrop = cropLot?.crop || profile.interestedCrops?.[0] || 'Produce Lot';
  const displayGrade = cropLot?.qualityGrade || profile.preferredQualityGrades?.[0] || 'Standard';
  const displayQuantity = cropLot?.quantity || profile.requiredQuantity || profile.minQuantity || 50;
  const displayUnit = cropLot?.unit || 'quintal';
  const displayPrice = cropLot?.expectedPrice || 2200;
  const totalValue = displayPrice * displayQuantity;
  const displayAvailableFrom = cropLot?.availableFrom 
    ? new Date(cropLot.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const displayStatus = cropLot?.status || 'AVAILABLE';

  const buyerName = profile.businessName || buyer.name;
  const buyerLocationText = buyer.location?.district 
    ? `${buyer.location.district}, ${buyer.location.state || 'Punjab'}`
    : 'Ludhiana, Punjab';

  const emoji = getCropEmoji(displayCrop);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button link */}
      <button 
        onClick={() => navigate('/find-buyers')} 
        className="inline-flex items-center space-x-2 text-slate-600 hover:text-emerald-700 font-bold text-xs sm:text-sm bg-white hover:bg-emerald-50 px-4 py-2 rounded-xl border border-slate-200 transition shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Suitable Buyers</span>
      </button>

      {/* 1. High-Aesthetic Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-700/50">
        {/* Subtle Ambient Lighting Orbs */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-3xl sm:text-4xl flex items-center justify-center shrink-0 shadow-lg">
              {emoji}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1 px-3 py-1 text-[10px] sm:text-xs font-black uppercase rounded-full bg-black/30 text-emerald-200 border border-white/15 backdrop-blur-md">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>Grade: {displayGrade}</span>
                </span>

                <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-[10px] sm:text-xs font-black uppercase rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{displayStatus}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                {displayCrop}
              </h1>

              <p className="text-emerald-200/90 flex items-center text-xs sm:text-sm font-semibold">
                <MapPin className="w-4 h-4 mr-1 text-emerald-400 shrink-0" />
                <span>{buyerLocationText}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Button in Header */}
          <div className="relative z-20 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                setIsChatOpen(true);
              }}
              className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 transition text-xs sm:text-sm"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>Chat with Buyer</span>
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                if (cropLot?._id) {
                  navigate(`/make-offer/${cropLot._id}?buyerId=${buyer._id}`);
                } else {
                  navigate('/find-crops');
                }
              }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg shadow-emerald-950/50 hover:from-emerald-300 hover:to-teal-300 transition text-xs sm:text-sm group"
            >
              <span>Make Offer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Crop Lot Switcher */}
      {farmerLots.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Select Different Crop Lot from Your Inventory:</span>
          </span>
          <select
            value={cropLot?._id || ''}
            onChange={(e) => {
              const found = farmerLots.find(l => l._id === e.target.value);
              if (found) setCropLot(found);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs"
          >
            {farmerLots.map(l => (
              <option key={l._id} value={l._id}>
                {l.crop} (Grade {l.qualityGrade || 'A'}) • {l.quantity} {l.unit || 'qtl'} @ ₹{Number(l.expectedPrice || 0).toLocaleString('en-IN')}/qtl
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2. Key Valuation & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-1 hover:shadow-md transition">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center space-x-1">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Available Quantity</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline space-x-1 pt-1">
            <span>{displayQuantity}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">{displayUnit}</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold pt-1">Batch Ready for Dispatch</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-1 hover:shadow-md transition">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center space-x-1">
            <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
            <span>Farmer Expected Price</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 flex items-baseline space-x-1 pt-1">
            <span>₹{Number(displayPrice || 0).toLocaleString('en-IN')}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">/{displayUnit}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold pt-1">MSP Regulated Rate</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-1 hover:shadow-md transition">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center space-x-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-700" />
            <span>Total Value (Expected)</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 pt-1">
            ₹{Number(totalValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold pt-1">Direct Escrow Protected</p>
        </div>
      </div>

      {/* 3. Detailed Information Grid (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Lot Specifications */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Tag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Lot Specifications</h3>
              <p className="text-xs text-slate-500">Quality and harvest shipment details</p>
            </div>
          </div>
          
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Crop Type:</span>
              <span className="font-bold text-slate-900">{displayCrop}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Quality Grade:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                Grade {displayGrade}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Available From:</span>
              <span className="font-bold text-slate-900 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {displayAvailableFrom}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Listing Status:</span>
              <span className="font-bold text-emerald-700 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {displayStatus}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">Direct Escrow:</span>
              <span className="font-bold text-emerald-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Protected Payment
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Buyer Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Buyer Profile</h3>
              <p className="text-xs text-slate-500">Verified commercial purchaser details</p>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-lg">{buyerName}</h4>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {profile.businessType || 'Commercial Grain Buyer'}
                </p>
              </div>
              <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Verified</span>
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-2 border-t border-slate-200/60">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{buyerLocationText}</span>
              </div>
              {buyer.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{buyer.phone}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                setIsChatOpen(true);
              }}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message & Chat with Buyer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Description & Notes */}
      {(profile.buyingRequirements || profile.description) && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-2">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Buyer Requirements & Notes</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
            "{profile.buyingRequirements || profile.description}"
          </p>
        </div>
      )}

      {/* 5. Deal Conversion Bottom Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Middleman Charges</span>
          </div>
          <h4 className="font-black text-xl sm:text-2xl text-white">
            Ready to close the deal or negotiate price?
          </h4>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
            Submit a binding price and quantity offer, or open an instant direct chat with the buyer to finalize transport and delivery terms.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              setIsChatOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl backdrop-blur transition flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            <span>Chat Directly</span>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              if (cropLot?._id) {
                navigate(`/make-offer/${cropLot._id}?buyerId=${buyer._id}`);
              } else {
                navigate('/find-crops');
              }
            }}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 group"
          >
            <span>Make Offer</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Real-time Messaging Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipient={buyer}
        cropLot={cropLot}
      />
    </div>
  );
};

export default BuyerDetails;
