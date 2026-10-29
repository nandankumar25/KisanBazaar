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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || (user?.role === 'BUYER' ? 'BUYER' : 'FARMER');

  const [activeRole, setActiveRole] = useState(initialRole); // 'FARMER' | 'BUYER'
  const [activeTab, setActiveTab] = useState('ALL');
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize activeRole with URL query parameter when navigating
  useEffect(() => {
    const roleParam = new URLSearchParams(location.search).get('role');
    if (roleParam && (roleParam.toUpperCase() === 'FARMER' || roleParam.toUpperCase() === 'BUYER')) {
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
  }, [location.search, activeRole]);

  // Financial aggregates
  const totalVolume = transactions.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalGrossValue = transactions.reduce((acc, t) => acc + (t.grossAmount ?? t.totalAmount ?? ((t.quantity || 0) * (t.pricePerQuintal || 0))), 0);
  const totalPaid = transactions.reduce((acc, t) => {
    const gross = t.grossAmount ?? t.totalAmount ?? ((t.quantity || 0) * (t.pricePerQuintal || 0));
    const net = t.netAmount ?? (gross - (t.transportCost || 0));
    const paid = t.paymentStatus === 'PAID' && (!t.amountPaid || t.amountPaid === 0) ? net : (t.amountPaid || 0);
    return acc + paid;
  }, 0);
  const totalRemaining = transactions.reduce((acc, t) => {
    if (t.paymentStatus === 'PAID') return acc;
    const gross = t.grossAmount ?? t.totalAmount ?? ((t.quantity || 0) * (t.pricePerQuintal || 0));
    const net = t.netAmount ?? (gross - (t.transportCost || 0));
    const rem = t.remainingAmount !== undefined ? t.remainingAmount : Math.max(0, net - (t.amountPaid || 0));
    return acc + rem;
  }, 0);

  // Tab Filtering
  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'COMPLETED') return t.transactionStatus === 'COMPLETED';
    return t.paymentStatus === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Perspective Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Receipt className="w-6 h-6 mr-2 text-emerald-600" /> Transactions & Payments
            </h1>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Demo Marketplace Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track deal progress, record payments, and manage financial realization for agricultural trades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button
              onClick={() => setActiveRole('FARMER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeRole === 'FARMER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Farmer (Sales)
            </button>
            <button
              onClick={() => setActiveRole('BUYER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeRole === 'BUYER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buyer (Purchases)
            </button>
          </div>

          <button
            onClick={fetchTransactionList}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Total Deals</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{transactions.length}</div>
          <span className="text-[11px] text-slate-400">{totalVolume} quintals traded</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Gross Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{totalGrossValue.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400">Total agreed volume</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Amount Paid</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Demo payments cleared</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Pending Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">₹{totalRemaining.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400">Awaiting collection</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Deals' },
          { id: 'PENDING', label: 'Payment Pending' },
          { id: 'PARTIAL', label: 'Partially Paid' },
          { id: 'PAID', label: 'Fully Paid' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => {
          const count = transactions.filter((t) => {
            if (tab.id === 'ALL') return true;
            if (tab.id === 'COMPLETED') return t.transactionStatus === 'COMPLETED';
            return t.paymentStatus === tab.id;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {loading ? (
        <Loading message="Loading transaction records..." />
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No transactions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? `No transactions recorded yet under this ${activeRole.toLowerCase()} profile. Accepted offers can be converted into transactions.`
              : `No transactions currently matching filter '${activeTab}'.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
