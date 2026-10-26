import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, Truck, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_aFa7sMa2Bg2Pd14e5f1Jm00';

function StripeGlyph({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" className={className}>
      <path d="M13.976 17.567c0-.986.804-1.637 2.15-1.637 1.91 0 4.33.606 6.248 1.666V11.89c-2.11-.848-4.33-1.182-6.248-1.182-5.464 0-9.08 2.855-9.08 7.643 0 7.464 10.264 6.275 10.264 9.502 0 1.154-.997 1.76-2.392 1.76-2.073 0-4.733-.85-6.852-2.062v5.772c2.404.996 4.887 1.408 6.852 1.408 5.617 0 9.406-2.774 9.406-7.669 0-8.082-10.348-6.666-10.348-9.497z" />
    </svg>
  );
}

export default function Payment() {
  const { token } = useAuth();
  const { cartTotal, clearCart } = useCart();
  const { currency, rates, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve shipping information from Router state
  const shippingInfo = location.state?.shippingInfo;

  // Payment method: 'stripe' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect to checkout if they bypass shipping step
  useEffect(() => {
    if (!shippingInfo) {
      navigate('/checkout');
    }
  }, [shippingInfo, navigate]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setProcessing(true);

    const delay = paymentMethod === 'stripe' ? 1200 : 800;

    setTimeout(async () => {
      try {
        const methodLabel = paymentMethod === 'stripe' ? 'Stripe (Payment Link)' : 'Cash on Delivery';

        const cookieMatch = typeof document !== 'undefined' && document.cookie ? document.cookie.match(/tv_source=([^;]+)/) : null;
        const cookieSource = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const detectedPlatform = sessionStorage.getItem('tv_referral_source') 
          || localStorage.getItem('tv_last_platform_source') 
          || cookieSource 
          || 'Direct';

        const res = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: shippingInfo.name,
            email: shippingInfo.email,
            address: shippingInfo.address,
            currencyCode: currency,
            currencyRate: rates[currency] || 1,
            paymentMethod: methodLabel,
            platform: detectedPlatform
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Order submission failed.');
        }

        clearCart();

        if (paymentMethod === 'stripe') {
          // Open Stripe Payment Link in new window/tab
          window.open(STRIPE_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
        }

        navigate('/receipt', { 
          state: { 
            order: data,
            stripePaymentUrl: paymentMethod === 'stripe' ? STRIPE_PAYMENT_LINK : null
          } 
        });
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'An error occurred during order submission.');
        setProcessing(false);
      }
    }, delay);
  };

  if (!shippingInfo) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up">
      {/* Back link */}
      <div>
        <LiquidGlassButton
          onClick={() => navigate(-1)}
          variant="secondary"
          className="px-4 py-2 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shipping</span>
        </LiquidGlassButton>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-brown-dark">
        Payment Gateway
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Payment Form */}
        <div className="lg:col-span-2 payment-panel p-6 rounded-3xl relative overflow-hidden shadow-sm">
          {processing && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center theme-loading-screen backdrop-blur-xs space-y-4">
              <div className="theme-loading-spinner"></div>
              <p className="text-sm font-bold text-brown-dark">
                {paymentMethod === 'stripe' 
                  ? 'Initiating secure Stripe checkout session...' 
                  : 'Placing your order...'}
              </p>
              <p className="text-xs font-semibold text-brown-dark/80">Please do not refresh or close this window.</p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-brown-dark mb-3">Select Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stripe Option */}
              <button
                type="button"
                id="payment-method-stripe"
                onClick={() => { setPaymentMethod('stripe'); setErrorMsg(''); }}
                className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer text-center relative
                  ${paymentMethod === 'stripe'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-brown-faint bg-white/70 hover:border-indigo-400/50'
                  }`}
              >
                <div className={`rounded-xl p-3 ${paymentMethod === 'stripe' ? 'bg-indigo-600 text-white' : 'bg-brown-faint text-brown-dark/70'}`}>
                  <Zap className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <span className={`text-base font-bold block ${paymentMethod === 'stripe' ? 'text-indigo-950' : 'text-brown-dark/80'}`}>
                    Stripe Payment
                  </span>
                  <span className="text-xs font-semibold text-indigo-700/80 block">
                    Cards, Apple Pay, Google Pay
                  </span>
                </div>
                {paymentMethod === 'stripe' && (
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 absolute top-3 right-3" />
                )}
              </button>

              {/* Cash on Delivery Option */}
              <button
                type="button"
                id="payment-method-cod"
                onClick={() => { setPaymentMethod('cod'); setErrorMsg(''); }}
                className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer text-center relative
                  ${paymentMethod === 'cod'
                    ? 'border-olive bg-olive/10 shadow-md ring-2 ring-olive/20'
                    : 'border-brown-faint bg-white/70 hover:border-olive/45'
                  }`}
              >
                <div className={`rounded-xl p-3 ${paymentMethod === 'cod' ? 'bg-olive text-white' : 'bg-brown-faint text-brown-dark/70'}`}>
                  <Banknote className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <span className={`text-base font-bold block ${paymentMethod === 'cod' ? 'text-brown-dark' : 'text-brown-dark/75'}`}>
                    Cash on Delivery
                  </span>
                  <span className="text-xs font-semibold text-brown-dark/60 block">
                    Pay upon Delivery
                  </span>
                </div>
                {paymentMethod === 'cod' && (
                  <CheckCircle2 className="h-4 w-4 text-olive absolute top-3 right-3" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Stripe Info Panel — shown when Stripe is selected */}
            {paymentMethod === 'stripe' && (
              <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-5 space-y-4 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-sm">
                      <StripeGlyph className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>Pay via Stripe Checkout</span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase">
                          Official Gateway
                        </span>
                      </h3>
                      <p className="text-xs text-indigo-900/80 font-medium mt-0.5">
                        Complete your purchase seamlessly via Stripe's encrypted payment checkout.
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-indigo-600 shrink-0 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 pt-1">
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-indigo-100/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Credit & Debit Cards (Visa, MC, Amex)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-indigo-100/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Apple Pay & Google Pay Supported</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-indigo-100/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>256-Bit SSL Bank Grade Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-indigo-100/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Instant Order Confirmation</span>
                  </div>
                </div>

                <div className="rounded-xl bg-indigo-100/60 p-3 text-[11px] font-semibold text-indigo-900 flex items-center justify-between gap-2 border border-indigo-200/50">
                  <span>Checkout Link: <code className="font-mono text-[10px] bg-white/70 px-1.5 py-0.5 rounded text-indigo-700 truncate max-w-[240px] inline-block align-bottom">{STRIPE_PAYMENT_LINK}</code></span>
                  <a 
                    href={STRIPE_PAYMENT_LINK} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold underline shrink-0"
                  >
                    <span>Preview</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Cash on Delivery Info Panel */}
            {paymentMethod === 'cod' && (
              <div className="rounded-2xl payment-panel-soft p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-brown-faint p-2">
                    <Truck className="h-6 w-6 text-brown-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brown-dark">Cash on Delivery Selected</p>
                    <p className="text-xs font-semibold text-brown-dark/80">You'll pay when your order arrives</p>
                  </div>
                </div>
                <ul className="text-xs font-semibold text-brown-dark/85 space-y-1.5 pl-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> No online payment required</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Pay in cash upon delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Order is confirmed immediately</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Please have exact change ready</li>
                </ul>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <LiquidGlassButton
                type="submit"
                variant="success"
                className="btn-primary w-full h-11 text-sm font-bold"
              >
                {paymentMethod === 'stripe'
                  ? `Pay with Stripe (${formatPrice(cartTotal)})`
                  : `Place Order — Pay on Delivery (${formatPrice(cartTotal)})`
                }
              </LiquidGlassButton>
            </div>
          </form>
        </div>

        {/* Order review details sidebar */}
        <div className="payment-panel-soft p-6 rounded-3xl space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-brown-dark">Shipping Summary</h2>
          <div className="text-xs space-y-2 font-semibold text-brown-dark/85 bg-brown-faint/60 border border-brown-faint p-4 rounded-xl">
            <div>
              <span className="font-bold block text-brown-dark">Name</span>
              <span>{shippingInfo.name}</span>
            </div>
            <div>
              <span className="font-bold block text-brown-dark">Email</span>
              <span>{shippingInfo.email}</span>
            </div>
            <div>
              <span className="font-bold block text-brown-dark">Address</span>
              <span>{shippingInfo.address}</span>
            </div>
          </div>

          {/* Payment method badge */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold
            ${paymentMethod === 'stripe'
              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
              : 'bg-olive/10 text-brown-dark border border-olive/20'
            }`}
          >
            {paymentMethod === 'stripe'
              ? <><Zap className="h-4 w-4 text-indigo-600" /> Stripe Payment</>
              : <><Banknote className="h-4 w-4" /> Cash on Delivery</>
            }
          </div>

          <div className="border-t border-brown-faint pt-4 flex justify-between items-baseline text-brown-dark">
            <span className="text-sm font-bold">Total Amount Due</span>
            <span className="text-2xl font-black">{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
