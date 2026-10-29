import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Package, 
  IndianRupee, 
  Calendar, 
  ArrowRight,
  Truck,
  TrendingUp,
  FileCheck
} from 'lucide-react';

const TransactionCard = ({ transaction, userRole = 'FARMER' }) => {
  const {
    _id,
    cropLot,
    farmer,
    buyer,
    quantity,
    pricePerQuintal,
    grossAmount,
    totalAmount,
    transportCost,
    netAmount,
    amountPaid = 0,
    remainingAmount = 0,
    paymentStatus = 'PENDING',
    transactionStatus = 'CREATED',
    createdAt,
  } = transaction;

  const grossVal = grossAmount ?? totalAmount ?? (quantity * pricePerQuintal);
  const netVal = netAmount ?? (grossVal - (transportCost || 0));
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Partial ({paymentPercentage}%)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Payment Pending
          </span>
        );
    }
  };

  const getTransactionStatusBadge = (st) => {
    switch (st) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            In Progress
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
            Cancelled
          </span>
        );
      case 'CREATED':
      case 'INITIATED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
            Initiated
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between">
      <div>
        {/* Header: ID, Date, Status Badges */}
        <div className="flex justify-between items-start pb-3 mb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                #TXN-{_id.slice(-6).toUpperCase()}
              </span>
              {getTransactionStatusBadge(transactionStatus)}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center mt-1">
              <Calendar className="w-3 h-3 mr-1" />
              {createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
            </div>
          </div>
          <div>{getPaymentStatusBadge(paymentStatus)}</div>
        </div>

        {/* Crop Lot & Counterparty Overview */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              {cropLot?.crop || 'Crop Produce'}
            </h3>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              Grade: {cropLot?.qualityGrade || 'Standard'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 font-medium block">Farmer</span>
              <span className="font-semibold text-slate-800 flex items-center mt-0.5 truncate">
                <User className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                {farmer?.name || 'Farmer'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Buyer</span>
              <span className="font-semibold text-slate-800 flex items-center mt-0.5 truncate">
                <User className="w-3 h-3 mr-1 text-blue-600 flex-shrink-0" />
                {buyer?.buyerProfile?.businessName || buyer?.name || 'Buyer'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 mb-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Quantity</span>
            <span className="text-sm font-bold text-slate-900 flex items-center mt-0.5">
              <Package className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              {quantity} <span className="text-[10px] text-slate-500 font-normal ml-0.5">qtl</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Final Rate</span>
            <span className="text-sm font-bold text-slate-900 flex items-center mt-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              {pricePerQuintal?.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Net Amount</span>
            <span className="text-sm font-extrabold text-emerald-800 flex items-center mt-0.5">
              ₹{netVal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Progress Bar */}
        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-600 font-semibold">Payment Progress</span>
            <span className="font-bold text-slate-800">{paymentPercentage}% Paid</span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-300 ${
                paymentPercentage === 100 ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-[11px] text-slate-400 block">Amount Paid:</span>
              <span className="font-bold text-emerald-700">₹{paidVal.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Remaining:</span>
              <span className="font-bold text-rose-600">₹{balanceVal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 uppercase font-semibold">
          Demo Transaction Record
        </span>

        <Link
          to={`/transaction/${_id}`}
          className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
        >
          <span>View Details & Payments</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default TransactionCard;
