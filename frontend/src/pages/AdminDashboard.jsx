import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  X,
  UserCheck,
  TrendingUp,
  Shirt,
  Activity
} from 'lucide-react';
import ActivityLogTab from '../components/ActivityLogTab.jsx';

export default function AdminDashboard() {
  const { token, user: activeAdmin } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modal / Form States (Products CRUD)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCategory, setPCategory] = useState('Men');
  const [pImage, setPImage] = useState('');
  const [pStock, setPStock] = useState('');
  const [pVariants, setPVariants] = useState([]);
  const [pVariantType, setPVariantType] = useState('color'); // 'color' | 'size'

  // Products filter state
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');

  // Load admin dashboards data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, { headers });
      if (!statsRes.ok) throw new Error('Failed to load sales stats.');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch products
      const prodRes = await fetch(`${API_URL}/products`);
      if (!prodRes.ok) throw new Error('Failed to load products list.');
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Fetch all orders
      const orderRes = await fetch(`${API_URL}/orders`, { headers });
      if (!orderRes.ok) throw new Error('Failed to load orders.');
      const orderData = await orderRes.json();
      setOrders(orderData);

      // Fetch users
      const usersRes = await fetch(`${API_URL}/admin/users`, { headers });
      if (!usersRes.ok) throw new Error('Failed to load user accounts.');
      const usersData = await usersRes.json();
      setUsers(usersData);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred fetching dashboard logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Alert helpers
  const triggerSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };
  const triggerError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(''), 5000);
  };

  // PRODUCT CRUD ACTIONS
  const openAddModal = () => {
    setEditingProduct(null);
    setPName('');
    setPDescription('');
    setPPrice('');
    setPCategory('Men');
    setPImage('');
    setPStock('0');
    setPVariants([]);
    setPVariantType('color');
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setPName(product.name);
    setPDescription(product.description);
    setPPrice(product.price.toString());
    setPCategory(product.category);
    setPImage(product.image);
    setPStock(product.stock.toString());
    const loadedVariants = product.variants ? product.variants.map(v => ({ ...v, id: v.id || crypto.randomUUID() })) : [];
    setPVariants(loadedVariants);
    setPVariantType(loadedVariants.length > 0 ? (loadedVariants[0].variantType || 'color') : 'color');
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!pName || !pDescription || !pPrice || !pCategory || !pImage) {
      triggerError('Please complete all product details.');
      return;
    }

    const calculatedStock = pVariants.length > 0
      ? pVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : parseInt(pStock || 0);

    const payload = {
      name: pName,
      description: pDescription,
      price: parseFloat(pPrice),
      category: pCategory,
      image: pImage,
      stock: calculatedStock,
      variants: pVariants.map(v => ({ ...v, variantType: pVariantType }))
    };

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product.');

      setIsModalOpen(false);
      triggerSuccess(editingProduct ? 'Product details updated successfully!' : 'New product created successfully!');
      
      // Refresh local catalog logs
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product from the catalog? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete product.');

      triggerSuccess('Product deleted from store catalog.');
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  // ORDER ACTIONS
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update order status.');

      triggerSuccess(`Order status updated to '${newStatus}'`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  const handleOrderDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel/delete this order history item?')) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete order.');

      triggerSuccess('Order record removed successfully.');
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  // USER ACTIONS
  const handleUserRoleUpdate = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user role.');

      triggerSuccess(`User promoted/demoted successfully.`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? All associated carts will be removed.')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user.');

      triggerSuccess('User account deleted.');
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  // Filter products for local view
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCatFilter === 'All' || p.category === productCatFilter;
    return matchesSearch && matchesCat;
  });

  if (loading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
          <span className="text-xs font-semibold text-slate-500">Loading store admin panels...</span>
        </div>
      </div>
    );
  }

  // Render SVG Revenue Line Graph
  const renderRevenueChart = () => {
    if (!stats || !stats.revenueOverTime || stats.revenueOverTime.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-xs text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          No sales logs recorded yet. Line chart will populate once orders are completed.
        </div>
      );
    }

    const dataPoints = stats.revenueOverTime;
    const maxVal = Math.max(...dataPoints.map(d => d.amount), 100);
    const height = 180;
    const width = 600;
    const padding = 30;

    // Map data points to coordinates
    const points = dataPoints.map((dp, i) => {
      const x = padding + (i * (width - 2 * padding)) / (dataPoints.length > 1 ? dataPoints.length - 1 : 1);
      const y = height - padding - (dp.amount * (height - 2 * padding)) / maxVal;
      return { x, y, dp };
    });

    const polylineString = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="relative w-full overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full min-w-[500px]">
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-800" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />

          {/* Polyline Path */}
          <polyline
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineString}
          />

          {/* Area under line */}
          <polygon
            fill="url(#areaGradient)"
            points={`${points[0]?.x},${height - padding} ${polylineString} ${points[points.length - 1]?.x},${height - padding}`}
          />

          {/* Points circles */}
          {points.map((p, index) => (
            <g key={index} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-indigo-650 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 hover:scale-130 transition-transform"
              />
              {/* Tooltip trigger hover */}
              <title>{`${p.dp.date}: $${p.dp.amount}`}</title>
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Labels bar */}
        <div className="flex justify-between px-8 text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">
          <span>{dataPoints[0]?.date}</span>
          <span>{dataPoints[dataPoints.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-slide-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[rgba(109,96,84,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Admin Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeAdmin.name}</span>
          </p>
        </div>

        {/* Global tab Switcher */}
        <div className="flex flex-wrap gap-1 rounded-xl admin-theme-pill-group p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'products'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <Shirt className="h-4 w-4" />
            <span>Products CRUD</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Orders Dispatch</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'logs'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Activity Logs</span>
          </button>
        </div>
      </div>

      {/* Global Toast Action Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-605 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-1.5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* -------------------- 1. OVERVIEW TAB -------------------- */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Total Sales (Revenue)</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">${stats.totalSales.toFixed(2)}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Total Orders Placed</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.numOrders}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Best Selling Segment</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.bestSellingCategory}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Registered Users</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Sales Chart Area */}
            <div className="lg:col-span-2 admin-theme-panel p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                <span>Revenue Over Time</span>
              </h3>
              {renderRevenueChart()}
            </div>

            {/* Category sales progress bars */}
            <div className="admin-theme-panel p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sales by Category
              </h3>
              <div className="space-y-4 pt-2">
                {Object.entries(stats.categorySales).map(([cat, amount]) => {
                  // Calculate percentage relative to total
                  const pct = stats.totalSales > 0 ? (amount / stats.totalSales) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{cat}'s apparel</span>
                        <span className="text-slate-500">${amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-550 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. PRODUCTS TAB (CRUD) -------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Local search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full sm:w-60 rounded-xl admin-theme-input py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>

              {/* Local Category Filter */}
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="rounded-xl admin-theme-select py-2 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Footwear">Footwear</option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl admin-theme-action-btn px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Product Listing Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-normal">
                        No products match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="admin-theme-table-row transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="h-10 w-8 object-cover rounded bg-slate-100 dark:bg-slate-800" />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                              <span className="text-[10px] text-slate-450 font-normal line-clamp-1 max-w-[200px]">{p.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{p.category}</td>
                        <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-bold">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${p.stock <= 5 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-350'}`}>
                            {p.stock} units
                          </span>
                          {p.variants && p.variants.length > 0 && (() => {
                            const vType = p.variants[0]?.variantType;
                            return (
                              <div className="mt-1 space-y-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                <span className={`block ${
                                  vType === 'size'
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                                }`}>{vType === 'size' ? `${p.variants.length} Sizes` : `${p.variants.length} Colors`}</span>
                                {vType === 'size' && (
                                  <span className="block text-slate-500 dark:text-slate-400 font-normal">
                                    {p.variants.map((v, idx) => `${v.color} ${v.stock} left${idx < p.variants.length - 1 ? ', ' : ''}`)}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 transition-colors"
                              title="Edit product"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleProductDelete(p.id)}
                              className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 3. ORDERS DISPATCH TAB -------------------- */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-6 py-4">Order Ref</th>
                    <th className="px-6 py-4">Client Detail</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status & Dispatch</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-normal">
                        No orders recorded in database.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{o.orderReference}</span>
                          <span className="text-[10px] text-slate-450 font-normal">{new Date(o.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{o.name}</span>
                          <span className="text-[10px] text-slate-450 font-normal block">{o.email}</span>
                          <span className="text-[10px] text-slate-450 font-normal line-clamp-1 max-w-[200px]">{o.address}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${o.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-xs font-semibold focus:outline-none dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOrderDelete(o.id)}
                            className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Delete order"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 4. USERS TAB -------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-center">Role Privileges</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {users.map((u) => {
                    const isSelf = u.id === activeAdmin.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && <span className="text-[9px] uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 px-1.5 py-0.5 rounded font-bold">You</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUserRoleUpdate(u.id, u.role)}
                              disabled={isSelf}
                              className={`rounded p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <UserCheck className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(u.id)}
                              disabled={isSelf}
                              className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete user account"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: ACTIVITY LOGS ==================== */}
      {activeTab === 'logs' && <ActivityLogTab />}

      {/* ==================== PRODUCT CRUD MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-6 sm:pt-12 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl relative animate-slide-up border dark:border-slate-800 max-h-[85vh] overflow-y-auto no-scrollbar">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Knit Sweater"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 45.00"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">
                    {pVariants.length > 0 ? 'Total Stock (Auto-calculated)' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required={pVariants.length === 0}
                    disabled={pVariants.length > 0}
                    placeholder="e.g. 50"
                    value={pVariants.length > 0 ? pVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) : pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-75"
                  />
                </div>
              </div>

              {/* VARIANTS BUILDER */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Product Variants & Stock</label>
                    <span className="text-[10px] text-slate-400 block">Set unique stock per variant option</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Variant type toggle */}
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => { setPVariantType('color'); setPVariants([]); }}
                        className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                          pVariantType === 'color'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        🎨 Colors
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPVariantType('size'); setPVariants([]); }}
                        className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                          pVariantType === 'size'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        📐 Sizes
                      </button>
                    </div>

                    {/* Presets */}
                    {pVariantType === 'color' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPVariants([
                            { id: crypto.randomUUID(), color: 'Pure White', colorHex: '#FFFFFF', stock: 15, variantType: 'color' },
                            { id: crypto.randomUUID(), color: 'Jet Black', colorHex: '#18181B', stock: 20, variantType: 'color' },
                            { id: crypto.randomUUID(), color: 'Navy Blue', colorHex: '#1E3A8A', stock: 12, variantType: 'color' },
                            { id: crypto.randomUUID(), color: 'Sage Green', colorHex: '#4D7C0F', stock: 8, variantType: 'color' },
                            { id: crypto.randomUUID(), color: 'Dusty Rose', colorHex: '#E11D48', stock: 5, variantType: 'color' },
                            { id: crypto.randomUUID(), color: 'Caramel Brown', colorHex: '#B45309', stock: 0, variantType: 'color' }
                          ]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        + 6-Color Tee Preset
                      </button>
                    )}
                    {pVariantType === 'size' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPVariants([{ id: crypto.randomUUID(), color: 'Small', colorHex: 'size', stock: 10, variantType: 'size' }, { id: crypto.randomUUID(), color: 'Medium', colorHex: 'size', stock: 20, variantType: 'size' }, { id: crypto.randomUUID(), color: 'Large', colorHex: 'size', stock: 15, variantType: 'size' }, { id: crypto.randomUUID(), color: 'XL', colorHex: 'size', stock: 5, variantType: 'size' }])}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          + S/M/L/XL Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => setPVariants([{ id: crypto.randomUUID(), color: 'XS', colorHex: 'size', stock: 8, variantType: 'size' }, { id: crypto.randomUUID(), color: 'Small', colorHex: 'size', stock: 12, variantType: 'size' }, { id: crypto.randomUUID(), color: 'Medium', colorHex: 'size', stock: 10, variantType: 'size' }, { id: crypto.randomUUID(), color: 'Large', colorHex: 'size', stock: 5, variantType: 'size' }])}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          + XS/S/M/L Preset
                        </button>
                      </>
                    )}

                    {/* Add single variant */}
                    <button
                      type="button"
                      onClick={() => {
                        if (pVariantType === 'size') {
                          setPVariants([...pVariants, { id: crypto.randomUUID(), color: '', colorHex: 'size', stock: 10, variantType: 'size' }]);
                        } else {
                          setPVariants([...pVariants, { id: crypto.randomUUID(), color: '', colorHex: '#4f46e5', stock: 10, variantType: 'color' }]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      + Add {pVariantType === 'size' ? 'Size' : 'Color'}
                    </button>
                  </div>
                </div>

                {pVariants.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    No variants added. (Product will use single general stock quantity).
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {pVariants.map((v, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        {/* Color picker only for color variants */}
                        {pVariantType === 'color' ? (
                          <input
                            type="color"
                            value={v.colorHex && v.colorHex !== 'size' ? v.colorHex : '#000000'}
                            onChange={(e) => {
                              const next = [...pVariants];
                              next[index].colorHex = e.target.value;
                              setPVariants(next);
                            }}
                            className="h-7 w-7 rounded border-0 cursor-pointer bg-transparent shrink-0"
                            title="Pick color code"
                          />
                        ) : (
                          <span className="h-7 w-7 flex items-center justify-center text-lg shrink-0">📐</span>
                        )}
                        <input
                          type="text"
                          placeholder={pVariantType === 'size' ? 'Size (e.g. Small, Medium, XL)' : 'Color Name (e.g. Navy Blue)'}
                          value={v.color}
                          onChange={(e) => {
                            const next = [...pVariants];
                            next[index].color = e.target.value;
                            setPVariants(next);
                          }}
                          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <div className="w-24 flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Stock:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={v.stock}
                            onChange={(e) => {
                              const next = [...pVariants];
                              next[index].stock = parseInt(e.target.value) || 0;
                              setPVariants(next);
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2 text-xs font-bold text-center focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPVariants(pVariants.filter((_, i) => i !== index))}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Category</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Footwear">Footwear</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://unsplash.com/..."
                    value={pImage}
                    onChange={(e) => setPImage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detail the fabric weaves, collar layouts, size structures, etc."
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
