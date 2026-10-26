import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Shirt, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Login() {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Where to redirect after login (default: Home)
  const fromPath = location.state?.from?.pathname || '/';

  const toggleForgotMode = () => {
    setIsForgotMode(!isForgotMode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
  };

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.role === 'admin' ? '/admin' : fromPath, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message || 'If that email address is in our database, we will send you an email to reset your password.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-shell flex min-h-[90vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-12 animate-slide-up"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.3)), url('/images/signup-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div
        className="auth-card w-full max-w-md space-y-8 p-8 rounded-[2rem] border border-white/40 shadow-2xl"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 250, 244, 0.90)'
        }}
      >
        {/* Brand/Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-2xl font-black text-brown-dark">
            <Shirt className="h-6 w-6 stroke-[3] text-brown-primary" />
            <span>TrendVibe</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-brown-dark">
            {isForgotMode ? 'Forgot Password' : ''}
          </h2>
          <p className="text-sm text-text-secondary">
            {isForgotMode
              ? "Enter your email address and we'll send you a link to reset your password."
              : 'Sign in to access your cart, orders, and dashboard.'}
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50/80 p-3 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="flex items-start gap-2 rounded-2xl bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-700 border border-emerald-200 shadow-sm animate-fade-in">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {isForgotMode ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
              </div>
            </div>

            <div className="space-y-3">
              <LiquidGlassButton
                type="submit"
                disabled={submitting}
                variant="primary"
                className="btn-primary w-full h-11 text-sm font-bold"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </LiquidGlassButton>

              <button
                type="button"
                onClick={toggleForgotMode}
                className="text-xs font-bold text-brown-primary hover:text-brown-dark hover:underline block w-full text-center py-2"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Standard Credentials Form */
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-secondary">Password</label>
                <button
                  type="button"
                  onClick={toggleForgotMode}
                  className="text-xs font-bold text-brown-primary hover:text-brown-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
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

            <LiquidGlassButton
              type="submit"
              disabled={submitting}
              variant="primary"
              className="btn-primary w-full h-11 text-sm font-bold"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span>Sign In</span>
              )}
            </LiquidGlassButton>
          </form>
        )}

        {/* Link to register */}
        <div className="text-center pt-2">
          <p className="text-xs text-text-secondary">
            New to TrendVibe?{' '}
            <Link to="/signup" className="font-bold text-brown-primary hover:text-brown-dark hover:underline inline-flex items-center gap-0.5">
              Create an account <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
