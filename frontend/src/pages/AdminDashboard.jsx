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
  Activity,
  Tag,
  FolderTree,
  Bell,
  BellOff,
  Eye,
  Save,
  Percent,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  CheckSquare,
  Square,
  DollarSign,
  Layers,
  Instagram,
  Package,
  Calendar,
  Info,
  Globe
} from 'lucide-react';

import ActivityLogTab from '../components/ActivityLogTab.jsx';
import ProductNotificationModal from '../components/ProductNotificationModal.jsx';
import InstagramPublishModal from '../components/InstagramPublishModal.jsx';
import MultiInstagramPublishModal from '../components/MultiInstagramPublishModal.jsx';
import InstagramIcon from '../components/InstagramIcon.jsx';
import FacebookPublishModal from '../components/FacebookPublishModal.jsx';
import MultiFacebookPublishModal from '../components/MultiFacebookPublishModal.jsx';
import FacebookIcon from '../components/FacebookIcon.jsx';



import { 
  CATEGORY_DEFINITIONS, 
  CATEGORY_SUBCATEGORIES_MAP, 
  getSubcategoriesForCategory, 
  getAllDefinedSubcategories 
} from '../constants/categories.js';

export default function AdminDashboard() {

  const { token, user: activeAdmin } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  // Category Management States
  const [catSearch, setCatSearch] = useState('');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catImageInput, setCatImageInput] = useState('');
  const [catSubtitleInput, setCatSubtitleInput] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

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
  const [pSubcategory, setPSubcategory] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pGender, setPGender] = useState('Unisex');
  const [pImage, setPImage] = useState('');
  const [pStock, setPStock] = useState('');
  const [pVariants, setPVariants] = useState([]);
  const [pVariantType, setPVariantType] = useState('color'); // 'color' | 'size'

  // Homepage notification settings states
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifProductId, setNotifProductId] = useState('');
  const [notifProductSearch, setNotifProductSearch] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifPreviewOpen, setNotifPreviewOpen] = useState(false);

  // Enhanced Products filter state
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');
  const [productSubcatFilter, setProductSubcatFilter] = useState('All');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productGenderFilter, setProductGenderFilter] = useState('All');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [discountStatusFilter, setDiscountStatusFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Discount feature state
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [bulkDiscountInput, setBulkDiscountInput] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Instagram Publishing Modal States
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [igSelectedProduct, setIgSelectedProduct] = useState(null);
  const [isMultiIgModalOpen, setIsMultiIgModalOpen] = useState(false);

  // Facebook Publishing Modal States
  const [isFbModalOpen, setIsFbModalOpen] = useState(false);
  const [fbSelectedProduct, setFbSelectedProduct] = useState(null);
  const [isMultiFbModalOpen, setIsMultiFbModalOpen] = useState(false);

  // Revenue Chart Interactive States
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  // Refund Modal States
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetOrder, setRefundTargetOrder] = useState(null);
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);


  const openInstagramPublish = (product = null) => {
    if (!product && selectedProductIds.length > 0) {
      setIsMultiIgModalOpen(true);
      return;
    }
    setIgSelectedProduct(product);
    setIsIgModalOpen(true);
  };

  const openMultiInstagramPublish = () => {
    if (selectedProductIds.length === 0) return;
    setIsMultiIgModalOpen(true);
  };

  const openFacebookPublish = (product = null) => {
    if (!product && selectedProductIds.length > 0) {
      setIsMultiFbModalOpen(true);
      return;
    }
    setFbSelectedProduct(product);
    setIsFbModalOpen(true);
  };

  const openMultiFacebookPublish = () => {
    if (selectedProductIds.length === 0) return;
    setIsMultiFbModalOpen(true);
  };






  // Load admin dashboards data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { 
            if (data) {
              setStats(data);
              if (data.revenueOverTime && data.revenueOverTime.length > 0) {
                setSelectedChartPoint(prev => {
                  if (prev) {
                    const match = data.revenueOverTime.find(d => d.date === prev.date);
                    return match || data.revenueOverTime[data.revenueOverTime.length - 1];
                  }
                  return data.revenueOverTime[data.revenueOverTime.length - 1];
                });
              }
            }
          }),

        fetch(`${API_URL}/products`)
          .then(r => r.ok ? r.json() : [])
          .then(data => setProducts(data)),
        fetch(`${API_URL}/orders`, { headers })
          .then(r => r.ok ? r.json() : [])
          .then(data => setOrders(data)),
        fetch(`${API_URL}/admin/users`, { headers })
          .then(r => r.ok ? r.json() : [])
          .then(data => setUsers(data)),
        fetch(`${API_URL}/categories`)
          .then(r => r.ok ? r.json() : [])
          .then(data => setCategories(data)),
        fetch(`${API_URL}/admin/settings/featured-notification`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setNotifEnabled(data.enabled);
              setNotifProductId(data.productId || '');
            }
          })
      ]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred fetching dashboard logs.');
    } finally {
      setLoading(false);
    }
  };

  // Save notification settings
  const saveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings/featured-notification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: notifEnabled, productId: notifProductId })
      });
      if (res.ok) {
        triggerSuccess('Homepage notification settings saved successfully!');
      } else {
        triggerError('Failed to save notification settings.');
      }
    } catch (err) {
      triggerError('Network error saving notification settings.');
    } finally {
      setNotifSaving(false);
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

  // Category CRUD ACTIONS
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatImageInput('');
    setCatSubtitleInput('');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatImageInput(cat.image || '');
    setCatSubtitleInput(cat.subtitle || '');
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const trimmed = catNameInput.trim();
    if (!trimmed) {
      triggerError('Category name cannot be empty.');
      return;
    }

    const duplicate = categories.find(
      c => c.name.toLowerCase() === trimmed.toLowerCase() && (!editingCategory || c.id !== editingCategory.id)
    );
    if (duplicate) {
      triggerError(`A category named "${trimmed}" already exists.`);
      return;
    }

    setCatSubmitting(true);
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const endpoint = editingCategory ? `${API_URL}/categories/${editingCategory.id}` : `${API_URL}/categories`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmed, image: catImageInput.trim(), subtitle: catSubtitleInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save category.');

      setIsCatModalOpen(false);
      triggerSuccess(editingCategory ? `Category "${trimmed}" updated successfully!` : `Category "${trimmed}" created successfully!`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCategoryDelete = async (cat) => {
    if (cat.productCount > 0) {
      triggerError(`Cannot delete category "${cat.name}" because ${cat.productCount} product(s) are currently using it. Please reassign or delete those products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/categories/${cat.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete category.');

      triggerSuccess(data.message || `Category "${cat.name}" deleted successfully.`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(catSearch.toLowerCase())
  );

  // PRODUCT CRUD ACTIONS
  const openAddModal = () => {
    setEditingProduct(null);
    setPName('');
    setPDescription('');
    setPPrice('');
    setPCategory(categories.length > 0 ? categories[0].name : 'Men');
    setPSubcategory('');
    setPBrand('');
    setPGender('Unisex');
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
    setPSubcategory(product.subcategory || '');
    setPBrand(product.brand || '');
    setPGender(product.gender || (product.category === 'Men' ? 'Men' : product.category === 'Women' ? 'Women' : product.category === 'Kids' ? 'Kids' : 'Unisex'));
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
      subcategory: pSubcategory,
      brand: pBrand,
      gender: pGender,
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

  const openRefundModal = (order) => {
    if (!order) return;
    const total = parseFloat(order.totalAmount || 0);
    setRefundTargetOrder(order);
    setRefundAmountInput(total.toFixed(2));
    setIsRefundModalOpen(true);
  };

  const handleRefundApprove = async () => {
    if (!refundTargetOrder) return;
    const amount = parseFloat(refundAmountInput);
    const orderTotal = parseFloat(refundTargetOrder.totalAmount || 0);
    if (isNaN(amount) || amount <= 0) {
      triggerError('Please enter a valid refund amount.');
      return;
    }
    if (amount > orderTotal) {
      triggerError(`Refund cannot exceed the order total of $${orderTotal.toFixed(2)}.`);
      return;
    }
    setRefundSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/orders/${refundTargetOrder.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refundAmount: amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve refund.');

      setIsRefundModalOpen(false);
      setRefundTargetOrder(null);
      setRefundAmountInput('');
      triggerSuccess(`Refund of $${amount.toFixed(2)} approved for order ${data.orderReference}. Customer notified by email.`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setRefundSubmitting(false);
    }
  };


  const getOrderStatusBadgeClass = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const renderPlatformBadge = (platform) => {
    const p = (platform || 'Direct').toLowerCase();
    if (p.includes('insta')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-pink-200 dark:border-pink-900/60 px-2.5 py-1 text-[10px] font-bold text-pink-700 dark:text-pink-300 shadow-xs">
          <InstagramIcon className="h-3.5 w-3.5" />
          <span>Instagram</span>
        </span>
      );
    }
    if (p.includes('fb') || p.includes('face')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 shadow-xs">
          <FacebookIcon className="h-3.5 w-3.5" />
          <span>Facebook</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
        <Globe className="h-3.5 w-3.5 text-slate-500" />
        <span>Direct Web</span>
      </span>
    );
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

  // DISCOUNT ACTIONS
  const handleApplyBulkDiscount = async (discountValue) => {
    const pct = parseFloat(discountValue);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      triggerError('Please enter a discount between 0 and 100.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products/bulk-discount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productIds: selectedProductIds, discountPercent: pct })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to apply discount.');
      setIsDiscountModalOpen(false);
      setSelectedProductIds([]);
      setBulkDiscountInput('');
      triggerSuccess(pct === 0
        ? `Discount removed from ${selectedProductIds.length} product(s).`
        : `${pct}% discount applied to ${selectedProductIds.length} product(s)!`
      );
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };


  // Reset all filters helper
  const handleResetFilters = () => {
    setProductSearch('');
    setProductCatFilter('All');
    setProductSubcatFilter('All');
    setProductBrandFilter('');
    setProductGenderFilter('All');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setDiscountStatusFilter('All');
  };

  const hasActiveFilters = 
    productSearch !== '' || 
    productCatFilter !== 'All' || 
    productSubcatFilter !== 'All' || 
    productBrandFilter !== '' || 
    productGenderFilter !== 'All' || 
    minPriceFilter !== '' || 
    maxPriceFilter !== '' || 
    discountStatusFilter !== 'All';

  // Enhanced multi-attribute filter products for local view
  const filteredProducts = products.filter(p => {
    // 1. Search Query (name, description, id, brand, subcategory, category)
    const q = productSearch.trim().toLowerCase();
    const matchesSearch = !q || 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.description && p.description.toLowerCase().includes(q)) || 
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    // 2. Category Filter
    const matchesCat = productCatFilter === 'All' || p.category === productCatFilter;

    // 3. Subcategory Filter
    const subcat = productSubcatFilter.trim().toLowerCase();
    const pSub = (p.subcategory || '').toLowerCase();
    const pFullText = (p.name + ' ' + p.description + ' ' + p.category).toLowerCase();
    const matchesSubcat = productSubcatFilter === 'All' || 
      (pSub && pSub.includes(subcat)) || 
      (!pSub && pFullText.includes(subcat));

    // 4. Brand Filter
    const b = productBrandFilter.trim().toLowerCase();
    const pBrandVal = (p.brand || '').toLowerCase();
    const matchesBrand = !b || 
      (pBrandVal && pBrandVal.includes(b)) || 
      (!pBrandVal && pFullText.includes(b));

    // 5. Gender Filter
    const g = productGenderFilter.toLowerCase();
    const pGenderVal = (p.gender || p.category || '').toLowerCase();
    const matchesGender = productGenderFilter === 'All' || 
      pGenderVal.includes(g) || 
      pFullText.includes(g);

    // 6. Price Range Filter
    const pPriceVal = parseFloat(p.price);
    const minP = minPriceFilter !== '' ? parseFloat(minPriceFilter) : null;
    const maxP = maxPriceFilter !== '' ? parseFloat(maxPriceFilter) : null;
    const matchesMinPrice = minP === null || isNaN(minP) || pPriceVal >= minP;
    const matchesMaxPrice = maxP === null || isNaN(maxP) || pPriceVal <= maxP;

    // 7. Discount Status Filter
    const disc = parseFloat(p.discountPercent || 0);
    const matchesDiscount = discountStatusFilter === 'All' ||
      (discountStatusFilter === 'Discounted' && disc > 0) ||
      (discountStatusFilter === 'NonDiscounted' && disc === 0);

    return matchesSearch && matchesCat && matchesSubcat && matchesBrand && matchesGender && matchesMinPrice && matchesMaxPrice && matchesDiscount;
  });

  const toggleProductSelect = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const selectAllFiltered = () => {
    setSelectedProductIds(filteredProducts.map(p => p.id));
  };

  if (loading && !stats) {
    return (
      <div className="theme-loading-screen">
        <div className="theme-loading-content">
          <Loader2 className="h-8 w-8 animate-spin text-brown-primary" />
          <span>Loading store admin panels...</span>
        </div>
      </div>
    );
  }

  // Render SVG Revenue Line Graph with Interactive Product Breakdown
  const renderRevenueChart = () => {
    if (!stats || !stats.revenueOverTime || stats.revenueOverTime.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 gap-2">
          <TrendingUp className="h-6 w-6 text-slate-400 stroke-1" />
          <span>No sales logs recorded yet. Line chart will populate once orders are completed.</span>
        </div>
      );
    }

    const dataPoints = stats.revenueOverTime;
    const maxVal = Math.max(...dataPoints.map(d => d.amount), 100) * 1.15; // 15% headroom
    const height = 190;
    const width = 620;
    const paddingLeft = 45;
    const paddingRight = 25;
    const paddingTop = 20;
    const paddingBottom = 35;

    // Map data points to coordinates
    const points = dataPoints.map((dp, i) => {
      let x = paddingLeft;
      if (dataPoints.length > 1) {
        x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (dataPoints.length - 1);
      } else {
        x = width / 2;
      }
      const y = height - paddingBottom - (dp.amount * (height - paddingTop - paddingBottom)) / maxVal;
      return { x, y, dp };
    });

    const polylineString = points.map(p => `${p.x},${p.y}`).join(' ');

    // Active inspected data point (hovered or clicked or default to latest)
    const activePoint = hoveredChartPoint?.dp || selectedChartPoint || dataPoints[dataPoints.length - 1];
    const activePointCoord = points.find(p => p.dp.date === activePoint?.date) || points[points.length - 1];

    return (
      <div className="space-y-6">
        {/* Chart Container & Interactive Overlay */}
        <div className="relative w-full rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 p-3 border border-slate-100 dark:border-slate-800/80">
          <div className="relative w-full overflow-x-auto no-scrollbar">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[520px]">
              {/* Grid Lines & Y-Axis Reference Labels */}
              {[0, 0.5, 1].map((pct, idx) => {
                const yVal = height - paddingBottom - pct * (height - paddingTop - paddingBottom);
                const dollarVal = Math.round((pct * maxVal));
                return (
                  <g key={idx}>
                    <line 
                      x1={paddingLeft} 
                      y1={yVal} 
                      x2={width - paddingRight} 
                      y2={yVal} 
                      stroke="#e2e8f0" 
                      strokeDasharray={pct > 0 ? "4 4" : "0"} 
                      strokeWidth="1" 
                      className="dark:stroke-slate-800/80" 
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={yVal + 3} 
                      textAnchor="end" 
                      fontSize="9" 
                      fill="#94a3b8" 
                      className="font-mono font-semibold"
                    >
                      ${dollarVal}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Crosshair Line for Active Point */}
              {activePointCoord && (
                <line
                  x1={activePointCoord.x}
                  y1={paddingTop}
                  x2={activePointCoord.x}
                  y2={height - paddingBottom}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-fade-in"
                />
              )}

              {/* Polyline & Fill Area */}
              {dataPoints.length > 1 ? (
                <>
                  <polygon
                    fill="url(#areaGradient)"
                    points={`${points[0]?.x},${height - paddingBottom} ${polylineString} ${points[points.length - 1]?.x},${height - paddingBottom}`}
                  />
                  <polyline
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineString}
                  />
                </>
              ) : (
                /* Single Day Bar indicator */
                <line
                  x1={points[0]?.x}
                  y1={height - paddingBottom}
                  x2={points[0]?.x}
                  y2={points[0]?.y}
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Points Circles */}
              {points.map((p, index) => {
                const isSelected = activePoint?.date === p.dp.date;
                const isHovered = hoveredChartPoint?.dp?.date === p.dp.date;

                return (
                  <g 
                    key={index} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedChartPoint(p.dp)}
                    onMouseEnter={() => setHoveredChartPoint(p)}
                    onMouseLeave={() => setHoveredChartPoint(null)}
                  >
                    {/* Pulsing selection halo */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        className="fill-indigo-500/20 stroke-indigo-500 stroke-1 animate-pulse"
                      />
                    )}

                    {/* Outer border ring */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? "6" : "4.5"}
                      className={`transition-all duration-200 ${
                        isSelected
                          ? 'fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-2 shadow-lg'
                          : 'fill-indigo-500 hover:fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-1.5'
                      }`}
                    />

                    {/* Extended invisible touch target */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="16"
                      fill="transparent"
                    />

                    {/* Accessibility Tooltip */}
                    <title>{`${p.dp.date}: $${p.dp.amount.toFixed(2)} (${p.dp.products?.length || 0} product types)`}</title>
                  </g>
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#ec4899" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Date Labels Bar */}
            <div className="flex justify-between pl-10 pr-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              <span>{dataPoints[0]?.date}</span>
              {dataPoints.length > 2 && (
                <span>{dataPoints[Math.floor(dataPoints.length / 2)]?.date}</span>
              )}
              <span>{dataPoints[dataPoints.length - 1]?.date}</span>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
            💡 Click or hover on any dot above to inspect the exact products sold on that date.
          </div>
        </div>

        {/* Dynamic Product Breakdown Panel for Active Point */}
        {activePoint && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4 animate-slide-up">
            {/* Header with Date and Day Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Sales on {activePoint.date}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                      {activePoint.ordersCount || 1} Order{activePoint.ordersCount !== 1 ? 's' : ''}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Product contribution breakdown for this specific data point
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Day Revenue</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ${activePoint.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* List of Products Sold on that Date */}
            {activePoint.products && activePoint.products.length > 0 ? (
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Products Represented by This Dot ({activePoint.products.length}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {activePoint.products.map((prod, pIdx) => {
                    const sharePct = activePoint.amount > 0 ? ((prod.revenue / activePoint.amount) * 100).toFixed(0) : 0;
                    
                    return (
                      <div 
                        key={pIdx} 
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        {/* Product Thumbnail */}
                        <div className="h-11 w-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                          {prod.image ? (
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200';
                              }}
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400 stroke-1" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {prod.name}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 shrink-0">
                              ${prod.revenue.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>
                              {prod.quantity} unit{prod.quantity > 1 ? 's' : ''} sold (${prod.price.toFixed(2)} ea)
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {sharePct}% share
                            </span>
                          </div>

                          {/* Progress share bar */}
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 text-center">
                Total daily sales recorded: ${activePoint.amount.toFixed(2)}. Detailed line-item breakdown is tracked for all standard checkout orders.
              </div>
            )}
          </div>
        )}
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
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'categories'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Categories</span>
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
          <button
            onClick={() => setActiveTab('notification')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notification'
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
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
                      <div className="flex justify-between gap-3 font-bold">
                        <span className="text-brown-dark dark:text-slate-100">{cat}'s apparel</span>
                        <span className="text-brown-primary dark:text-slate-200">${amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
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

          {/* Social & Acquisition Channels Summary */}
          <div className="admin-theme-panel p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-indigo-500" />
              <span>Acquisition Channels & Social Conversion</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {[
                {
                  name: 'Instagram',
                  icon: <InstagramIcon className="h-4 w-4" />,
                  bg: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/60',
                  color: 'from-pink-500 to-rose-500',
                  sales: stats.platformSales?.Instagram ?? orders.filter(o => (o.platform || '').toLowerCase().includes('insta')).reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
                  count: stats.platformOrders?.Instagram ?? orders.filter(o => (o.platform || '').toLowerCase().includes('insta')).length
                },
                {
                  name: 'Facebook',
                  icon: <FacebookIcon className="h-4 w-4" />,
                  bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60',
                  color: 'from-blue-500 to-indigo-600',
                  sales: stats.platformSales?.Facebook ?? orders.filter(o => (o.platform || '').toLowerCase().includes('fb') || (o.platform || '').toLowerCase().includes('face')).reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
                  count: stats.platformOrders?.Facebook ?? orders.filter(o => (o.platform || '').toLowerCase().includes('fb') || (o.platform || '').toLowerCase().includes('face')).length
                },
                {
                  name: 'Direct Storefront',
                  icon: <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
                  bg: 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-700',
                  color: 'from-slate-500 to-slate-700',
                  sales: stats.platformSales?.Direct ?? orders.filter(o => !(o.platform || '').toLowerCase().includes('insta') && !(o.platform || '').toLowerCase().includes('fb') && !(o.platform || '').toLowerCase().includes('face')).reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
                  count: stats.platformOrders?.Direct ?? orders.filter(o => !(o.platform || '').toLowerCase().includes('insta') && !(o.platform || '').toLowerCase().includes('fb') && !(o.platform || '').toLowerCase().includes('face')).length
                }
              ].map((plat) => {
                const pct = stats.totalSales > 0 ? (plat.sales / stats.totalSales) * 100 : 0;
                return (
                  <div key={plat.name} className={`p-4 rounded-2xl border ${plat.bg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        {plat.icon}
                        <span>{plat.name}</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {plat.count} {plat.count === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      ${plat.sales.toFixed(2)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Share of Revenue</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/80 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${plat.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. PRODUCTS TAB (CRUD & BULK DISCOUNTS) -------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Main Filter & Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search Input */}
                <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Search by name, description, ID, brand..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full sm:w-64 rounded-xl admin-theme-input py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>

                {/* Category Filter */}
                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="rounded-xl admin-theme-select py-2 px-3 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Discount Status Filter */}
                <select
                  value={discountStatusFilter}
                  onChange={(e) => setDiscountStatusFilter(e.target.value)}
                  className="rounded-xl admin-theme-select py-2 px-3 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Discount Statuses</option>
                  <option value="Discounted">🔥 Discounted Products Only</option>
                  <option value="NonDiscounted">🏷️ Regular Price Only</option>
                </select>

                {/* Toggle Advanced Filters Button */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                    showAdvancedFilters || (hasActiveFilters && (productSubcatFilter !== 'All' || productBrandFilter || productGenderFilter !== 'All' || minPriceFilter || maxPriceFilter))
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters</span>
                  {(productSubcatFilter !== 'All' || productBrandFilter || productGenderFilter !== 'All' || minPriceFilter || maxPriceFilter) && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Publish to Instagram Button */}
                <button
                  type="button"
                  onClick={() => openInstagramPublish(null)}
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(220, 39, 67, 0.35)'
                  }}
                  title={selectedProductIds.length > 0 ? `Publish ${selectedProductIds.length} selected products in 1 Instagram Carousel post` : "Create custom Instagram post"}
                >
                  <InstagramIcon size={16} color="#ffffff" />
                  <span>
                    {selectedProductIds.length > 0 
                      ? `Publish (${selectedProductIds.length}) Carousel to IG` 
                      : 'Publish to Instagram'}
                  </span>
                </button>

                {/* Publish to Facebook Button */}
                <button
                  type="button"
                  onClick={() => openFacebookPublish(null)}
                  style={{
                    background: 'linear-gradient(135deg, #1877F2 0%, #0d5dbf 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(24, 119, 242, 0.35)'
                  }}
                  title={selectedProductIds.length > 0 ? `Publish ${selectedProductIds.length} selected products in 1 Facebook Gallery post` : "Create custom Facebook post"}
                >
                  <FacebookIcon size={16} color="#ffffff" />
                  <span>
                    {selectedProductIds.length > 0
                      ? `Publish (${selectedProductIds.length}) Gallery to FB`
                      : 'Publish to Facebook'}
                  </span>
                </button>


                {/* Add New Product Button */}
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl admin-theme-action-btn px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>


            {/* Expandable Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-slide-up">
                {/* Subcategory Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subcategory / Type</label>
                  <select
                    value={productSubcatFilter}
                    onChange={(e) => setProductSubcatFilter(e.target.value)}
                    className="w-full rounded-xl admin-theme-select py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="All">All Subcategories</option>
                    {(productCatFilter !== 'All' ? getSubcategoriesForCategory(productCatFilter) : getAllDefinedSubcategories()).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. TrendVibe, Selvedge"
                    value={productBrandFilter}
                    onChange={(e) => setProductBrandFilter(e.target.value)}
                    className="w-full rounded-xl admin-theme-input py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Gender Target Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gender Target</label>
                  <select
                    value={productGenderFilter}
                    onChange={(e) => setProductGenderFilter(e.target.value)}
                    className="w-full rounded-xl admin-theme-select py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="All">All Genders</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Price Range ($)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min $"
                      value={minPriceFilter}
                      onChange={(e) => setMinPriceFilter(e.target.value)}
                      className="w-full rounded-xl admin-theme-input py-1.5 px-2 text-xs font-semibold focus:outline-none"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max $"
                      value={maxPriceFilter}
                      onChange={(e) => setMaxPriceFilter(e.target.value)}
                      className="w-full rounded-xl admin-theme-input py-1.5 px-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Reset Filters Action */}
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            )}

            {/* Results Count & Bulk Selection Quick Toolbar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</strong> of {products.length} products
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full hover:underline"
                  >
                    Reset active filters ✕
                  </button>
                )}
              </div>

              {filteredProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Select All {filteredProducts.length} Filtered</span>
                  </button>
                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-normal underline"
                    >
                      Deselect
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Action Toolbar (appears when items are selected) */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 px-4 py-3 animate-slide-up">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openMultiInstagramPublish}
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(220, 39, 67, 0.35)'
                  }}
                  title="Publish selected products in 1 Instagram Carousel post"
                >
                  <InstagramIcon size={14} color="#ffffff" />
                  <span>IG Carousel</span>
                </button>
                <button
                  type="button"
                  onClick={openMultiFacebookPublish}
                  style={{
                    background: 'linear-gradient(135deg, #1877F2 0%, #0d5dbf 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(24, 119, 242, 0.35)'
                  }}
                  title="Publish selected products in 1 Facebook Gallery post"
                >
                  <FacebookIcon size={14} color="#ffffff" />
                  <span>FB Gallery</span>
                </button>
                <button
                  onClick={() => { setBulkDiscountInput(''); setIsDiscountModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <Percent className="h-3.5 w-3.5" />
                  Set Discount
                </button>
                <button
                  onClick={() => handleApplyBulkDiscount('0')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1.5 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  Remove Discount
                </button>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Product Listing Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer accent-indigo-600"
                      />
                    </th>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Price / Discount</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500 font-normal">
                        No products match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className={`admin-theme-table-row transition-colors ${selectedProductIds.includes(p.id) ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={() => toggleProductSelect(p.id)}
                            className="rounded cursor-pointer accent-indigo-600"
                          />
                        </td>
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
                        <td className="px-6 py-4 text-right">
                          {p.discountPercent > 0 ? (
                            <div>
                              <span className="block text-slate-400 line-through text-[10px] font-normal">${p.price.toFixed(2)}</span>
                              <span className="block text-emerald-600 dark:text-emerald-400 font-bold">${p.discountedPrice ? p.discountedPrice.toFixed(2) : (p.price * (1 - p.discountPercent / 100)).toFixed(2)}</span>
                              <span className="inline-block mt-0.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">-{p.discountPercent}% OFF</span>
                            </div>
                          ) : (
                            <span className="text-slate-900 dark:text-white font-bold">${p.price.toFixed(2)}</span>
                          )}
                        </td>
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openInstagramPublish(p)}
                              style={{
                                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 7px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(220, 39, 67, 0.35)',
                                flexShrink: 0
                              }}
                              title="Publish product to Instagram feed"
                            >
                              <InstagramIcon size={14} color="#ffffff" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openFacebookPublish(p)}
                              style={{
                                background: 'linear-gradient(135deg, #1877F2 0%, #0d5dbf 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 7px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(24, 119, 242, 0.35)',
                                flexShrink: 0
                              }}
                              title="Publish product to Facebook Page"
                            >
                              <FacebookIcon size={14} color="#ffffff" />
                            </button>

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
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-6 py-4">Order Ref</th>
                    <th className="px-6 py-4">Client Detail</th>
                    <th className="px-6 py-4">Channel / Platform</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="sticky right-[110px] z-10 bg-slate-50 dark:bg-slate-950/60 px-6 py-4 min-w-[220px] shadow-[-12px_0_18px_-20px_rgba(15,23,42,0.8)]">Status & Dispatch</th>
                    <th className="sticky right-0 z-20 bg-slate-50 dark:bg-slate-950/60 px-3 py-4 text-center w-[110px] min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-500 font-normal">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderPlatformBadge(o.platform)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${parseFloat(o.totalAmount || 0).toFixed(2)}</td>
                        <td className="sticky right-[110px] z-10 bg-white dark:bg-slate-900 px-6 py-4 min-w-[220px] shadow-[-12px_0_18px_-20px_rgba(15,23,42,0.8)]">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getOrderStatusBadgeClass(o.status)}`}>
                              {o.status}
                            </span>
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brown-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                              aria-label={`Dispatch status for order ${o.orderReference || o.id}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            {o.refundStatus === 'Approved' && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-400">
                                <RotateCcw className="h-3 w-3" />
                                Refunded ${parseFloat(o.refundAmount || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="sticky right-0 z-20 bg-white dark:bg-slate-900 px-3 py-4 text-center w-[110px] min-w-[110px]">
                          <div className="flex items-center justify-center gap-1.5">
                            {o.refundStatus !== 'Approved' && (
                              <button
                                onClick={() => openRefundModal(o)}
                                className="rounded-lg p-2 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white dark:bg-teal-950/50 dark:text-teal-400 dark:hover:bg-teal-600 dark:hover:text-white transition-all shadow-sm flex items-center justify-center"
                                title="Approve / Issue Refund"
                                aria-label="Approve Refund"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOrderDelete(o.id)}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center justify-center"
                              title="Delete order"
                              aria-label="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* -------------------- CATEGORIES TAB -------------------- */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Categories</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{categories.length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Shirt className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Categorized Products</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {categories.reduce((acc, c) => acc + (c.productCount || 0), 0)}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <FolderTree className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">System Status</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Database Synced</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search categories..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full rounded-xl admin-theme-input py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>

            <button
              onClick={openAddCategoryModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl admin-theme-action-btn px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add New Category</span>
            </button>
          </div>

          {/* Category Listing Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 uppercase tracking-widest text-[9px] text-slate-450 font-bold">
                  <tr>
                    <th className="px-6 py-4">Category Name</th>
                    <th className="px-6 py-4">Category ID</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-center">Products Count</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-normal">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="admin-theme-table-row transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-450 font-mono text-[11px]">
                          {cat.id}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            cat.productCount > 0 
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditCategoryModal(cat)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(cat)}
                              className={`p-1.5 transition-colors cursor-pointer rounded-lg ${
                                cat.productCount > 0
                                  ? 'text-slate-300 dark:text-slate-700 hover:text-rose-500'
                                  : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              }`}
                              title={cat.productCount > 0 ? "Category has assigned products (Cannot delete)" : "Delete Category"}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* ==================== TAB 5: ACTIVITY LOGS ==================== */}
      {activeTab === 'logs' && <ActivityLogTab />}

      {/* ==================== TAB 6: HOMEPAGE NOTIFICATION SETTINGS ==================== */}
      {activeTab === 'notification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                <Bell size={20} style={{ color: 'var(--brown-primary)' }} />
                Homepage Login Notification
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Control which product popup appears when a user logs in for the first time in a session.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setNotifPreviewOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
              >
                <Eye size={15} /> Preview Popup
              </button>
              <button
                onClick={saveNotifSettings}
                disabled={notifSaving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.3rem', borderRadius: '10px', border: 'none', background: 'var(--brown-primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: notifSaving ? 'not-allowed' : 'pointer', opacity: notifSaving ? 0.65 : 1, transition: 'all 0.2s' }}
              >
                {notifSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                {notifSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Toggle Card */}
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: notifEnabled ? 'rgba(90,122,82,0.12)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {notifEnabled
                    ? <Bell size={20} style={{ color: '#5A7A52' }} />
                    : <BellOff size={20} style={{ color: 'var(--text-muted)' }} />
                  }
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {notifEnabled ? '✅ Notification Popup is Enabled' : '🔕 Notification Popup is Disabled'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {notifEnabled
                      ? 'Users will see the popup once per session after login.'
                      : 'No popup will appear for any user on the homepage.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setNotifEnabled(v => !v)}
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  borderRadius: '999px',
                  border: 'none',
                  background: notifEnabled ? '#5A7A52' : '#B8A99A',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                  flexShrink: 0,
                  padding: 0,
                }}
                title={notifEnabled ? 'Click to disable' : 'Click to enable'}
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: notifEnabled ? '26px' : '3px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  transition: 'left 0.3s ease',
                  display: 'block',
                }} />
              </button>
            </div>
          </div>

          {/* Product Selection Card */}
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Featured Product Selection</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Choose which product to show in the popup. Leave on "Automatic" to always show the newest product.
              </p>
            </div>

            {/* Auto-mode option */}
            <div
              onClick={() => setNotifProductId('')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '12px', border: `2px solid ${!notifProductId ? 'var(--brown-primary)' : 'var(--border-color)'}`,
                background: !notifProductId ? 'rgba(111,78,55,0.07)' : 'var(--bg-primary)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(111,78,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={16} style={{ color: 'var(--brown-primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Automatic — Show Newest Product</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Automatically picks the most recently added product.</p>
              </div>
              {!notifProductId && <CheckCircle2 size={18} style={{ color: 'var(--brown-primary)', flexShrink: 0 }} />}
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search products to feature..."
                value={notifProductSearch}
                onChange={e => setNotifProductSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Product list */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.5rem' }}>
              {products
                .filter(p =>
                  !notifProductSearch ||
                  p.name.toLowerCase().includes(notifProductSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(notifProductSearch.toLowerCase())
                )
                .map(product => (
                  <div
                    key={product.id}
                    onClick={() => setNotifProductId(product.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem',
                      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                      border: `1.5px solid ${notifProductId === product.id ? 'var(--brown-primary)' : 'transparent'}`,
                      background: notifProductId === product.id ? 'rgba(111,78,55,0.07)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (notifProductId !== product.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (notifProductId !== product.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', background: 'var(--bg-secondary)', flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{product.category} · ${parseFloat(product.price).toFixed(2)}</p>
                    </div>
                    {notifProductId === product.id && <CheckCircle2 size={16} style={{ color: 'var(--brown-primary)', flexShrink: 0 }} />}
                  </div>
                ))
              }
              {products.filter(p =>
                !notifProductSearch ||
                p.name.toLowerCase().includes(notifProductSearch.toLowerCase()) ||
                p.category.toLowerCase().includes(notifProductSearch.toLowerCase())
              ).length === 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No products found.</p>
              )}
            </div>
          </div>

          {/* Currently Selected Banner */}
          {notifProductId && (() => {
            const selected = products.find(p => p.id === notifProductId);
            if (!selected) return null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '14px', border: '1.5px solid rgba(90,122,82,0.4)', background: 'rgba(90,122,82,0.06)' }}>
                <img src={selected.image} alt={selected.name} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5A7A52', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>✓ Currently Selected for Popup</p>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{selected.category} · ${parseFloat(selected.price).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setNotifProductId('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                  title="Remove selection"
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={18} />
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Notification Preview Modal */}
      {notifPreviewOpen && (
        <ProductNotificationModal
          forceShow={true}
          onClose={() => setNotifPreviewOpen(false)}
        />
      )}

      {/* ==================== CATEGORY CRUD MODAL ==================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footwear, Accessories, Watches"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Card Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={catImageInput}
                  onChange={(e) => setCatImageInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400">This image appears on the Home page category card. Use an Unsplash URL for best results.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Card Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Luxury & Sport, Sneakers & Loafers"
                  value={catSubtitleInput}
                  onChange={(e) => setCatSubtitleInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400">Short tagline shown under the category name on the card.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {catSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Footwear">Footwear</option>
                      </>
                    )}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Subcategory / Type</label>
                  <select
                    value={pSubcategory}
                    onChange={(e) => setPSubcategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-brown-primary text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select a subcategory</option>
                    {getSubcategoriesForCategory(pCategory).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {pSubcategory && !getSubcategoriesForCategory(pCategory).includes(pSubcategory) && (
                      <option value={pSubcategory}>{pSubcategory}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. TrendVibe"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-brown-primary text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-350">Gender Target</label>
                  <select
                    value={pGender}
                    onChange={(e) => setPGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-brown-primary text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
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

      {/* ==================== BULK DISCOUNT MODAL ==================== */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-indigo-500" />
                <span>Apply Discount ({selectedProductIds.length} Items)</span>
              </h3>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={bulkDiscountInput}
                onChange={(e) => setBulkDiscountInput(e.target.value)}
                placeholder="e.g. 20"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 focus:outline-none focus:border-indigo-600 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 text-xs font-bold"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10, 15, 20, 25, 30, 50].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBulkDiscountInput(p.toString())}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      bulkDiscountInput === p.toString()
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {p}% OFF
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyBulkDiscount(bulkDiscountInput)}
                disabled={bulkSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {bulkSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Apply Discount</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Instagram Publish Modal */}
      <InstagramPublishModal
        isOpen={isIgModalOpen}
        onClose={() => {
          setIsIgModalOpen(false);
          setIgSelectedProduct(null);
        }}
        product={igSelectedProduct}
        token={token}
        onSuccess={(data) => {
          triggerSuccess('Product successfully published to Instagram feed!');
          loadData();
        }}
      />

      {/* Multiple Instagram Publish Modal (Carousel) */}
      <MultiInstagramPublishModal
        isOpen={isMultiIgModalOpen}
        onClose={() => setIsMultiIgModalOpen(false)}
        selectedProducts={products.filter(p => selectedProductIds.includes(p.id))}
        token={token}
        onSuccess={(res) => {
          triggerSuccess(res?.message || 'Instagram Carousel post successfully published!');
          loadData();
        }}
      />

      {/* Single Facebook Publish Modal */}
      <FacebookPublishModal
        isOpen={isFbModalOpen}
        onClose={() => {
          setIsFbModalOpen(false);
          setFbSelectedProduct(null);
        }}
        product={fbSelectedProduct}
        token={token}
        onSuccess={(data) => {
          triggerSuccess('Product successfully published to Facebook Page!');
          loadData();
        }}
      />

      {/* Multiple Facebook Publish Modal (Gallery) */}
      <MultiFacebookPublishModal
        isOpen={isMultiFbModalOpen}
        onClose={() => setIsMultiFbModalOpen(false)}
        selectedProducts={products.filter(p => selectedProductIds.includes(p.id))}
        token={token}
        onSuccess={(res) => {
          triggerSuccess(res?.message || 'Facebook Gallery post successfully published!');
          loadData();
        }}
      />

      {/* ── Refund Approval Modal ── */}
      {isRefundModalOpen && refundTargetOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md animate-slide-up flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Approve Refund</h3>
                  <p className="text-[11px] text-slate-500">Review amount and issue customer refund</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsRefundModalOpen(false); setRefundTargetOrder(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Order summary */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Order Reference</span>
                  <span className="font-bold text-slate-900 dark:text-white">{refundTargetOrder.orderReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer</span>
                  <span className="font-bold text-slate-900 dark:text-white">{refundTargetOrder.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{refundTargetOrder.email}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                  <span className="text-slate-500 font-medium">Order Total</span>
                  <span className="font-bold text-slate-900 dark:text-white">${parseFloat(refundTargetOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Refund amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Refund Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max={parseFloat(refundTargetOrder.totalAmount || 0)}
                    step="0.01"
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Max refund: ${parseFloat(refundTargetOrder.totalAmount || 0).toFixed(2)} · Customer will receive a confirmation email automatically.
                </p>
              </div>

              {/* 3-5 business days note */}
              <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-4 py-3 text-xs text-teal-700 dark:text-teal-400 font-medium flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-teal-500" />
                <span>The customer will be emailed that their refund will appear in their account within <strong>3–5 business days</strong>.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => { setIsRefundModalOpen(false); setRefundTargetOrder(null); }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefundApprove}
                disabled={refundSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                {refundSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Approve & Notify Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


