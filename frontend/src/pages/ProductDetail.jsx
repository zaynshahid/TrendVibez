import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Check, AlertCircle, Sparkles, ShieldCheck, RefreshCw, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { API_URL } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import LiquidGlassButton from '../components/LiquidGlassButton.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [alternatives, setAlternatives] = useState([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);

  useEffect(() => {
    async function fetchProductDetail() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) {
          throw new Error('Product not found or unavailable');
        }
        const data = await res.json();
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const inStockV = data.variants.find(v => v.stock > 0);
          setSelectedVariant(inStockV || data.variants[0]);
        }
        if ((data.category === 'Men' || data.category === 'Women') && (!data.variants || data.variants.length === 0)) {
          setSelectedSize('Medium');
        }

        // Check if completely out of stock and pre-fetch alternatives
        const totalStock = data.variants && data.variants.length > 0
          ? data.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : (data.stock || 0);
        if (totalStock <= 0) {
          fetchAlternatives(data.category, data.id);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error fetching details');
      } finally {
        setLoading(false);
      }
    }

    async function fetchAlternatives(category, currentId) {
      try {
        setAlternativesLoading(true);
        const res = await fetch(`${API_URL}/products?category=${encodeURIComponent(category)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter: same category, not current product, must have stock > 0
          const alts = data
            .filter(p => p.id !== currentId && (
              // Has variants with stock
              (p.variants && p.variants.length > 0 && p.variants.some(v => v.stock > 0)) ||
              // Or no variants but has stock
              (!p.variants || p.variants.length === 0) && (p.stock || 0) > 0
            ))
            .slice(0, 6);
          setAlternatives(alts);
        }
      } catch (err) {
        console.error('Error fetching alternatives:', err);
      } finally {
        setAlternativesLoading(false);
      }
    }

    async function fetchRecommendations() {
      try {
        setRecommendationsLoading(true);
        const res = await fetch(`${API_URL}/products/${id}/recommendations`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setRecommendationsLoading(false);
      }
    }

    fetchProductDetail();
    fetchRecommendations();
  }, [id]);

  const sizeOptions = ['Small', 'Medium', 'Large', 'XL'];
  const isAdultProduct = product?.category === 'Men' || product?.category === 'Women';
  const hasVariants = product?.variants && product.variants.length > 0;
  const isColorVariant = hasVariants && product.variants[0]?.variantType === 'color';
  const isSizeVariant = hasVariants && product.variants[0]?.variantType === 'size';
  const hasAdultSizes = isAdultProduct && !hasVariants;
  const selectedOptionLabel = isSizeVariant ? selectedVariant?.color : hasAdultSizes ? selectedSize : isColorVariant ? selectedVariant?.color : null;
  const effectiveStock = hasVariants ? (selectedVariant ? selectedVariant.stock : 0) : (product?.stock || 0);
  const isOutOfStock = effectiveStock <= 0;
  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    if (product) {
      window.__CURRENT_PRODUCT__ = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
        selectedSize: selectedOptionLabel || selectedSize || '',
        selectedVariantId: selectedVariant ? selectedVariant.id : '',
        quantity
      };
    } else {
      window.__CURRENT_PRODUCT__ = null;
    }
    return () => {
      window.__CURRENT_PRODUCT__ = null;
    };
  }, [product, selectedOptionLabel, selectedSize, selectedVariant, quantity]);

  const handleQtyChange = (val) => {
    if (!product) return;
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= effectiveStock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!product || effectiveStock <= 0) return;

    setAdding(true);
    setActionError('');
    try {
      const variantId = selectedVariant ? selectedVariant.id : '';
      const selectedOption = hasVariants ? (selectedVariant ? selectedVariant.color : '') : (hasAdultSizes ? selectedSize : '');
      await addToCart(product.id, quantity, variantId, selectedOption);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
      setActionError(err.message || 'Error adding items to cart');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="page-shell" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brown-primary)] border-t-transparent" /></div>;
  }

  if (error || !product) {
    return <div className="page-shell" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}><div className="soft-card" style={{ maxWidth: '560px', padding: '2rem', textAlign: 'center' }}><div style={{ display: 'inline-flex', width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(139,58,58,0.08)', color: 'var(--error)', marginBottom: '1rem' }}><AlertCircle className="h-8 w-8" /></div><h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Product Unavailable</h2><p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>{error || "The product you're looking for might have been deleted by the admin or does not exist."}</p><Link to="/products" className="btn-outline" style={{ width: 'fit-content', margin: '0 auto' }}><ArrowLeft className="h-4 w-4" /> Back to Catalog</Link></div></div>;
  }

  return (
    <div className="page-shell" style={{ padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Link to="/products" className="btn-ghost" style={{ width: 'fit-content' }}><ArrowLeft className="h-4 w-4" /> Back to Catalog</Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="soft-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: '28px' }}>
            <div style={{ aspectRatio: '4/5', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            </div>
            {isOutOfStock && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,24,16,0.68)', pointerEvents: 'none', zIndex: 2 }}><span style={{ border: '1px solid rgba(255,255,255,0.6)', color: '#fff', padding: '0.45rem 0.8rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Out of Stock</span></div>}
          </div>

          <div className="soft-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ display: 'inline-flex', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '0.75rem' }}>{product.category}'s Collection</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.55rem' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.85rem, 3vw, 2.65rem)', color: 'var(--text-primary)' }}>{product.name}</h1>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: wishlisted ? 'rgba(139,58,58,0.1)' : 'rgba(111,78,55,0.06)',
                    color: wishlisted ? 'var(--error)' : 'var(--text-secondary)',
                    border: wishlisted ? '1px solid rgba(139,58,58,0.25)' : '1px solid var(--border-color)',
                    transition: 'transform 0.15s ease, color 0.2s ease, background-color 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.color = 'var(--error)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.color = wishlisted ? 'var(--error)' : 'var(--text-secondary)';
                  }}
                >
                  <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
              {product.rating && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}><div style={{ display: 'flex', gap: '0.2rem' }}>{[1,2,3,4,5].map(star => <span key={star} style={{ color: star <= Math.round(product.rating) ? '#C4953A' : 'var(--beige)' }}>★</span>)}</div><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{product.rating.toFixed(1)}</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 5.0</span></div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: product.discountPercent > 0 ? '#B83227' : 'var(--text-primary)' }}>
                    {formatPrice(product.discountedPrice !== undefined ? product.discountedPrice : (product.discountPercent > 0 ? product.price * (1 - product.discountPercent / 100) : product.price))}
                  </span>
                  {product.discountPercent > 0 && (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(product.price)}
                    </span>
                  )}
                  {product.discountPercent > 0 && (
                    <span style={{ background: '#B83227', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px', letterSpacing: '0.05em' }}>
                      {Math.round(product.discountPercent)}% OFF
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {isOutOfStock ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Currently sold out{selectedOptionLabel ? ` (${selectedOptionLabel})` : ''}</span> : effectiveStock <= 5 ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: '#9a6a15', background: 'rgba(138,105,20,0.1)', padding: '0.35rem 0.6rem', borderRadius: '999px' }}>Hurry, only {effectiveStock} left{selectedOptionLabel ? ` for ${selectedOptionLabel}` : ''}</span> : <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', background: 'rgba(90,122,82,0.12)', padding: '0.35rem 0.6rem', borderRadius: '999px' }}>In stock{selectedOptionLabel ? ` for ${selectedOptionLabel}` : ''}</span>}
              </div>
            </div>

            {(hasVariants || hasAdultSizes) && <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{isColorVariant ? <>Color: <span style={{ color: 'var(--brown-primary)' }}>{selectedVariant?.color}</span></> : <>Size: <span style={{ color: 'var(--brown-primary)' }}>{hasAdultSizes ? selectedSize : selectedVariant?.color}</span></>}</label>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hasVariants ? (selectedVariant?.stock > 0 ? `${selectedVariant.stock} in stock` : 'Out of stock') : `${effectiveStock} in stock`}</span>
              </div>
              {hasAdultSizes && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>{sizeOptions.map(size => { const isSelected = selectedSize === size; return <button key={size} onClick={() => setSelectedSize(size)} style={{ minWidth: '48px', padding: '0.6rem 0.8rem', borderRadius: '999px', border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)', background: isSelected ? 'rgba(111,78,55,0.08)' : '#fffdfa', color: isSelected ? 'var(--brown-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700 }} title={`${size} size option`}>{size}</button>; })}</div>}
              {isColorVariant && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.7rem' }}>{product.variants.map((v) => { const isSelected = selectedVariant?.id === v.id; const vOos = v.stock <= 0; return <button key={v.id || v.color} onClick={() => { setSelectedVariant(v); setQuantity(1); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '999px', border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)', background: isSelected ? 'rgba(111,78,55,0.08)' : '#fffdfa', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '0.73rem', fontWeight: 700, opacity: vOos ? 0.65 : 1 }} title={`${v.color} (${v.stock} in stock)`}><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: v.colorHex }} />{v.color}{vOos && <span style={{ color: 'var(--error)', fontSize: '0.62rem' }}>Sold Out</span>}</button>; })}</div>}
              {isSizeVariant && <div style={{ marginTop: '0.75rem' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>{product.variants.map((v) => { const isSelected = selectedVariant?.id === v.id; const vOos = v.stock <= 0; return <button key={v.id || v.color} onClick={() => { if (!vOos) { setSelectedVariant(v); setQuantity(1); } }} disabled={vOos} style={{ minWidth: '48px', padding: '0.6rem 0.8rem', borderRadius: '999px', border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)', background: isSelected ? 'rgba(111,78,55,0.08)' : '#fffdfa', color: vOos ? 'var(--text-muted)' : 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700 }} title={vOos ? `${v.color} — Out of stock` : `${v.color} — ${v.stock} available`}>{v.color}</button>; })}</div></div>}
            </div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: '999px', border: '1px solid var(--border-color)', background: '#fffdfa', overflow: 'hidden' }}>
                <button onClick={() => handleQtyChange(-1)} disabled={isOutOfStock || quantity <= 1} style={{ width: '42px', height: '42px', color: 'var(--text-secondary)', fontSize: '1rem', opacity: isOutOfStock || quantity <= 1 ? 0.45 : 1 }}>−</button>
                <span style={{ width: '42px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{quantity}</span>
                <button onClick={() => handleQtyChange(1)} disabled={isOutOfStock || quantity >= effectiveStock} style={{ width: '42px', height: '42px', color: 'var(--text-secondary)', fontSize: '1rem', opacity: isOutOfStock || quantity >= effectiveStock ? 0.45 : 1 }}>+</button>
              </div>
              <LiquidGlassButton onClick={handleAddToCart} disabled={isOutOfStock || adding} variant={added ? 'success' : 'primary'} className="flex-1 h-11 text-sm font-bold rounded-full">{adding ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : added ? <><Check className="h-4 w-4" /><span>Added to Cart!</span></> : <><ShoppingBag className="h-4 w-4" /><span>Add {quantity} to Cart</span></>}</LiquidGlassButton>
            </div>
            {actionError && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.8rem', background: 'rgba(139,58,58,0.08)', border: '1px solid rgba(139,58,58,0.18)', borderRadius: '12px', color: 'var(--error)', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, marginBottom: '1rem' }}><AlertCircle className="h-4 w-4 shrink-0" />{actionError}</div>}

            {/* Out of Stock — See Alternatives Inline Banner */}
            {isOutOfStock && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: 'rgba(111,78,55,0.07)',
                border: '1px solid rgba(111,78,55,0.18)',
                borderRadius: '14px',
                marginBottom: '1rem',
              }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>😔</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    This item is sold out
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                    {alternativesLoading
                      ? 'Finding alternatives for you…'
                      : alternatives.length > 0
                        ? `We found ${alternatives.length} similar item${alternatives.length > 1 ? 's' : ''} you might love`
                        : 'Check back soon or explore our full catalog'}
                  </p>
                </div>
                {alternatives.length > 0 && (
                  <a
                    href="#alternatives"
                    style={{
                      flexShrink: 0,
                      padding: '0.4rem 0.85rem',
                      background: 'var(--brown-primary)',
                      color: '#fff',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '999px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    See Alternatives ↓
                  </a>
                )}
              </div>
            )}

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>Product Details</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{product.description}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.7rem', marginTop: '1rem' }}>
              <div className="soft-card" style={{ padding: '0.8rem', textAlign: 'center' }}><ShieldCheck className="h-5 w-5" style={{ color: 'var(--brown-primary)', margin: '0 auto 0.3rem' }} /><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>100% Quality</span></div>
              <div className="soft-card" style={{ padding: '0.8rem', textAlign: 'center' }}><RefreshCw className="h-5 w-5" style={{ color: 'var(--brown-primary)', margin: '0 auto 0.3rem' }} /><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>30-Day Returns</span></div>
              <div className="soft-card" style={{ padding: '0.8rem', textAlign: 'center' }}><Sparkles className="h-5 w-5" style={{ color: 'var(--brown-primary)', margin: '0 auto 0.3rem' }} /><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Curated Fit</span></div>
            </div>
          </div>
        </motion.div>

        {/* ── Alternatives Section (only when OOS and alternatives exist) ── */}
        {isOutOfStock && (alternatives.length > 0 || alternativesLoading) && (
          <div id="alternatives" style={{ marginTop: '4rem', borderTop: '2px solid rgba(111,78,55,0.15)', paddingTop: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{
                display: 'inline-block',
                background: 'rgba(111,78,55,0.1)',
                color: 'var(--brown-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                marginBottom: '0.75rem',
              }}>
                This Item Is Sold Out
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', margin: 0 }}>
                Similar Items You'll Love
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                These in-stock alternatives from the same category might be perfect for you
              </p>
            </div>

            {alternativesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brown-primary)] border-t-transparent" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {alternatives.map((alt) => (
                  <ProductCard key={alt.id} product={alt} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended for You Section */}
        <div style={{ marginTop: '4rem', borderTop: '1px solid var(--border-color)', paddingTop: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
            Recommended for You
          </h2>
          {recommendationsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brown-primary)] border-t-transparent" />
            </div>
          ) : recommendations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {recommendations.map((rec) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '0.95rem' }}>
              No similar products found.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
