import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getTransactionById, 
  recordPayment, 
  updateTransactionStatus 
} from '../services/api';
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
  Clock, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  CreditCard,
  History,
  ShieldCheck,
  Check,
  FileCheck,
  Building,
  RefreshCw
} from 'lucide-react';

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNote, setPaymentNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Status Update State
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTransactionById(id);
      if (res.success && res.data) {
        setTransaction(res.data);
        // Default payment amount to remaining amount
        if (res.data.remainingAmount > 0) {
          setPaymentAmount(res.data.remainingAmount.toString());
        } else {
          setPaymentAmount('');
        }
      } else {
        setError('Transaction record not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transaction details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }
    if (numAmount > (transaction?.remainingAmount || 0)) {
      alert(`Payment amount cannot exceed the remaining balance of ₹${transaction?.remainingAmount?.toLocaleString('en-IN')}.`);
      return;
    }

    try {
      setSubmittingPayment(true);
      setError(null);
      setSuccessMessage(null);

      const res = await recordPayment(id, {
        amount: numAmount,
        paymentMethod,
        note: paymentNote || `Demo payment via ${paymentMethod}`,
      });

      if (res.success && res.data) {
        setTransaction(res.data);
        setSuccessMessage(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`);
        setPaymentNote('');
        if (res.data.remainingAmount > 0) {
          setPaymentAmount(res.data.remainingAmount.toString());
        } else {
          setPaymentAmount('');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment installment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Update transaction lifecycle status to '${newStatus}'?`)) {
      return;
    }

    try {
      setSubmittingStatus(true);
      setError(null);
      setSuccessMessage(null);

      const res = await updateTransactionStatus(id, { transactionStatus: newStatus });
      if (res.success && res.data) {
        setTransaction(res.data);
        setSuccessMessage(`Transaction status successfully updated to ${newStatus}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) return <Loading message="Loading transaction and payment ledger..." />;
  if (error && !transaction) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ErrorMessage message={error} />
      <button 
        onClick={() => navigate(-1)} 
        className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300"
      >
        Go Back
      </button>
    </div>
  );
  if (!transaction) return null;

  const {
    _id,
    cropLot,
    farmer,
    buyer,
    offer,
    quantity = 0,
    pricePerQuintal = 0,
    grossAmount,
    totalAmount,
    transportCost = 0,
    netAmount,
    destination,
    amountPaid = 0,
    remainingAmount = 0,
    paymentStatus = 'PENDING',
    transactionStatus = 'CREATED',
    paymentHistory = [],
    createdAt,
  } = transaction;

  const grossVal = grossAmount ?? totalAmount ?? (quantity * pricePerQuintal);
  const netVal = netAmount ?? (grossVal - transportCost);
  const paidVal = paymentStatus === 'PAID' && (!amountPaid || amountPaid === 0)
    ? netVal
    : (amountPaid ?? 0);
  const balanceVal = paymentStatus === 'PAID'
    ? 0
    : (remainingAmount ?? Math.max(0, netVal - paidVal));

  const paymentPercentage = netVal > 0 ? Math.min(100, Math.round((paidVal / netVal) * 100)) : 0;

  const getPaymentStatusBadge = (st) => {
    switch (st) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Paid in Full
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Partial Payment ({paymentPercentage}%)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Payment Pending
          </span>
        );
    }
  };

  const getTransactionStatusBadge = (st) => {
    switch (st) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            In Progress
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
            Cancelled
          </span>
        );
      case 'CREATED':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 uppercase">
            Created
          </span>
        );
    }
  };

  const isDelivered =
    transaction?.transactionStatus === 'COMPLETED' ||
    transaction?.offer?.status === 'COMPLETED';

  if (!isDelivered) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Deal Still In Progress</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            This deal is currently in progress. Complete details, payment ledger, and receipts become accessible only once the crops have been successfully delivered.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/transactions')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Back to Deals
            </button>
            <Link
              to="/offers"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
            >
              View Offers & Delivery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/transactions')}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Transactions
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Receipt className="w-7 h-7 mr-2 text-emerald-600" />
              Transaction Ledger
            </h1>
            <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold border border-slate-200">
              #TXN-{_id.slice(-6).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Created on {createdAt ? new Date(createdAt).toLocaleString('en-IN') : 'Recent'}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {getTransactionStatusBadge(transactionStatus)}
          {getPaymentStatusBadge(paymentStatus)}
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols) - Deal Specs, Ledger & History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Deal Specifications Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Agreed Produce Deal</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {cropLot?.crop || 'Crop Produce'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-medium">
                    Quality Grade: {cropLot?.qualityGrade || 'Standard'}
                  </span>
                  {destination && (
                    <span className="text-xs text-slate-500 flex items-center">
                      <Truck className="w-3.5 h-3.5 mr-1 text-slate-400" /> Destination: {destination}
                    </span>
                  )}
                </div>
              </div>

              {cropLot?._id && (
                <Link
                  to={`/crop-lot/${cropLot._id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded transition"
                >
                  View Lot Specs
                </Link>
              )}
            </div>

            {/* Parties: Farmer & Buyer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Farmer (Seller)
                </span>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{farmer?.name || 'Farmer'}</h4>
                    {farmer?.phone && <p className="text-xs text-slate-500">{farmer.phone}</p>}
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                      {farmer?.location?.city || farmer?.location?.district || 'Location'}, {farmer?.location?.state || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Buyer (Purchaser)
                </span>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {buyer?.buyerProfile?.businessName || buyer?.name || 'Demo Buyer'}
                    </h4>
                    {buyer?.phone && <p className="text-xs text-slate-500">{buyer.phone}</p>}
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                      {buyer?.location?.city || buyer?.location?.district || 'Location'}, {buyer?.location?.state || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                <Receipt className="w-4 h-4 mr-1.5 text-emerald-600" /> Financial Settlement Breakdown
              </h3>

              <div className="space-y-2.5 text-sm bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-slate-400" />
                    Agreed Quantity
                  </span>
                  <span className="font-semibold text-slate-900">{quantity} quintals</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-2 text-slate-400" />
                    Agreed Price per Quintal
                  </span>
                  <span className="font-semibold text-slate-900">₹{pricePerQuintal.toLocaleString('en-IN')} / qtl</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2 font-medium">
                  <span className="text-slate-800 font-semibold">Gross Deal Amount (Quantity × Price)</span>
                  <span className="font-bold text-slate-900">₹{grossVal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1 text-slate-600">
                  <span className="flex items-center text-slate-600">
                    <Truck className="w-4 h-4 mr-2 text-slate-400" />
                    Transport Cost (Deduction)
                  </span>
                  <span className="font-semibold text-rose-600">- ₹{transportCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t-2 border-slate-100 pt-2 text-base font-extrabold bg-emerald-50/50 px-3 rounded-lg">
                  <span className="text-emerald-900">Net Realization for Farmer</span>
                  <span className="text-emerald-700">₹{netVal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1 pt-2 border-t border-slate-100 text-sm">
                  <span className="text-slate-600">Total Amount Paid</span>
                  <span className="font-bold text-emerald-600">₹{paidVal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1 text-sm font-semibold">
                  <span className="text-slate-700">Remaining Balance Due</span>
                  <span className={`font-bold ${balanceVal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{balanceVal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <span className="text-slate-600">Payment Fulfillment</span>
                  <span className={paymentPercentage === 100 ? 'text-emerald-700' : 'text-blue-700'}>
                    {paymentPercentage}% Settled
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      paymentPercentage === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-emerald-600" />
                Payment Installment History
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-semibold">
                {paymentHistory.length} Entry{paymentHistory.length === 1 ? '' : 'ies'}
              </span>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No payment installments recorded yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the payment recorder form to log demo transactions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((item, idx) => (
                  <div 
                    key={item._id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {item.paymentMethod || 'Demo Payment'}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                            REF-{item._id ? item._id.slice(-6).toUpperCase() : `0${idx + 1}`}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-slate-600 mt-0.5">{item.note}</p>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {item.paymentDate ? new Date(item.paymentDate).toLocaleString('en-IN') : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right pl-11 sm:pl-0">
                      <span className="text-base font-extrabold text-emerald-700 flex items-center sm:justify-end">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {item.amount?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Settled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) - Payment Simulator & Status Management */}
        <div className="space-y-6">
          
          {/* Payment Action Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
              Demo Payment Simulator
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Record a payment milestone. Updates ledger & crop inventory status automatically.
            </p>

            {paymentStatus === 'PAID' || balanceVal <= 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">Payment Settled in Full!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  100% of the net deal amount (₹{netVal.toLocaleString('en-IN')}) has been received.
                </p>
                <div className="mt-3 text-xs bg-white/70 p-2 rounded text-slate-600 border border-emerald-100">
                  Produce lot status has been updated in marketplace inventory.
                </div>
              </div>
            ) : transactionStatus === 'CANCELLED' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-rose-900">Transaction Cancelled</h4>
                <p className="text-xs text-rose-700 mt-1">
                  Payments cannot be registered for a cancelled transaction.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                
                {/* Remaining Notice */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-800">Remaining Balance:</span>
                  <span className="font-extrabold text-amber-900 text-sm">₹{balanceVal.toLocaleString('en-IN')}</span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Installment Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      min="1"
                      max={balanceVal}
                      step="any"
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(balanceVal.toString())}
                    className="flex-1 py-1 px-2 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    Pay Full (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(balanceVal * 0.5).toString())}
                    className="flex-1 py-1 px-2 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(balanceVal * 0.25).toString())}
                    className="flex-1 py-1 px-2 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    25%
                  </button>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Demo Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Demo Bank Transfer">Demo NEFT / RTGS / IMPS</option>
                    <option value="Demo Escrow">Demo Agri-Escrow Account</option>
                    <option value="Cash on Delivery">Cash on Delivery / Mandi Counter</option>
                    <option value="Cheque">Bank Demand Draft / Cheque</option>
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Reference Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Advance transfer on dispatch"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center justify-center"
                >
                  {submittingPayment ? (
                    'Recording...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Record ₹{Number(paymentAmount || 0).toLocaleString('en-IN')} Payment
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Demo Mode: No actual bank funds transferred.
                </p>
              </form>
            )}
          </div>

          {/* Lifecycle Status Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
              <FileCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
              Transaction Lifecycle
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current state: <strong className="text-slate-800">{transactionStatus}</strong>
            </p>

            <div className="space-y-2">
              {transactionStatus !== 'COMPLETED' && (
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={submittingStatus}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Mark Transaction as Completed
                </button>
              )}

              {transactionStatus === 'CREATED' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={submittingStatus}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  Set to In Progress
                </button>
              )}

              {transactionStatus !== 'CANCELLED' && transactionStatus !== 'COMPLETED' && (
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={submittingStatus}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  Cancel Transaction
                </button>
              )}
            </div>
          </div>

          {/* Useful Context Links */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-700 block">Related Navigation</span>
            <Link
              to="/transport"
              className="block text-emerald-700 hover:underline font-semibold"
            >
              → Browse Available Transporters
            </Link>
            <Link
              to="/offers"
              className="block text-emerald-700 hover:underline font-semibold"
            >
              → Return to Farmer Offers
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TransactionDetails;
