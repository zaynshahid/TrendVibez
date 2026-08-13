import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Shirt } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where to redirect after login (default: Home)
  const fromPath = location.state?.from?.pathname || '/';

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
            Welcome Back
          </h2>
          <p className="text-sm text-text-secondary">
            Sign in to access your cart, orders, and dashboard.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50/80 p-3 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Standard Credentials Form */}
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
            <label className="text-xs font-bold text-text-secondary">Password</label>
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
