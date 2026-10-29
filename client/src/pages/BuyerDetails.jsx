import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Phone,
  Tag,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';

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
  const displayCrop = cropLot?.crop || profile.interestedCrops?.[0] || 'Wheat';
  const displayGrade = cropLot?.qualityGrade || profile.preferredQualityGrades?.[0] || 'Premium';
  const displayQuantity = cropLot?.quantity || profile.requiredQuantity || profile.minQuantity || 100;
  const displayUnit = cropLot?.unit || 'quintal';
  const displayPrice = cropLot?.expectedPrice || 2200;
  const totalValue = displayPrice * displayQuantity;
  const displayAvailableFrom = cropLot?.availableFrom 
    ? new Date(cropLot.availableFrom).toLocaleDateString() 
    : new Date().toLocaleDateString();
  const displayStatus = cropLot?.status || 'AVAILABLE';

  const buyerName = profile.businessName || buyer.name;
  const buyerLocationText = buyer.location?.district 
    ? `${buyer.location.district}, ${buyer.location.state || 'Punjab'}`
    : 'Ludhiana, Punjab';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/find-buyers')} 
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 text-sm font-semibold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Buyers
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold">{displayCrop}</h1>
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-md backdrop-blur">
                  Grade: {displayGrade}
                </span>
              </div>
              <p className="text-emerald-100 flex items-center text-sm mt-2">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-300" />
                {buyerLocationText}
              </p>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> {displayStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Optional Crop Lot Switcher if farmer has multiple lots */}
          {farmerLots.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 px-4 py-2.5 rounded-xl border border-emerald-100 text-xs">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Selected Lot for this Buyer:
              </span>
              <select
                value={cropLot?._id || ''}
                onChange={(e) => {
                  const found = farmerLots.find(l => l._id === e.target.value);
                  if (found) setCropLot(found);
                }}
                className="bg-white border border-emerald-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              >
                {farmerLots.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.crop} ({l.qualityGrade || 'Standard'}) - {l.quantity} {l.unit || 'qtl'} @ ₹{l.expectedPrice}/qtl
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Available Quantity</span>
              <span className="text-xl font-bold text-slate-900 flex items-center mt-1">
                <Package className="w-5 h-5 mr-1.5 text-emerald-600" />
                {displayQuantity} <span className="text-sm font-normal text-slate-600 ml-1">{displayUnit}</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Farmer Expected Price</span>
              <span className="text-xl font-bold text-emerald-700 flex items-center mt-1">
                <IndianRupee className="w-5 h-5" />
                {displayPrice?.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-600 ml-1">/ {displayUnit}</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Value (Expected)</span>
              <span className="text-xl font-extrabold text-slate-900 flex items-center mt-1">
                ₹{totalValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Details Section (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Lot Specifications */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-emerald-600" /> Lot Specifications
              </h3>
              
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Crop Type:</span>
                  <span className="font-semibold text-slate-800">{displayCrop}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Quality Grade:</span>
                  <span className="font-semibold text-slate-800">{displayGrade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Available From:</span>
                  <span className="font-semibold text-slate-800 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {displayAvailableFrom}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Listing Status:</span>
                  <span className="font-semibold text-slate-800">{displayStatus}</span>
                </div>
              </div>
            </div>

            {/* Right: Buyer Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-emerald-600" /> Buyer Information
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                <div className="font-bold text-slate-900 text-base">{buyerName}</div>
                <div className="text-slate-600 flex items-center text-xs">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {buyerLocationText}
                </div>
                {buyer.phone && (
                  <div className="text-slate-600 flex items-center text-xs">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {buyer.phone}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setIsChatOpen(true);
                  }}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message Buyer
                </button>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {(profile.buyingRequirements || profile.description) && (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-600" /> Description & Notes
              </h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                "{profile.buyingRequirements || profile.description}"
              </p>
            </div>
          )}

          {/* Conditional Action Banner & Buttons */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-emerald-900 text-base">Ready to purchase or negotiate?</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Submit your price and quantity offer or chat directly with the buyer.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setIsChatOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Contact Buyer
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setIsChatOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition text-center"
                >
                  Make Offer
                </button>
              </div>
            </div>
          </div>
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
