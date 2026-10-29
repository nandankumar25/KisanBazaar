import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOfferById, getTransactions, createTransaction } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Receipt, 
  Package, 
  IndianRupee, 
  Truck, 
  MapPin, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  FileCheck,
  Scale
} from 'lucide-react';

const CreateTransaction = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [existingTransaction, setExistingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Inputs
  const [transportCost, setTransportCost] = useState('0');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch offer
        const offerRes = await getOfferById(offerId);
        if (!offerRes.success || !offerRes.data) {
          setError('Offer record not found.');
          setLoading(false);
          return;
        }

        const currentOffer = offerRes.data;
        setOffer(currentOffer);

        if (currentOffer.status !== 'ACCEPTED') {
          setError(`Cannot create a transaction for an offer with status '${currentOffer.status}'. Only ACCEPTED offers can proceed to transaction.`);
        }

        // Set default destination if available in crop lot
        if (currentOffer.cropLot?.location?.city) {
          setDestination(currentOffer.cropLot.location.city + ' Mandi');
        }

        // Check if a transaction already exists for this offer
        const txnRes = await getTransactions({ offer: offerId });
        if (txnRes.success && txnRes.data && txnRes.data.length > 0) {
          setExistingTransaction(txnRes.data[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch offer details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferData();
  }, [offerId]);

  if (loading) return <Loading message="Loading accepted deal specifications..." />;

  if (existingTransaction) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Transaction Already Created</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            A formal transaction (#TXN-{existingTransaction._id.slice(-6).toUpperCase()}) has already been generated for this accepted offer. Duplicate transactions are prevented.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <Link
              to={`/transaction/${existingTransaction._id}`}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
            >
              View Existing Transaction
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cropLot = offer?.cropLot;
  const buyer = offer?.buyer;
  const farmer = cropLot?.farmer;

  const quantity = offer?.quantity || 0;
  const agreedPrice = offer?.offeredPrice || 0;
  const grossAmount = Math.round(quantity * agreedPrice * 100) / 100;
  const numTransportCost = Number(transportCost) || 0;
  const netAmount = Math.max(0, Math.round((grossAmount - numTransportCost) * 100) / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offer || offer.status !== 'ACCEPTED') return;

    if (numTransportCost < 0) {
      alert('Transport cost cannot be negative.');
      return;
    }

    if (numTransportCost > grossAmount) {
      alert(`Transport cost (₹${numTransportCost}) cannot exceed the gross deal value (₹${grossAmount}).`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        offerId: offer._id,
        transportCost: numTransportCost,
        destination: destination.trim(),
      };

      const res = await createTransaction(payload);
      if (res.success && res.data) {
        navigate(`/transaction/${res.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center text-slate-600 hover:text-emerald-600 text-sm font-semibold mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Offers
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <FileCheck className="w-6 h-6 mr-2 text-emerald-600" /> Confirm & Create Transaction
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Accepted Deal Finalization
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Generate an official transaction record from your accepted offer to begin payment and delivery tracking.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Deal Specs Card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
            <Receipt className="w-4 h-4 mr-2 text-emerald-600" />
            Accepted Deal Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase block">Crop Produce</span>
              <span className="text-base font-bold text-slate-900">{cropLot?.crop || 'Produce'}</span>
              <span className="text-slate-500 block text-[11px]">Grade: {cropLot?.qualityGrade || 'Standard'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Agreed Quantity</span>
                <span className="font-bold text-slate-800 text-sm flex items-center mt-0.5">
                  <Package className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {quantity} quintals
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Agreed Price</span>
                <span className="font-bold text-emerald-700 text-sm flex items-center mt-0.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {agreedPrice?.toLocaleString('en-IN')} / qtl
                </span>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-100 mt-2">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Farmer (Seller)</span>
                <span className="font-bold text-slate-800 flex items-center mt-0.5">
                  <User className="w-3 h-3 mr-1 text-emerald-600" />
                  {farmer?.name || 'Farmer'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/50">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Buyer (Purchaser)</span>
                <span className="font-bold text-slate-800 flex items-center mt-0.5">
                  <User className="w-3 h-3 mr-1 text-blue-600" />
                  {buyer?.buyerProfile?.businessName || buyer?.name || 'Buyer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Configuration & Live Math */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Scale className="w-5 h-5 mr-2 text-emerald-600" />
            Financial Breakdown & Logistics Setup
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Transport Cost (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={grossAmount}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Deducted from gross value to establish farmer's net realization.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Destination / Mandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Ludhiana Main Mandi Yard"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Target mandi or processing warehouse.
                </span>
              </div>
            </div>

            {/* Live Financial Ledger Math Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Live Transaction Calculation
              </h3>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Gross Deal Value ({quantity} qtl × ₹{agreedPrice}/qtl):</span>
                <span className="font-bold text-slate-900">₹{grossAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Logistics / Transport Deduction:</span>
                <span className="font-bold text-rose-600">- ₹{numTransportCost.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-emerald-900 block">Net Realization Amount</span>
                  <span className="text-[11px] text-slate-500">Gross Value - Transport Cost</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">
                  ₹{netAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !offer || offer.status !== 'ACCEPTED'}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm disabled:opacity-50 flex items-center"
              >
                {submitting ? 'Generating Transaction...' : 'Confirm & Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTransaction;
