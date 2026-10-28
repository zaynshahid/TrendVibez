import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Payment() {
  const { token } = useAuth();
  const { cartTotal, clearCart } = useCart();
  const { currency, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve shipping information from Router state
  const shippingInfo = location.state?.shippingInfo;

  // Online payments stay disabled until a server-verified payment flow is available.
  const [paymentMethod, setPaymentMethod] = useState('cod');

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

    setTimeout(async () => {
      try {
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
            paymentMethod: 'Cash on Delivery',
            platform: detectedPlatform
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Order submission failed.');
        }

        clearCart();

        navigate('/receipt', { state: { order: data } });
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'An error occurred during order submission.');
        setProcessing(false);
      }
    }, 800);
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
                Placing your order...
              </p>
              <p className="text-xs font-semibold text-brown-dark/80">Please do not refresh or close this window.</p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-brown-dark mb-3">Select Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card payments remain disabled until server-side payment confirmation is configured. */}
              <button
                type="button"
                id="payment-method-stripe"
                disabled
                className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-brown-faint bg-brown-faint/40 p-5 text-center opacity-60 cursor-not-allowed"
              >
                <div className="rounded-xl p-3 bg-brown-faint text-brown-dark/70">
                  <span className="text-xl font-bold">$</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-base font-bold block text-brown-dark/80">Card Payment</span>
                  <span className="text-xs font-semibold text-brown-dark/60 block">Temporarily unavailable</span>
                </div>
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
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Card payments are temporarily unavailable. Choose Cash on Delivery to place an order.
            </p>

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
                {`Place Order — Pay on Delivery (${formatPrice(cartTotal)})`}
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
            bg-olive/10 text-brown-dark border border-olive/20`}
          >
            <Banknote className="h-4 w-4" /> Cash on Delivery
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
