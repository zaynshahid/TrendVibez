import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';

export default function Cart() {
  const { cart, loadingCart, updateQuantity, removeFromCart, cartTotal, getItemEffectivePrice } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleQtyChange = async (productId, variantId, currentQty, amount) => {
    const newQty = currentQty + amount;
    const itemKey = `${productId}-${variantId || ''}`;
    setUpdatingId(itemKey);
    setErrorMsg('');
    try {
      const item = cart.find(cartItem => cartItem.productId === productId && (cartItem.variantId || '') === (variantId || ''));
      await updateQuantity(productId, newQty, variantId, item?.selectedColor || '');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update quantity');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId, variantId) => {
    const itemKey = `${productId}-${variantId || ''}`;
    setUpdatingId(itemKey);
    try {
      await removeFromCart(productId, variantId);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProceed = () => {
    if (user) {
      navigate('/checkout');
    } else {
      // Redirect to login with state to send them to checkout upon auth
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  };

  if (loadingCart) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brown-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold tracking-tight text-brown-dark">
        Shopping Cart
      </h1>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-pulse">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-brown-faint rounded-3xl bg-brown-faint/50 space-y-4">
          <div className="rounded-full bg-beige p-4 text-brown-primary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-brown-dark">Your Cart is Empty</h2>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            Looks like you haven't added any items to your cart yet. Explore our fresh collections today.
          </p>
          <LiquidGlassButton 
            to="/products" 
            variant="primary"
            className="px-6 py-2.5 text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Start Shopping
          </LiquidGlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const itemKey = `${item.productId}-${item.variantId || ''}`;
              const variantValue = item.selectedColor || item.variant?.color;
              const inferredSizeLabels = ['XS', 'S', 'M', 'L', 'XL', 'Small', 'Medium', 'Large'];
              const variantType = item.variant?.variantType || (item.variantId ? 'color' : (inferredSizeLabels.includes(item.selectedColor) ? 'size' : 'color'));
              const isSizeVariant = variantType === 'size';
              const isColorVariant = variantType === 'color';
              const isUpdating = updatingId === itemKey;
              const effectivePrice = getItemEffectivePrice(item);

              return (
                <div 
                  key={itemKey} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 payment-panel rounded-3xl border border-brown-faint p-4"
                >
                  {/* Product Info details */}
                  <div className="flex gap-4 items-center">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-beige">
                      <img 
                        src={item.product?.image} 
                        alt={item.product?.name} 
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-brown-dark leading-tight">
                        {item.product?.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">
                          {item.product?.category}'s Wear
                        </span>
                        {variantValue && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brown-faint text-brown-dark border border-brown-faint">
                            {isColorVariant && item.variant?.colorHex && item.variant.colorHex !== 'size' && (
                              <span 
                                className="h-2.5 w-2.5 rounded-full border border-brown-faint" 
                                style={{ backgroundColor: item.variant.colorHex }}
                              />
                            )}
                            {isSizeVariant ? 'Size:' : 'Color:'} {variantValue}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-text-secondary">
                        {formatPrice(effectivePrice)} each
                      </p>
                    </div>
                  </div>

                  {/* Controls (Quantity & Delete) */}
                  <div className="flex w-full sm:w-auto items-center justify-between sm:gap-6 pt-2 sm:pt-0 border-t border-brown-faint sm:border-0">
                    {/* Quantity adjustment */}
                    <div className="flex items-center rounded-2xl border border-brown-faint bg-beige">
                      <button
                        onClick={() => handleQtyChange(item.productId, item.variantId, item.quantity, -1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="h-8 w-8 text-brown-dark hover:text-brown-primary disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="h-8 w-8 flex items-center justify-center text-xs font-bold text-brown-dark">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item.productId, item.variantId, item.quantity, 1)}
                        disabled={isUpdating || item.quantity >= (item.product?.stock || 99)}
                        className="h-8 w-8 text-brown-dark hover:text-brown-primary disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    {/* Price display and Delete */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold text-brown-dark">
                        {formatPrice(effectivePrice * item.quantity)}
                      </span>
                      <button
                        onClick={() => handleRemove(item.productId, item.variantId)}
                        disabled={isUpdating}
                        className="rounded-lg p-1.5 text-brown-primary hover:bg-brown-faint transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Panel */}
          <div className="payment-panel p-6 rounded-3xl border border-brown-faint space-y-6">
            <h2 className="text-lg font-bold text-brown-dark">Order Summary</h2>
            
            <div className="space-y-3 border-b border-brown-faint pb-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-semibold text-brown-dark">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className="text-olive font-semibold">FREE</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline text-brown-dark">
              <span className="text-base font-bold">Estimated Total</span>
              <span className="text-2xl font-black">{formatPrice(cartTotal)}</span>
            </div>

            <LiquidGlassButton
              onClick={handleProceed}
              variant="primary"
              className="w-full h-11 text-sm font-bold"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </LiquidGlassButton>

            <Link 
              to="/products" 
              className="w-full flex items-center justify-center gap-1 text-xs text-brown-primary font-bold hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
