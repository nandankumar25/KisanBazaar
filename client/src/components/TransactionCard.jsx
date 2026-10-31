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
  FileCheck,
  ShieldCheck,
  Building2,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

const TransactionCard = ({ transaction, userRole }) => {
  const { user } = useAuth();
  const effectiveRole = userRole || (user?.role === 'TRANSPORTER' ? 'TRANSPORTER' : user?.role === 'BUYER' ? 'BUYER' : 'FARMER');
  const isTransportView = effectiveRole === 'TRANSPORTER';
  const isBuyerView = effectiveRole === 'BUYER';
  const isFarmerView = !isTransportView && !isBuyerView;

  const {
    _id,
    cropLot,
    farmer,
    buyer,
    mandi,
    mandiBooking,
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

  const transportFare = (transportCost && Number(transportCost) > 0)
    ? Number(transportCost)
    : (transaction.transport?.totalCost && Number(transaction.transport.totalCost) > 0)
      ? Number(transaction.transport.totalCost)
      : (quantity ? Math.round(quantity * 16.8) : 840);

  const grossVal = grossAmount ?? totalAmount ?? (quantity * pricePerQuintal);
  const netVal = netAmount ?? (grossVal - (transportCost || 0));
  const paidVal = paymentStatus === 'PAID' && (!amountPaid || amountPaid === 0)
    ? netVal
    : (amountPaid ?? 0);
  const balanceVal = paymentStatus === 'PAID'
    ? 0
    : (remainingAmount ?? Math.max(0, netVal - paidVal));

  const cropName = cropLot?.crop || transaction.crop || 'Crop Produce';
  const cropEmoji = getCropEmoji(cropName);

  const roleAccent = isBuyerView 
    ? 'from-blue-500 via-indigo-500 to-blue-600' 
    : isTransportView 
    ? 'from-purple-500 via-pink-500 to-purple-600' 
    : 'from-emerald-500 via-teal-500 to-emerald-600';

  const roleBorderHover = isBuyerView
    ? 'hover:border-blue-400/90'
    : isTransportView
    ? 'hover:border-purple-400/90'
    : 'hover:border-emerald-400/90';

  return (
    <div className={`group relative bg-white rounded-3xl shadow-xs border border-slate-200/90 ${roleBorderHover} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden`}>
      {/* Top Accent Gradient Strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${roleAccent} group-hover:h-2 transition-all duration-300`} />

      <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: TXN ID + Date + Verified Paid Badge */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  #TXN-{_id.slice(-6).toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Settled & Paid</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center mt-1">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                <span>{createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fulfilled'}</span>
              </div>
            </div>

            {/* Role Perspective Pill */}
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-2xs border ${
              isBuyerView 
                ? 'bg-blue-50 text-blue-800 border-blue-200' 
                : isTransportView 
                ? 'bg-purple-50 text-purple-800 border-purple-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isBuyerView ? 'Purchase Deal' : isTransportView ? 'Logistics Deal' : 'Sales Deal'}
            </span>
          </div>

          {/* Crop Commodity Profile */}
          <div className="flex items-center space-x-3 mt-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
              {cropEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-700 transition-colors truncate">
                  {cropName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                  Grade {cropLot?.qualityGrade || 'A'}
                </span>
              </div>
              {cropLot?.variety && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Variety: <span className="font-semibold text-slate-700">{cropLot.variety}</span>
                </p>
              )}
            </div>
          </div>

          {/* Counterparties Dual-Tile */}
          <div className="bg-slate-50/70 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
            {/* Seller Tile */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isBuyerView ? 'Purchased From' : isTransportView ? 'Pickup Point' : 'Sold By (Farmer)'}
              </span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span className="truncate">{farmer?.name || 'Farmer Seller'}</span>
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">
                {farmer?.phone || 'Verified Farmer'}
              </span>
            </div>

            {/* Buyer / Mandi Tile */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {mandi || mandiBooking ? 'Procured By (Mandi)' : isTransportView ? 'Delivery Destination' : 'Purchased By (Buyer)'}
              </span>
              <span className="font-extrabold text-slate-800 flex items-center mt-1 truncate">
                {mandi || mandiBooking ? (
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-teal-600 shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                )}
                <span className="truncate">
                  {mandi?.name || (mandiBooking ? 'Mandi APMC Yard' : (buyer?.buyerProfile?.businessName || buyer?.name || 'Buyer'))}
                </span>
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5 ml-5 truncate">
                {mandi ? `${mandi.city || ''} APMC` : (buyer?.phone || 'Direct Trader')}
              </span>
            </div>
          </div>

          {/* Financials & Trade Breakdown */}
          {isTransportView ? (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">Quantity</span>
                <div className="text-sm font-black text-slate-900 flex items-center mt-0.5">
                  <Package className="w-3.5 h-3.5 text-purple-600 mr-1 shrink-0" />
                  <span>{quantity}</span>
                  <span className="text-[10px] text-slate-500 ml-0.5">qtl</span>
                </div>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">Freight</span>
                <div className="text-sm font-black text-slate-900 flex items-center mt-0.5 font-mono">
                  <span>₹{quantity ? Math.round(transportFare / quantity) : 17}/qtl</span>
                </div>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">Total Fare</span>
                <div className="text-sm font-black text-purple-900 flex items-center mt-0.5 font-mono">
                  <span>₹{transportFare.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Quantity</span>
                <div className="text-sm font-black text-slate-900 flex items-center mt-0.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
                  <span>{quantity}</span>
                  <span className="text-[10px] text-slate-500 ml-0.5">qtl</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Agreed Rate</span>
                <div className="text-sm font-black text-slate-900 flex items-center mt-0.5 font-mono">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{pricePerQuintal?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/90">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                  {isBuyerView ? 'Total Paid' : 'Net Realized'}
                </span>
                <div className="text-sm font-black text-emerald-900 flex items-center mt-0.5 font-mono">
                  <span>₹{netVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Deal Confirmation Alert Strip */}
          <div className="mt-3 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fulfilled & Escrow Realized</span>
            </span>
            <span className="font-black text-emerald-900 font-mono">
              ₹{(isTransportView ? transportFare : netVal).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer Card Status */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
          <span className="text-[11px] text-slate-500 font-medium flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>Delivery Verified</span>
          </span>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Complete</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
