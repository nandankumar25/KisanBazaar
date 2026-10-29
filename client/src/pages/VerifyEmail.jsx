import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyEmailToken, resendVerificationEmail } from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      try {
        const res = await verifyEmailToken(token);
        if (isMounted) {
          if (res.success) {
            setStatus('success');
            setMessage(res.message || 'Your email address has been successfully verified.');
          } else {
            setStatus('error');
            setMessage(res.message || 'Verification token is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(
            err.response?.data?.message || 'Verification failed. The token may be invalid or expired.'
          );
        }
      }
    };

    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('No verification token provided in URL.');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendStatus('');
    try {
      const res = await resendVerificationEmail(resendEmail);
      setResendStatus(res.message || 'A new verification link has been sent to your email.');
    } catch (err) {
      setResendStatus(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
        {status === 'verifying' && (
          <div className="py-8">
            <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying your email</h2>
            <p className="text-slate-600 text-sm">Please wait while we confirm your email verification link...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Email Verified!</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4 text-left">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 text-center">Verification Failed</h2>
            <p className="text-slate-600 text-sm text-center">{message}</p>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Need a new verification link?
              </h3>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Link'}
                </button>
              </form>
              {resendStatus && (
                <p className="text-xs text-emerald-700 mt-2 font-medium">{resendStatus}</p>
              )}
            </div>

            <div className="text-center pt-4">
              <Link to="/login" className="text-xs font-semibold text-emerald-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
