import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRoleDashboard = (role) => {
    switch (role) {
      case 'BUYER':
        return '/buyer-dashboard';
      case 'TRANSPORTER':
        return '/transporter-dashboard';
      case 'MANDI_ADMIN':
        return '/mandi-dashboard';
      case 'ADMIN':
        return '/admin';
      case 'FARMER':
      default:
        return '/dashboard';
    }
  };

  const redirectUser = (user) => {
    const from = location.state?.from?.pathname;
    const targetDashboard = getRoleDashboard(user.role);

    // List of role-specific dashboard paths that should not be blindly restored for other roles
    const dashboardPaths = [
      '/dashboard',
      '/farmer',
      '/buyer-dashboard',
      '/buyers',
      '/buyer',
      '/transporter-dashboard',
      '/mandi-dashboard',
      '/admin',
    ];

    // If 'from' is a generic non-dashboard page (like /profile, /mandi-prices, /messages), redirect there
    if (from && !dashboardPaths.includes(from) && from !== '/login' && from !== '/register') {
      navigate(from, { replace: true });
      return;
    }

    navigate(targetDashboard, { replace: true });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(formData.email, formData.password);
    setLoading(false);

    if (res.success && res.user) {
      redirectUser(res.user);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setError('');
    const res = await googleLogin(credential);
    setLoading(false);

    if (res.success && res.user) {
      redirectUser(res.user);
    } else {
      setError(res.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = (err) => {
    setError(err || 'Google sign-in was unsuccessful.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            KB
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to access your farm deals, offers, and logistics
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="farmer@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

        <p className="text-center text-sm text-slate-600 pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
