import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStatsApi,
  getAdminUsersApi,
  updateUserRoleApi,
  deleteUserApi,
  getAdminMandisApi,
  verifyMandiApi,
} from '../services/api';
import DashboardCard from '../components/DashboardCard';
import {
  Sparkles,
  ShieldCheck,
  Users,
  Building2,
  TrendingUp,
  Package,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  RefreshCw,
  Scale,
  Search,
  X,
  Filter,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Handshake,
  UserCheck,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [mandiFilter, setMandiFilter] = useState('');
  const [mandiSearch, setMandiSearch] = useState('');
  const [activeTab, setActiveTab] = useState('mandis'); // 'mandis' or 'users'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [statsRes, usersRes, mandisRes] = await Promise.all([
        getAdminStatsApi().catch(() => ({ success: false })),
        getAdminUsersApi({ role: roleFilter || undefined, search: search || undefined }).catch(() => ({ success: false, data: [] })),
        getAdminMandisApi({ verificationStatus: mandiFilter || undefined }).catch(() => ({ success: false, data: [] })),
      ]);

      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
      if (usersRes && usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (mandisRes && mandisRes.success) {
        setMandis(mandisRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform administration data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, mandiFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData(true);
  };

  const handleVerifyMandi = async (mandiId, action) => {
    let rejectionReason = '';
    if (action === 'REJECT') {
      rejectionReason = window.prompt(
        'Please enter reason for rejecting this Mandi registration:',
        'Incomplete operating or yard details'
      );
      if (rejectionReason === null) return;
    }
    try {
      const res = await verifyMandiApi(mandiId, { action, rejectionReason });
      if (res && res.success) {
        setMandis((prev) =>
          prev.map((m) =>
            m._id === mandiId
              ? {
                  ...m,
                  verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
                  isActive: action === 'APPROVE',
                }
              : m
          )
        );
        setSuccessMsg(
          res.message || `Mandi was successfully ${action === 'APPROVE' ? 'approved & verified' : 'rejected'}.`
        );
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update Mandi verification status.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    try {
      const res = await updateUserRoleApi(userId, newRole);
      if (res && res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setSuccessMsg(`User role successfully changed to ${newRole}.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      return;
    }
    try {
      const res = await deleteUserApi(userId);
      if (res && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setSuccessMsg(`User "${userName}" was successfully deleted.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Filtered Mandis with client search
  const filteredMandis = useMemo(() => {
    return mandis.filter((m) => {
      if (!m) return false;
      if (!mandiSearch.trim()) return true;
      const term = mandiSearch.toLowerCase();
      const name = (m.name || '').toLowerCase();
      const code = (m.mandiCode || m.licenseNumber || '').toLowerCase();
      const city = (m.city || m.district || '').toLowerCase();
      const state = (m.state || '').toLowerCase();
      const adminName = (m.mandiAdmin?.name || '').toLowerCase();
      return (
        name.includes(term) ||
        code.includes(term) ||
        city.includes(term) ||
        state.includes(term) ||
        adminName.includes(term)
      );
    });
  }, [mandis, mandiSearch]);

  const pendingMandisCount = mandis.filter((m) => m.verificationStatus === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. High-Aesthetic Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/40">
        {/* Subtle Ambient Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Super Admin Desk • KisanBazaar Core Governance 🛡️</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Platform <span className="text-emerald-300">Administration</span> 🏛️
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium">
              Oversee marketplace operations, verify state APMC mandi yards, manage stakeholder roles, and supervise nationwide agri-commerce activity.
            </p>

            {/* Admin identity chip */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin: <strong className="text-white">{user?.name}</strong> ({user?.email})</span>
              </div>
              {pendingMandisCount > 0 && (
                <div className="bg-amber-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-400/30 flex items-center space-x-1.5 text-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span><strong>{pendingMandisCount}</strong> Mandi verifications pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="relative z-20 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition text-xs sm:text-sm active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-900 font-bold hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Overview Stat Cards Row (Matching DashboardCard format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DashboardCard
          title="Total Users"
          value={stats?.users?.total || users.length || 0}
          subtitle={`F: ${stats?.users?.farmers || 0} • B: ${stats?.users?.buyers || 0} • T: ${stats?.users?.transporters || 0}`}
          icon={Users}
          color="purple"
        />
        <DashboardCard
          title="Crop Listings"
          value={stats?.cropLots || 0}
          subtitle="Active marketplace lots"
          icon={Package}
          color="emerald"
        />
        <DashboardCard
          title="Negotiations"
          value={stats?.offers || 0}
          subtitle="Trade bids recorded"
          icon={TrendingUp}
          color="blue"
        />
        <DashboardCard
          title="Transactions"
          value={stats?.transactions || 0}
          subtitle="Escrow deals tracked"
          icon={Handshake}
          color="amber"
        />
        <DashboardCard
          title="Fleets & Mandis"
          value={(stats?.transporters || 0) + (stats?.mandis || mandis.length || 0)}
          subtitle={`${stats?.transporters || 0} Fleets • ${stats?.mandis || mandis.length || 0} Mandis`}
          icon={Building2}
          color="teal"
        />
      </div>

      {/* 3. Navigation Tabs (Matching exact design user loved) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'mandis', label: 'Mandi Approvals & APMC Yards', icon: Building2, badge: pendingMandisCount },
          { id: 'users', label: 'User Accounts & Roles', icon: Users, badge: users.length },
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
                  isActive
                    ? 'bg-white/20 text-white'
                    : t.id === 'mandis' && pendingMandisCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MANDI YARD VERIFICATIONS */}
      {activeTab === 'mandis' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Mandi Yard Verifications
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {filteredMandis.length} Mandis
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Review representative registrations, verify mandi authenticity, and approve listing for farmers.
                </p>
              </div>
            </div>

            {/* Toolbar: Search & Status Select */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mandiSearch}
                  onChange={(e) => setMandiSearch(e.target.value)}
                  placeholder="Search mandi, city, code..."
                  className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-44 sm:w-56 transition font-medium"
                />
                {mandiSearch && (
                  <button
                    type="button"
                    onClick={() => setMandiSearch('')}
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
                  value={mandiFilter}
                  onChange={(e) => setMandiFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mandi Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Mandi Name & Yard</th>
                    <th className="px-5 py-3.5">Type & Hours</th>
                    <th className="px-5 py-3.5">Representative</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Verification Status</th>
                    <th className="px-5 py-3.5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredMandis.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-slate-800 text-sm">No Mandis Found</div>
                          <p className="text-xs text-slate-500">
                            {mandiSearch
                              ? `No mandi yards matched "${mandiSearch}".`
                              : 'No mandis found matching the selected verification filter.'}
                          </p>
                          {(mandiSearch || mandiFilter) && (
                            <button
                              type="button"
                              onClick={() => {
                                setMandiSearch('');
                                setMandiFilter('');
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
                    filteredMandis.map((m) => (
                      <tr key={m._id} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                        {/* Mandi Name & Yard */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-emerald-500/20">
                              🏛️
                            </div>
                            <div>
                              <div className="font-black text-slate-900 group-hover:text-emerald-950 text-sm">
                                {m.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5 font-medium">
                                {m.address || 'APMC Yard Road'}
                              </div>
                              {m.mandiCode && (
                                <span className="inline-block mt-1 font-mono text-[10px] bg-slate-900 text-emerald-300 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                                  Code: {m.mandiCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type & Hours */}
                        <td className="px-5 py-4">
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            m.mandiType === 'Government'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {m.mandiType || 'Government APMC'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.operatingHours || '08:00 AM - 06:00 PM'}</span>
                          </div>
                        </td>

                        {/* Representative */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-xs">
                              {m.mandiAdmin?.name || 'Mandi Admin'}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{m.contactPhone || m.mandiAdmin?.phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[160px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{m.contactEmail || m.mandiAdmin?.email || '—'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{m.city || m.district || 'Yard'}, {m.state}</span>
                          </div>
                        </td>

                        {/* Verification Status */}
                        <td className="px-5 py-4">
                          {m.verificationStatus === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          ) : m.verificationStatus === 'REJECTED' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-300 shadow-2xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                              {m.rejectionReason && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={m.rejectionReason}>
                                  {m.rejectionReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </td>

                        {/* Verification Action */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {m.verificationStatus !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyMandi(m._id, 'APPROVE')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Mandi</span>
                              </button>
                            )}
                            {m.verificationStatus !== 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyMandi(m._id, 'REJECT')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
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

      {/* TAB 2: USER ACCOUNTS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    User Management & Authorizations
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {users.length} Users
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Review accounts, modify role authorizations, or delete suspicious records.
                </p>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-44 sm:w-56 font-medium transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Search
                </button>
              </form>

              {/* Role Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="FARMER">Farmer</option>
                  <option value="BUYER">Buyer</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="MANDI_ADMIN">Mandi Admin</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">User Identity</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Verification</th>
                    <th className="px-5 py-3.5">Assigned Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500 font-bold text-xs">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Loading platform users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-slate-800 text-sm">No Users Found</div>
                          <p className="text-xs text-slate-500">
                            {search
                              ? `No users matched "${search}".`
                              : 'No users found matching the selected role filter.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                        {/* User Identity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-emerald-500/20">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 group-hover:text-emerald-950 text-sm">
                                {u.name}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.phone || '—'}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.location?.district ? `${u.location.district}, ${u.location.state}` : '—'}</span>
                          </div>
                        </td>

                        {/* Verification */}
                        <td className="px-5 py-4">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Unverified</span>
                            </span>
                          )}
                        </td>

                        {/* Role Select */}
                        <td className="px-5 py-4">
                          <select
                            value={u.role}
                            disabled={u._id === user?._id}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition shadow-2xs outline-none ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : u.role === 'FARMER'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : u.role === 'BUYER'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : u.role === 'MANDI_ADMIN'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            } ${u._id === user?._id ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}`}
                          >
                            <option value="FARMER">FARMER</option>
                            <option value="BUYER">BUYER</option>
                            <option value="TRANSPORTER">TRANSPORTER</option>
                            <option value="MANDI_ADMIN">MANDI_ADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {u._id !== user?._id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95"
                              title="Delete this user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold italic px-2 py-1 bg-slate-100 rounded-lg">
                              Current Admin
                            </span>
                          )}
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
    </div>
  );
};

export default AdminDashboard;
