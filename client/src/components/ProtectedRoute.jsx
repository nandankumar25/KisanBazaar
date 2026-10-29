import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600 mb-6">
          Your current account role is <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">{user?.role}</span>.
          This page requires one of the following roles: <span className="font-medium text-slate-800">{allowedRoles.join(', ')}</span>.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            Go to Home
          </Link>
          {user?.role === 'FARMER' && (
            <Link
              to="/farmer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition"
            >
              Farmer Dashboard
            </Link>
          )}
          {user?.role === 'BUYER' && (
            <Link
              to="/buyers"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition"
            >
              Buyer Portal
            </Link>
          )}
          {user?.role === 'TRANSPORTER' && (
            <Link
              to="/transporter-dashboard"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition"
            >
              Transporter Dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
