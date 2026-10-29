import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStatsApi,
  getAdminUsersApi,
  updateUserRoleApi,
  deleteUserApi,
  getAdminMandisApi,
  verifyMandiApi,
} from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [mandiFilter, setMandiFilter] = useState('');
  const [activeTab, setActiveTab] = useState('mandis'); // 'mandis' or 'users'
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, mandisRes] = await Promise.all([
        getAdminStatsApi(),
        getAdminUsersApi({ role: roleFilter || undefined, search: search || undefined }),
        getAdminMandisApi({ verificationStatus: mandiFilter || undefined }),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (mandisRes.success) {
        setMandis(mandisRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, mandiFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
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
      if (res.success) {
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
          res.message || `Mandi was successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}.`
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
      if (res.success) {
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
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setSuccessMsg(`User "${userName}" was deleted.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-300 mb-2">
            <span>🛡️</span> Super Admin Control Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Administration</h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as {user?.name} ({user?.email}). Manage users, roles, and platform activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-slate-700 transition"
        >
          Refresh Statistics
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 block">Total Users</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.users?.total || 0}</span>
            <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap gap-1">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">F: {stats.users?.farmers || 0}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">B: {stats.users?.buyers || 0}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">T: {stats.users?.transporters || 0}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 block">Crop Lots</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.cropLots || 0}</span>
            <span className="text-[11px] text-slate-500 mt-2 block">Active listings</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 block">Negotiations</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.offers || 0}</span>
            <span className="text-[11px] text-slate-500 mt-2 block">Offers recorded</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 block">Transactions</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">{stats.transactions || 0}</span>
            <span className="text-[11px] text-slate-500 mt-2 block">Deals tracked</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 block">Fleet & Mandis</span>
            <span className="text-2xl font-black text-teal-700 mt-1 block">
              {(stats.transporters || 0) + (stats.mandis || 0)}
            </span>
            <span className="text-[11px] text-slate-500 mt-2 block">
              {stats.transporters || 0} fleets • {stats.mandis || 0} mandis
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('mandis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'mandis'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🏢 Mandi Approvals & APMC Yards</span>
          {mandis.filter((m) => m.verificationStatus === 'PENDING').length > 0 && (
            <span className="bg-white text-amber-900 text-xs px-2 py-0.5 rounded-full font-black">
              {mandis.filter((m) => m.verificationStatus === 'PENDING').length} PENDING
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>👥 User Accounts</span>
        </button>
      </div>

      {/* Mandi Verification Section */}
      {activeTab === 'mandis' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mandi Yard Verifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review representative registrations, verify mandi authenticity, and approve listing for farmers.
              </p>
            </div>

            {/* Mandi Verification Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={mandiFilter}
                onChange={(e) => setMandiFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Mandi Name</th>
                  <th className="px-5 py-3.5">Type & Hours</th>
                  <th className="px-5 py-3.5">Representative</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mandis.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-400 text-sm">
                      No mandis found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  mandis.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{m.address || 'Market Yard'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          m.mandiType === 'Government'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {m.mandiType || 'Government'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{m.operatingHours || '08:00 AM - 06:00 PM'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {m.mandiAdmin?.name || 'Mandi Admin'}
                        </div>
                        <div className="text-[11px] text-slate-500">{m.contactPhone || m.mandiAdmin?.phone || '—'}</div>
                        <div className="text-[11px] text-slate-400">{m.contactEmail || m.mandiAdmin?.email || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700">
                        {m.city || m.district}, {m.state}
                      </td>
                      <td className="px-5 py-4">
                        {m.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            ✓ Verified
                          </span>
                        ) : m.verificationStatus === 'REJECTED' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                              ✗ Rejected
                            </span>
                            {m.rejectionReason && (
                              <div className="text-[10px] text-red-600 mt-1 max-w-[140px] truncate" title={m.rejectionReason}>
                                {m.rejectionReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.verificationStatus !== 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyMandi(m._id, 'APPROVE')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Approve Mandi
                            </button>
                          )}
                          {m.verificationStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyMandi(m._id, 'REJECT')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition"
                            >
                              Reject
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
      )}

      {/* User Management Section */}
      {activeTab === 'users' && (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review accounts, modify role authorizations, or delete suspicious records.
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Search
              </button>
            </form>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Roles</option>
              <option value="FARMER">Farmer</option>
              <option value="BUYER">Buyer</option>
              <option value="TRANSPORTER">Transporter</option>
              <option value="MANDI_ADMIN">Mandi Admin</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Current Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{u.phone || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {u.location?.district ? `${u.location.district}, ${u.location.state}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {u.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        disabled={u._id === user?._id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : u.role === 'FARMER'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : u.role === 'BUYER'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        } ${u._id === user?._id ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <option value="FARMER">FARMER</option>
                        <option value="BUYER">BUYER</option>
                        <option value="TRANSPORTER">TRANSPORTER</option>
                        <option value="MANDI_ADMIN">MANDI_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u._id !== user?._id ? (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Current User</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default AdminDashboard;
