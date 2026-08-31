import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, ArrowRight, Shirt, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Invalid or missing password reset token.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await resetPassword(token, password);
      setSuccessMsg(res.message || 'Your password has been successfully updated.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-[80vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-10 animate-slide-up">
      <div className="auth-card w-full max-w-md space-y-8 p-8 rounded-[2rem] border border-transparent">
        {/* Brand/Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-2xl font-black text-brown-dark">
            <Shirt className="h-6 w-6 stroke-[3] text-brown-primary" />
            <span>TrendVibe</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-brown-dark">
            Reset Password
          </h2>
          <p className="text-sm text-text-secondary">
            Enter your new password below.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50/80 p-3 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="flex items-start gap-2 rounded-2xl bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-700 border border-emerald-200 shadow-sm animate-fade-in">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-2">
              <p>{successMsg}</p>
              <Link
                to="/login"
                className="font-bold text-emerald-800 hover:text-emerald-950 underline inline-flex items-center gap-0.5 text-xs"
              >
                Go to Sign In <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {!token ? (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50/80 p-4 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Missing Reset Token</p>
              <p className="text-xs text-rose-600/90 font-normal mt-1">
                A valid token is required to reset your password. Please check the link in the email we sent you.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1 font-bold text-xs mt-3 hover:underline">
                Back to Login <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          !successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                </div>
              </div>

              <LiquidGlassButton
                type="submit"
                disabled={submitting}
                variant="primary"
                className="btn-primary w-full h-11 text-sm font-bold"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Reset Password</span>
                )}
              </LiquidGlassButton>
            </form>
          )
        )}

        {/* Link to login (always show except when token is missing) */}
        {token && (
          <div className="text-center pt-2">
            <p className="text-xs text-text-secondary">
              Remembered your password?{' '}
              <Link to="/login" className="font-bold text-brown-primary hover:text-brown-dark hover:underline inline-flex items-center gap-0.5">
                Sign In <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
