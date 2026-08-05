import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Printer, ShoppingBag, ClipboardList, ArrowRight } from 'lucide-react';

export default function Receipt() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = location.state?.order;

  useEffect(() => {
    // Redirect if they access receipt page directly without placing an order
    if (!order) {
      navigate('/products');
    }
  }, [order, navigate]);

  if (!order) return null;

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
          Payment Successful!
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Thank you for your purchase. Your order has been registered in our database. A receipt copy is shown below.
        </p>
      </div>

      {/* Invoice Card Container */}
      <div className="payment-panel p-8 rounded-3xl shadow-sm space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brown-primary">TrendVibe Receipt</span>
            <h2 className="text-xl font-black text-brown-dark">Order Reference: {order.orderReference}</h2>
            <p className="text-xs text-text-secondary">{formattedDate}</p>
          </div>
          <div className="no-print">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-550 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition-all hover:scale-102 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Client & Shipping Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-text-secondary bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl">
          <div className="space-y-1.5">
            <span className="font-extrabold text-brown-dark dark:text-slate-250 block uppercase tracking-wider">Delivery Details</span>
            <p className="font-semibold text-brown-dark dark:text-slate-200">{order.name}</p>
            <p className="leading-relaxed">{order.address}</p>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <span className="font-extrabold text-brown-dark dark:text-slate-250 block uppercase tracking-wider">Payment Metadata</span>
            <p>Email: <span className="font-semibold text-brown-dark dark:text-slate-200">{order.email}</span></p>
            <p>Method: <span className="font-semibold text-brown-dark dark:text-slate-200">{order.paymentMethod}</span></p>
            <p>Status: <span className="font-semibold text-emerald-500 uppercase">Paid</span></p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider block">Items Purchased</span>
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between items-center py-4 text-xs">
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-10 shrink-0 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-brown-dark dark:text-slate-100 block">
                      {item.name}
                    </span>
                    {item.selectedColor && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                        Size: {item.selectedColor}
                      </span>
                    )}
                    <span className="text-slate-450 block">
                      ${item.price.toFixed(2)} each
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="font-bold text-slate-850 dark:text-slate-200 block">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <span className="text-slate-450">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div> 
        </div>

        {/* Invoice Footer Total */}
        <div className="border-t border-slate-100 dark:border-slate-850 pt-6 flex justify-between items-baseline text-brown-dark">
          <span className="text-sm font-bold">Total Settled</span>
          <span className="text-3xl font-black">${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Redirect Shortcuts - Hidden on Print */}
      <div className="flex flex-wrap justify-center gap-4 no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 py-3 px-6 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all"
        >
          <ClipboardList className="h-4.5 w-4.5" />
          <span>View Order History</span>
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 py-3 px-6 text-sm font-bold text-white shadow-sm transition-all"
        >
          <ShoppingBag className="h-4.5 w-4.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
