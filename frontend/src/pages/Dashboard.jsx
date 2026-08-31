import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { User, Lock, Mail, ClipboardList, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.jsx';

export default function Dashboard() {
  const { user, token, updateProfile } = useAuth();
  const { formatPriceWithCurrency } = useCurrency();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Orders States
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Sync profile inputs with active state if they change
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Fetch Order History
  useEffect(() => {
    async function fetchOrders() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          setOrdersError('Failed to retrieve order history.');
        }
      } catch (err) {
        console.error(err);
        setOrdersError('Connection error while fetching orders.');
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [token]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (password && password.length < 6) {
      setProfileError('New password must be at least 6 characters long.');
      return;
    }
    if (password && password !== confirmPassword) {
      setProfileError('Passwords do not match.');
      return;
    }

    setUpdating(true);
    try {
      const payload = { name, email };
      if (password) payload.password = password;

      await updateProfile(payload);
      
      setProfileSuccess('Profile updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450';
      case 'Processing':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
      case 'Cancelled':
        return 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-slide-up">
      <div className="border-b border-brown-faint pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-brown-dark">
          Client Dashboard
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage your personal details and view transaction logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Side: Profile Form */}
        <div className="payment-panel p-6 rounded-3xl border border-brown-faint shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-brown-dark flex items-center gap-2">
            <User className="h-5 w-5 text-brown-primary" />
            <span>Profile Details</span>
          </h2>

          {profileSuccess && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-1.5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brown-dark">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="payment-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-semibold"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-brown-primary" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brown-dark">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="payment-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-semibold"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-brown-primary" />
              </div>
            </div>

            <div className="border-t border-brown-faint pt-4 space-y-4">
              <span className="text-xs font-bold text-text-secondary block uppercase tracking-wider">Change Password (optional)</span>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-brown-dark">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="payment-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-semibold"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-brown-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brown-dark">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="payment-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-semibold"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-brown-primary" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full flex h-10 items-center justify-center rounded-xl bg-brown-primary text-xs font-bold text-text-inverse shadow-sm hover:bg-brown-dark transition-all disabled:opacity-50"
            >
              {updating ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right Side: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-brown-dark flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brown-primary" />
            <span>Order History</span>
          </h2>

          {loadingOrders ? (
            <div className="flex py-10 justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brown-primary border-t-transparent"></div>
            </div>
          ) : ordersError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50/20 p-6 text-sm text-rose-650 dark:border-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <span>{ordersError}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-brown-faint rounded-3xl bg-brown-faint/30 space-y-2">
              <ClipboardList className="h-8 w-8 text-brown-primary mx-auto" />
              <h3 className="font-bold text-brown-dark text-sm">No Orders Found</h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                You haven't placed any purchases under this account yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isOpen = expandedOrder === order.id;
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div 
                    key={order.id} 
                    className="payment-panel rounded-2xl border border-brown-faint shadow-sm"
                  >
                    {/* Order Collapsible Header */}
                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="w-full flex flex-wrap items-center justify-between gap-4 p-4 text-left hover:bg-brown-faint/60 transition-colors"
                    >
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <div>
                          <span className="text-text-secondary block uppercase tracking-wider text-[10px]">Reference</span>
                          <span className="font-bold text-brown-dark break-all">{order.orderReference}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary block uppercase tracking-wider text-[10px]">Date Placed</span>
                          <span className="font-semibold text-brown-primary">{orderDate}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary block uppercase tracking-wider text-[10px]">Total Amount</span>
                          <span className="font-bold text-brown-dark">{formatPriceWithCurrency(order.totalAmount, order.currencyCode, order.currencyRate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        {isOpen ? <ChevronUp className="h-4.5 w-4.5 text-slate-400" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-400" />}
                      </div>
                    </button>

                    {/* Order Details Body */}
                    {isOpen && (
                      <div className="border-t border-brown-faint p-4 bg-brown-faint/30 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-brown-dark">
                          <div>
                            <span className="font-bold text-brown-primary block mb-0.5">Shipping Address</span>
                            <span className="leading-relaxed">{order.address}</span>
                          </div>
                          <div className="sm:text-right">
                            <span className="font-bold text-brown-primary block mb-0.5">Payment Details</span>
                            <p>Method: {order.paymentMethod}</p>
                            <p>Recipient: {order.name}</p>
                          </div>
                        </div>

                        {/* Items in order */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-brown-primary uppercase tracking-wider block">Items Purchased</span>
                          <div className="divide-y divide-brown-faint bg-brown-faint/80 rounded-xl border border-brown-faint px-4 overflow-hidden">
                            {order.items.map((item) => (
                              <div key={item.productId} className="flex flex-col gap-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 gap-3 items-center">
                                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-beige">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <span className="font-semibold text-brown-dark block break-words">{item.name}</span>
                                    {item.selectedColor && (
                                      <span className="inline-block text-[10px] font-bold text-brown-primary">
                                        Size: {item.selectedColor}
                                      </span>
                                    )}
                                    <span className="text-text-secondary block">{formatPriceWithCurrency(item.price, order.currencyCode, order.currencyRate)} each</span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-left sm:text-right">
                                  <span className="font-bold text-brown-dark block">{formatPriceWithCurrency(item.price * item.quantity, order.currencyCode, order.currencyRate)}</span>
                                  <span className="text-text-secondary">Qty: {item.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
