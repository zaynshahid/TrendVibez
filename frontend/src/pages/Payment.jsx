import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Calendar, Lock, User, AlertCircle, ArrowLeft, Banknote, CheckCircle2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Payment() {
  const { token } = useAuth();
  const { cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve shipping information from Router state
  const shippingInfo = location.state?.shippingInfo;

  // Payment method: 'card' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect to checkout if they somehow bypass the shipping step
  useEffect(() => {
    if (!shippingInfo) {
      navigate('/checkout');
    }
  }, [shippingInfo, navigate]);

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\s?/g, '').replace(/[^0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += val[i];
    }
    setCardNumber(formatted.slice(0, 19));
  };

  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    let formatted = val;
    if (val.length >= 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setExpiry(formatted.slice(0, 5));
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCvv(val.slice(0, 4));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvv || !cardName) {
        setErrorMsg('Please complete all credit card fields.');
        return;
      }
    }

    setErrorMsg('');
    setProcessing(true);

    const delay = paymentMethod === 'card' ? 1800 : 1000;

    setTimeout(async () => {
      try {
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
            paymentMethod: paymentMethod === 'card'
              ? `Mock Card (ending in ${cardNumber.slice(-4)})`
              : 'Cash on Delivery'
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
                {paymentMethod === 'cod' ? 'Placing your order...' : 'Processing simulated transaction...'}
              </p>
              <p className="text-xs font-semibold text-brown-dark/80">Please do not refresh or close this window.</p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-brown-dark mb-3">Select Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Card Option */}
              <button
                type="button"
                id="payment-method-card"
                onClick={() => { setPaymentMethod('card'); setErrorMsg(''); }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer
                  ${paymentMethod === 'card'
                    ? 'border-brown-primary bg-brown-faint shadow-md'
                    : 'border-brown-faint bg-white/70 hover:border-brown-primary/45'
                  }`}
              >
                <div className={`rounded-xl p-2.5 ${paymentMethod === 'card' ? 'bg-white/80' : 'bg-brown-faint'}`}>
                  <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-brown-primary' : 'text-brown-dark/60'}`} />
                </div>
                <span className={`text-sm font-bold ${paymentMethod === 'card' ? 'text-brown-dark' : 'text-brown-dark/75'}`}>
                  Credit / Debit Card
                </span>
                {paymentMethod === 'card' && (
                  <CheckCircle2 className="h-4 w-4 text-brown-primary absolute top-3 right-3" />
                )}
              </button>

              {/* Cash on Delivery Option */}
              <button
                type="button"
                id="payment-method-cod"
                onClick={() => { setPaymentMethod('cod'); setErrorMsg(''); }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer
                  ${paymentMethod === 'cod'
                    ? 'border-olive bg-olive/10 shadow-md'
                    : 'border-brown-faint bg-white/70 hover:border-olive/45'
                  }`}
              >
                <div className={`rounded-xl p-2.5 ${paymentMethod === 'cod' ? 'bg-white/80' : 'bg-brown-faint'}`}>
                  <Banknote className={`h-6 w-6 ${paymentMethod === 'cod' ? 'text-olive' : 'text-brown-dark/60'}`} />
                </div>
                <span className={`text-sm font-bold ${paymentMethod === 'cod' ? 'text-brown-dark' : 'text-brown-dark/75'}`}>
                  Cash on Delivery
                </span>
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
            {/* Card Fields — only shown when card is selected */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-warning/10 p-4 text-xs font-semibold text-brown-dark/85 border border-brown-faint">
                  <p className="font-bold flex items-center gap-1 mb-1 text-brown-dark">
                    <AlertCircle className="h-4 w-4 shrink-0" /> Sandbox Mode
                  </p>
                  This is a mock transaction gateway. Feel free to input any valid numbers (e.g. 4111 1111 ...). Real cards will not be processed.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brown-dark">Name on Card</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                    />
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brown-dark">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                    />
                    <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brown-dark">Expiration Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                      />
                      <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brown-dark">CVV / CVC</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                      />
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                    </div>
                  </div>
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
                variant={paymentMethod === 'cod' ? 'success' : 'success'}
                className="btn-primary w-full h-11 text-sm font-bold"
              >
                {paymentMethod === 'card'
                  ? `Authorize Payment ($${cartTotal.toFixed(2)})`
                  : `Place Order — Pay on Delivery ($${cartTotal.toFixed(2)})`
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
            ${paymentMethod === 'card'
              ? 'bg-brown-faint text-brown-dark border border-brown-faint'
              : 'bg-olive/10 text-brown-dark border border-olive/20'
            }`}
          >
            {paymentMethod === 'card'
              ? <><CreditCard className="h-4 w-4" /> Credit / Debit Card</>
              : <><Banknote className="h-4 w-4" /> Cash on Delivery</>
            }
          </div>

          <div className="border-t border-brown-faint pt-4 flex justify-between items-baseline text-brown-dark">
            <span className="text-sm font-bold">Total Amount Due</span>
            <span className="text-2xl font-black">${cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
