import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Printer, ShoppingBag, ClipboardList, ExternalLink, Zap } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.jsx';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_aFa7sMa2Bg2Pd14e5f1Jm00';

export default function Receipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice, formatPriceWithCurrency } = useCurrency();

  const order = location.state?.order;
  const isStripe = order?.paymentMethod?.toLowerCase().includes('stripe');

  useEffect(() => {
    // Redirect if they access receipt page directly without placing an order
    if (!order) {
      navigate('/products');
    }
  }, [order, navigate]);

  if (!order) {
    return (
      <div className="theme-loading-screen">
        <div className="theme-loading-content">
          <div className="theme-loading-spinner"></div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8 animate-slide-up print-card">
      {/* Success Notification - Hidden on Print */}
      <div className="text-center space-y-3 no-print">
        <div className="inline-flex rounded-full bg-brown-faint p-4 text-brown-primary">
          <CheckCircle2 className="h-12 w-12 animate-bounce" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brown-dark leading-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-sm font-semibold text-brown-dark/80 max-w-md mx-auto">
          Thank you for your purchase. Your order has been registered in our database. A receipt copy is shown below.
        </p>
      </div>

      {/* Stripe Payment Link Action Banner if Stripe was used */}
      {isStripe && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-indigo-50/90 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950">Stripe Payment Link</h3>
              <p className="text-xs font-semibold text-indigo-900/80 mt-0.5">
                Need to complete or review your checkout on Stripe?
              </p>
            </div>
          </div>
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all shrink-0 cursor-pointer"
          >
            <span>Open Stripe Checkout</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Invoice Card Container */}
      <div className="payment-panel p-8 rounded-3xl shadow-sm space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brown-faint pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brown-primary">TrendVibe Receipt</span>
            <h2 className="text-xl font-black text-brown-dark">Order Reference: {order.orderReference}</h2>
            <p className="text-xs font-semibold text-brown-dark/75">{formattedDate}</p>
          </div>
          <div className="no-print">
            <button
              onClick={handlePrint}
              className="btn-outline px-4 py-2 text-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Client & Shipping Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-brown-dark/85 bg-brown-faint/60 border border-brown-faint p-4 rounded-2xl">
          <div className="space-y-1.5">
            <span className="font-extrabold text-brown-dark block uppercase tracking-wider">Delivery Details</span>
            <p className="font-bold text-brown-dark">{order.name}</p>
            <p className="leading-relaxed">{order.address}</p>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <span className="font-extrabold text-brown-dark block uppercase tracking-wider">Payment Metadata</span>
            <p>Email: <span className="font-bold text-brown-dark">{order.email}</span></p>
            <p>Method: <span className="font-bold text-brown-dark">{order.paymentMethod}</span></p>
            <p>Status: <span className="font-bold text-olive uppercase">{order.paymentStatus || 'Paid'}</span></p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-brown-dark uppercase tracking-wider block">Items Purchased</span>
          <div className="divide-y divide-brown-faint">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between items-center py-4 text-xs">
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-10 shrink-0 rounded overflow-hidden bg-brown-faint">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-brown-dark block">
                      {item.name}
                    </span>
                    {item.selectedColor && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-brown-faint text-brown-primary border border-brown-faint">
                        Size: {item.selectedColor}
                      </span>
                    )}
                    <span className="font-semibold text-brown-dark/75 block">
                      {formatPriceWithCurrency(item.price, order.currencyCode, order.currencyRate)} each
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="font-extrabold text-brown-dark block">
                    {formatPriceWithCurrency(item.price * item.quantity, order.currencyCode, order.currencyRate)}
                  </span>
                  <span className="font-semibold text-brown-dark/75">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div> 
        </div>

        {/* Invoice Footer Total */}
        <div className="border-t border-brown-faint pt-6 flex justify-between items-baseline text-brown-dark">
          <span className="text-sm font-bold">Total Settled</span>
          <span className="text-3xl font-black">{formatPriceWithCurrency(order.totalAmount, order.currencyCode, order.currencyRate)}</span>
        </div>
      </div>

      {/* Redirect Shortcuts - Hidden on Print */}
      <div className="flex flex-wrap justify-center gap-4 no-print">
        <Link
          to="/dashboard"
          className="btn-outline py-3 px-6 text-sm"
        >
          <ClipboardList className="h-4.5 w-4.5" />
          <span>View Order History</span>
        </Link>
        <Link
          to="/products"
          className="btn-primary py-3 px-6 text-sm"
        >
          <ShoppingBag className="h-4.5 w-4.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
