import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, Shirt } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Signup() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    /* global google */
    if (window.google) {
      try {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '245648934524-dummygoogleclientid.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });

        google.accounts.id.renderButton(
          document.getElementById('googleButtonSignup'),
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
      await googleLogin(response.credential);
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Google Auth verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStandardSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed. Email might be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-[80vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-10 animate-slide-up">
      <div className="auth-card w-full max-w-md space-y-8 p-8 rounded-[2rem] border border-transparent">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-2xl font-black text-brown-dark">
            <Shirt className="h-6 w-6 stroke-[3] text-brown-primary" />
            <span>TrendVibe</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-brown-dark">
            Create an Account
          </h2>
          <p className="text-sm text-text-secondary">
            Sign up to get personalized shopping and order logs.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50/80 p-3 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleStandardSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
              />
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="auth-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-text-primary"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
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
              <span>Sign Up</span>
            )}
          </LiquidGlassButton>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brown-primary/20"></div>
          </div>
          <span className="relative bg-rose-50/90 px-3 text-[10px] uppercase font-bold tracking-[0.25em] text-brown-dark">
            Or Sign Up with
          </span>
        </div>

        {/* Google Authentication Button */}
        <div id="googleButtonSignup" className="w-full flex justify-center"></div>

        {/* Link to login */}
        <div className="text-center pt-2">
          <p className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brown-primary hover:text-brown-dark hover:underline inline-flex items-center gap-0.5">
              Sign in <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
