import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Shirt } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where to redirect after login (default: Home)
  const fromPath = location.state?.from?.pathname || '/';

  // Render Google Identity Services button on mount
  useEffect(() => {
    /* global google */
    if (window.google) {
      try {
        google.accounts.id.initialize({
          // Try to get from environment, fallback to a dummy string
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '245648934524-dummygoogleclientid.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });

        google.accounts.id.renderButton(
          document.getElementById('googleButton'),
          { theme: 'outline', size: 'large', width: '100%', shape: 'rectangular' }
        );
      } catch (err) {
        console.error('Failed to initialize Google Sign-In script:', err);
      }
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const loggedInUser = await googleLogin(response.credential);
      navigate(loggedInUser.role === 'admin' ? '/admin' : fromPath, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Google Auth verification failed.');
    } finally {
      setSubmitting(false);
    }
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

  // Mock bypass logins for developers
  // Format: mock_google_token_::Full Name::email@example.com
  const triggerMockGoogleLogin = async (name, emailAddr) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const mockCredential = `mock_google_token_::${name}::${emailAddr}`;
      const loggedInUser = await googleLogin(mockCredential);
      navigate(loggedInUser.role === 'admin' ? '/admin' : fromPath, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate mock Google login.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerMockAdminLogin = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await login('admin@trendvibe.com', 'adminpassword');
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate admin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick-fill the standard form fields for demo purposes
  const quickFill = (emailAddr, pwd) => {
    setEmail(emailAddr);
    setPassword(pwd);
    setErrorMsg('');
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

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brown-primary/20"></div>
          </div>
          <span className="relative bg-rose-50/90 px-3 text-[10px] uppercase font-bold tracking-[0.25em] text-brown-dark">
            Or continue with
          </span>
        </div>

        {/* Google Authentication Button */}
        <div id="googleButton" className="w-full flex justify-center"></div>

        {/* Developer Bypass Panel */}
        <div className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-900/60 p-4 bg-amber-50 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
            <span>⚡ Quick Demo Access (No signup needed)</span>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
            Click any button below to instantly log in without a real Google account or email verification:
          </p>
          <div className="grid grid-cols-1 gap-2">
            <LiquidGlassButton
              onClick={triggerMockAdminLogin}
              disabled={submitting}
              variant="primary"
              className="w-full py-2.5 text-xs font-bold"
            >
              🔑 Login as Admin
            </LiquidGlassButton>
            <LiquidGlassButton
              onClick={() => triggerMockGoogleLogin('Jane Smith', 'jane@example.com')}
              disabled={submitting}
              variant="secondary"
              className="w-full py-2.5 text-xs font-bold"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              <span>Login as Regular User (Google Mock)</span>
            </LiquidGlassButton>
            <button
              onClick={() => quickFill('admin@trendvibe.com', 'adminpassword')}
              disabled={submitting}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:border-indigo-400 transition-all"
            >
              📋 Fill Admin credentials in form above
            </button>
          </div>
        </div>

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
