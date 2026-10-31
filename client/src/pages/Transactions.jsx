import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getTransactions } from '../services/api';
import TransactionCard from '../components/TransactionCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Receipt, 
  IndianRupee, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  UserCheck,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role')?.toUpperCase() || (
    user?.role === 'BUYER' 
      ? 'BUYER' 
      : user?.role === 'TRANSPORTER' 
      ? 'TRANSPORTER' 
      : user?.role === 'MANDI_ADMIN'
      ? 'MANDI'
      : 'FARMER'
  );

  const [activeRole, setActiveRole] = useState(initialRole); // 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'MANDI'
  const [showDemoBuyer, setShowDemoBuyer] = useState(false);
  const [showDemoFarmer, setShowDemoFarmer] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize activeRole with URL query parameter when navigating
  useEffect(() => {
    const roleParam = new URLSearchParams(location.search).get('role');
    if (roleParam && ['FARMER', 'BUYER', 'TRANSPORTER', 'MANDI'].includes(roleParam.toUpperCase())) {
      setActiveRole(roleParam.toUpperCase());
    }
  }, [location.search]);

  const fetchTransactionList = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      const currentQuery = new URLSearchParams(location.search);
      if (currentQuery.get('farmer')) params.farmer = currentQuery.get('farmer');
      if (currentQuery.get('buyer')) params.buyer = currentQuery.get('buyer');
      if (currentQuery.get('status')) params.status = currentQuery.get('status');
      if (currentQuery.get('paymentStatus')) params.paymentStatus = currentQuery.get('paymentStatus');

      const res = await getTransactions(params);
      if (res && res.success) {
        setTransactions(Array.isArray(res.data) ? res.data : []);
      } else if (Array.isArray(res)) {
        setTransactions(res);
      } else {
        setError(res?.message || 'Failed to fetch transactions.');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionList();
  }, [location.search]);

  // Only deals where crops have been delivered are shown on Deals page
  const deliveredTransactions = transactions.filter(
    (t) => t.transactionStatus === 'COMPLETED' || t.offer?.status === 'COMPLETED'
  );

  const isTransporter = activeRole === 'TRANSPORTER';
  const isBuyer = activeRole === 'BUYER';
  const isFarmer = activeRole === 'FARMER';
  const isMandi = activeRole === 'MANDI';

  // Match deals where current user is the Farmer (Seller)
  const isMatchUserFarmer = (t) => {
    if (!user?._id) return true;
    return String(t.farmer?._id || t.farmer) === String(user._id) ||
           (t.farmer?.name && user.name && t.farmer.name.toLowerCase() === user.name.toLowerCase());
  };

  // Match deals where current user is the Buyer (Purchaser)
  const isMatchUserBuyer = (t) => {
    if (!user?._id) return true;
    return String(t.buyer?._id || t.buyer) === String(user._id) ||
           (t.buyer?.name && user.name && t.buyer.name.toLowerCase() === user.name.toLowerCase());
  };

  // Match deals where Mandi was the purchaser / procurement entity
  const isMatchUserMandi = (t) => {
    return !!(t.mandiBooking || t.mandi || t.type === 'MANDI_PROCUREMENT');
  };

  const userFarmerDeals = deliveredTransactions.filter(isMatchUserFarmer);
  const userBuyerDeals = deliveredTransactions.filter(isMatchUserBuyer);
  const userMandiDeals = deliveredTransactions.filter(isMatchUserMandi);

  // Separate strictly: Farmer deals vs Buyer deals vs Mandi deals
  let filteredTransactions = [];
  if (isFarmer) {
    if (userFarmerDeals.length > 0) {
      filteredTransactions = userFarmerDeals;
    } else if (showDemoFarmer || user?.role === 'ADMIN' || !user) {
      filteredTransactions = deliveredTransactions;
    } else {
      filteredTransactions = [];
    }
  } else if (isBuyer) {
    if (userBuyerDeals.length > 0) {
      filteredTransactions = userBuyerDeals;
    } else if (showDemoBuyer || user?.role === 'ADMIN' || !user) {
      filteredTransactions = deliveredTransactions;
    } else {
      filteredTransactions = [];
    }
  } else if (isMandi) {
    filteredTransactions = userMandiDeals;
  } else if (isTransporter) {
    filteredTransactions = deliveredTransactions;
  }

  // Financial aggregates calculated strictly for the active filtered deals
  const totalVolume = filteredTransactions.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalGrossValue = filteredTransactions.reduce((acc, t) => {
    if (isTransporter) {
      const fare = (t.transportCost && Number(t.transportCost) > 0)
        ? Number(t.transportCost)
        : (t.quantity ? Math.round(t.quantity * 16.8) : 840);
      return acc + fare;
    }
    return acc + (t.grossAmount ?? t.totalAmount ?? ((t.quantity || 0) * (t.pricePerQuintal || 0)));
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Signature Hero Header Banner */}
      <div className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-emerald-800/40 shadow-xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30 backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>VERIFIED MARKETPLACE ESCROW LEDGER</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Deals & Settlements</span>
              <span className="text-2xl sm:text-3xl">🤝</span>
            </h1>

            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Real-time audit log of fulfilled agricultural trades, completed produce handovers, and banking escrow realizations.
            </p>
          </div>

          {/* Right Action / Quick Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-2xl text-xs text-emerald-200 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Escrow Protected Trades</span>
            </div>

            <button
              onClick={fetchTransactionList}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
              title="Refresh Transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Role Perspective Switcher Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Switch Perspective:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveRole('FARMER');
              setShowDemoFarmer(false);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeRole === 'FARMER'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <span>🌾</span>
            <span>Farmer (Sales)</span>
          </button>

          <button
            onClick={() => {
              setActiveRole('BUYER');
              setShowDemoBuyer(false);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeRole === 'BUYER'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <span>🛒</span>
            <span>Buyer (Purchases)</span>
          </button>

          <button
            onClick={() => setActiveRole('TRANSPORTER')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeRole === 'TRANSPORTER'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <span>🚛</span>
            <span>Transporter</span>
          </button>

          <button
            onClick={() => setActiveRole('MANDI')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeRole === 'MANDI'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <span>🏛️</span>
            <span>Mandi Yard</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* 3. KPI Metric Cards Strictly Per Role */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Deals Count */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isBuyer ? 'Delivered Purchases' : isTransporter ? 'Fulfilled Haulage Trips' : isMandi ? 'Mandi Procurements' : 'Delivered Farm Sales'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isBuyer ? 'bg-blue-50 text-blue-600' : isTransporter ? 'bg-purple-50 text-purple-600' : isMandi ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {filteredTransactions.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBuyer ? 'Verified crop purchases' : isTransporter ? 'Completed logistics runs' : isMandi ? 'Registered APMC yard arrivals' : 'Successfully sold & settled crop lots'}
          </span>
        </div>

        {/* Metric 2: Volume */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isBuyer ? 'Volume Purchased' : isTransporter ? 'Volume Hauled' : isMandi ? 'Volume Procured' : 'Volume Dispatched'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isBuyer ? 'bg-blue-50 text-blue-600' : isTransporter ? 'bg-purple-50 text-purple-600' : isMandi ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalVolume} <span className="text-sm font-bold text-slate-500 uppercase">qtl</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBuyer ? 'Total produce procured' : isTransporter ? 'Total produce transported' : isMandi ? 'Total mandi arrivals' : 'Total crop volume realized'}
          </span>
        </div>

        {/* Metric 3: Financial Turnover */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isBuyer ? 'Total Purchase Outlay' : isTransporter ? 'Total Freight Realized' : isMandi ? 'Mandi Payout Settlement' : 'Total Realized Revenue'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isBuyer ? 'bg-blue-50 text-blue-600' : isTransporter ? 'bg-purple-50 text-purple-600' : isMandi ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${
            isBuyer ? 'text-blue-700' : isTransporter ? 'text-purple-700' : isMandi ? 'text-teal-700' : 'text-emerald-700'
          }`}>
            ₹{totalGrossValue.toLocaleString('en-IN')}
          </div>
          <span className={`text-[11px] font-bold mt-1 block ${
            isBuyer ? 'text-blue-600' : isTransporter ? 'text-purple-600' : isMandi ? 'text-teal-600' : 'text-emerald-600'
          }`}>
            {isBuyer ? 'Delivered purchase payments' : isTransporter ? 'Delivered haulage earnings' : isMandi ? 'Settled procurement payouts' : 'Fulfilled sales cash realization'}
          </span>
        </div>
      </div>

      {/* 4. Section Subheader with Count & Demo Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {isBuyer ? `Confirmed Buyer Purchases (${filteredTransactions.length})` : isTransporter ? `Fulfilled Transport Logistics (${filteredTransactions.length})` : isMandi ? `APMC Mandi Procurements (${filteredTransactions.length})` : `Confirmed Farmer Sales (${filteredTransactions.length})`}
          </h2>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            Delivered Only
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isBuyer && showDemoBuyer && (
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
              Showing Demo Marketplace Purchases
            </span>
          )}
          {isFarmer && showDemoFarmer && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
              Showing Demo Marketplace Sales
            </span>
          )}
        </div>
      </div>

      {/* 5. Main Content Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
          <Loading message="Syncing confirmed marketplace deals..." />
        </div>
      ) : filteredTransactions.length === 0 ? (
        isBuyer && user?.role === 'FARMER' ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-inner">
              🛒
            </div>
            <h3 className="text-base font-bold text-slate-800">No Purchase Deals for {user?.name || 'Farmer'}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              You are signed in as a <strong>Farmer ({user?.name || 'Seller'})</strong>. Your crop sales deals are located in the <strong>Farmer (Sales)</strong> tab.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveRole('FARMER')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-xs w-full sm:w-auto"
              >
                Go to Farmer Sales ({userFarmerDeals.length} Deals)
              </button>
              <button
                onClick={() => setShowDemoBuyer(true)}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition w-full sm:w-auto"
              >
                Preview Demo Buyer Purchases ({deliveredTransactions.length})
              </button>
            </div>
          </div>
        ) : isFarmer && user?.role === 'BUYER' ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-inner">
              🌾
            </div>
            <h3 className="text-base font-bold text-slate-800">No Sales Deals for {user?.name || 'Buyer'}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              You are signed in as a <strong>Buyer ({user?.name || 'Purchaser'})</strong>. Your crop purchase deals are located in the <strong>Buyer (Purchases)</strong> tab.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveRole('BUYER')}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs w-full sm:w-auto"
              >
                Go to Buyer Purchases ({userBuyerDeals.length} Deals)
              </button>
              <button
                onClick={() => setShowDemoFarmer(true)}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition w-full sm:w-auto"
              >
                Preview Demo Farmer Sales ({deliveredTransactions.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl shadow-inner">
              📑
            </div>
            <h3 className="text-base font-bold text-slate-800">No Delivered Deals Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No delivered deals recorded yet for this perspective. Once crops are delivered and marked as completed, finalized settlement receipts will appear here.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredTransactions.map((txn) => (
            <TransactionCard
              key={txn._id}
              transaction={txn}
              userRole={activeRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
