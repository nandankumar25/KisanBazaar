import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const res = await forgotPasswordRequest(email);
      setStatusMessage(
        res.message || 'If an account exists with that email, a password reset link has been sent.'
      );
    } catch (err) {
      // Return safe message even on error
      setStatusMessage('If an account exists with that email, a password reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            KB
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {statusMessage ? (
          <div className="mt-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-emerald-800 leading-relaxed">{statusMessage}</p>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Didn't receive an email? Check your spam folder or make sure you entered the correct email.
            </p>
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                ← Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
