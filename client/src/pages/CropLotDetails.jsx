import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCropLotById } from '../services/api';
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
  MessageSquare,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';
import FarmerMandiBookingModal from '../components/FarmerMandiBookingModal';

const CropLotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [cropLot, setCropLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMandiModalOpen, setIsMandiModalOpen] = useState(false);

  useEffect(() => {
    const fetchLot = async () => {
      try {
        setLoading(true);
        const res = await getCropLotById(id);
        if (res.success && res.data) {
          setCropLot(res.data);
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
  }, [id]);

  if (loading) return <Loading message="Loading crop lot details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!cropLot) return <ErrorMessage message="Crop lot not found." />;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> AVAILABLE
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" /> RESERVED
          </span>
        );
      case 'SOLD':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1" /> SOLD
          </span>
        );
      default:
        return null;
    }
  };

  const totalValue = (cropLot.expectedPrice || 0) * (cropLot.quantity || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/find-crops')} 
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 text-sm font-semibold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Crop Lots
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold">{cropLot.crop}</h1>
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-md backdrop-blur">
                  Grade: {cropLot.qualityGrade}
                </span>
              </div>
              <p className="text-emerald-100 flex items-center text-sm mt-2">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-300" />
                {cropLot.location?.village ? `${cropLot.location.village}, ` : ''}
                {cropLot.location?.city || cropLot.location?.district}, {cropLot.location?.state}
              </p>
            </div>
            <div>
              {getStatusBadge(cropLot.status)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Available Quantity</span>
              <span className="text-xl font-bold text-slate-900 flex items-center mt-1">
                <Package className="w-5 h-5 mr-1.5 text-emerald-600" />
                {cropLot.quantity} <span className="text-sm font-normal text-slate-600 ml-1">{cropLot.unit || 'quintals'}</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Farmer Expected Price</span>
              <span className="text-xl font-bold text-emerald-700 flex items-center mt-1">
                <IndianRupee className="w-5 h-5" />
                {cropLot.expectedPrice?.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-600 ml-1">/ {cropLot.unit || 'qtl'}</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Value (Expected)</span>
              <span className="text-xl font-extrabold text-slate-900 flex items-center mt-1">
                ₹{totalValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-emerald-600" /> Lot Specifications
              </h3>
              
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Crop Type:</span>
                  <span className="font-semibold text-slate-800">{cropLot.crop}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Quality Grade:</span>
                  <span className="font-semibold text-slate-800">{cropLot.qualityGrade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Available From:</span>
                  <span className="font-semibold text-slate-800 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {cropLot.availableFrom ? new Date(cropLot.availableFrom).toLocaleDateString() : 'Immediate'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Listing Status:</span>
                  <span className="font-semibold text-slate-800">{cropLot.status}</span>
                </div>
              </div>
            </div>

            {/* Farmer Info Section */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-emerald-600" /> Farmer Information
              </h3>

              {cropLot.farmer ? (
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="font-bold text-slate-900 text-base">{cropLot.farmer.name}</div>
                  <div className="text-slate-600 flex items-center text-xs">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {cropLot.farmer.location?.district}, {cropLot.farmer.location?.state}
                  </div>
                  {cropLot.farmer.phone && (
                    <div className="text-slate-600 flex items-center text-xs">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {cropLot.farmer.phone}
                    </div>
                  )}

                  {user?._id !== cropLot.farmer._id && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setIsChatOpen(true);
                      }}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message Farmer
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Farmer details not available.</p>
              )}
            </div>
          </div>

          {/* Description Section */}
          {cropLot.description && (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-600" /> Description & Notes
              </h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                "{cropLot.description}"
              </p>
            </div>
          )}

          {/* Conditional Action Banner & Button */}
          <div className="pt-4 border-t border-slate-100">
            {cropLot.status === 'AVAILABLE' ? (
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-emerald-900 text-base">Ready to purchase or negotiate?</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Submit your price and quantity offer or chat directly with the farmer.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {user?.role === 'FARMER' && (
                    <button
                      type="button"
                      onClick={() => setIsMandiModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Store className="w-4 h-4" />
                      <span>Sell to Mandi</span>
                    </button>
                  )}
                  {user?._id !== cropLot.farmer?._id && (
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
                      Contact Farmer
                    </button>
                  )}
                  {user?.role !== 'FARMER' && (
                    <Link
                      to={`/make-offer/${cropLot._id}`}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition text-center"
                    >
                      Make Offer
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-4 text-center text-slate-600 text-sm">
                This crop lot is currently <strong>{cropLot.status}</strong> and is not accepting new offers.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Messaging Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipient={cropLot.farmer}
        cropLot={cropLot}
      />

      {/* Direct Mandi Sale Booking Modal */}
      <FarmerMandiBookingModal
        isOpen={isMandiModalOpen}
        onClose={() => setIsMandiModalOpen(false)}
        initialCropLot={cropLot}
        onBookingSuccess={() => {
          setIsMandiModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
};

export default CropLotDetails;
