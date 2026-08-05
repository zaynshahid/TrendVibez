import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Mail, User, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Pre-fill user info if logged in
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your checkout is empty</h2>
        <p className="text-xs text-slate-500">Add products to your cart before proceeding.</p>
        <Link to="/products" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !address) {
      setErrorMsg('Please complete all delivery fields.');
      return;
    }

    setErrorMsg('');
    const shippingInfo = { name, email, address };
    
    // Pass shipping details using React Router state history to the payment page
    navigate('/payment', { state: { shippingInfo } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up">
      {/* Back link */}
      <div>
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Shipping Form */}
        <div className="lg:col-span-2 payment-panel p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-brown-dark mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brown-primary" />
            <span>Shipping Information</span>
          </h2>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brown-dark">Recipient Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Recipient Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brown-dark">Contact Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="contact@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brown-dark">Delivery Address</label>
              <div className="relative">
                <textarea
                  required
                  rows="3"
                  placeholder="Street address, apartment, city, state, postal code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="payment-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <LiquidGlassButton
                type="submit"
                variant="primary"
                className="btn-primary w-full sm:w-auto h-11 px-6 text-sm font-bold"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="h-4 w-4" />
              </LiquidGlassButton>
            </div>
          </form>
        </div>

        {/* Invoice Summary sidebar */}
        <div className="payment-panel-soft p-6 rounded-3xl space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-brown-dark">Order Summary</h2>

          {/* Cart items preview */}
          <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-60 overflow-y-auto no-scrollbar">
            {cart.map((item) => {
              const sizeLabel = item.selectedColor || item.variant?.color;
              return (
                <div key={`${item.productId}-${item.variantId || ''}`} className="flex justify-between py-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-brown-dark dark:text-slate-100 block">
                      {item.product?.name}
                    </span>
                    {sizeLabel && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                        Size: {sizeLabel}
                      </span>
                    )}
                    <span className="text-text-secondary">
                      Qty: {item.quantity} &times; ${item.product?.price?.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing totals */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-semibold text-brown-dark dark:text-slate-250">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Shipping</span>
              <span className="text-olive font-semibold">FREE</span>
            </div>
            <div className="flex justify-between items-baseline text-brown-dark dark:text-white border-t border-slate-100 dark:border-slate-850 pt-3">
              <span className="text-base font-bold">Total Due</span>
              <span className="text-2xl font-black">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
