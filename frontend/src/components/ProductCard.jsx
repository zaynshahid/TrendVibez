import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const wishlisted = isWishlisted(product.id);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    if (Array.isArray(product.variants) && product.variants.some(variant => variant.variantType === 'size')) {
      setErrorMsg('Please choose a size first');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setAdding(true);
    setErrorMsg('');
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error adding to cart');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isOutOfStock = product.stock <= 0;
  const discountPercent = product.discountPercent ? parseFloat(product.discountPercent) : 0;
  const hasDiscount = discountPercent > 0;
  const effectivePrice = product.discountedPrice !== undefined ? product.discountedPrice : (hasDiscount ? product.price * (1 - discountPercent / 100) : product.price);

  return (
    <Link to={`/products/${product.id}`} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textDecoration: 'none', overflow: 'hidden', transition: 'box-shadow 0.3s ease, transform 0.3s ease', position: 'relative', borderRadius: '22px', boxShadow: 'var(--shadow-sm)' }} className="product-card-link">
      <style>{`
        .product-card-link:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
        .product-card-link img { transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1); }
        .product-card-link:hover img { transform: scale(1.05); }
        .add-cart-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: var(--brown-primary); color: #fff; border: none; cursor: pointer; flex-shrink: 0; border-radius: 999px; transition: background-color 0.2s ease, transform 0.15s ease; }
        .add-cart-btn:hover { background: var(--brown-dark); }
        .add-cart-btn:active { transform: scale(0.93); }
        .add-cart-btn:disabled { background: var(--warm-gray); cursor: not-allowed; pointer-events: none; }
        .add-cart-btn.success { background: var(--olive); }
        .wishlist-btn { position: absolute; top: 12px; right: 12px; z-index: 3; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 999px; background: rgba(255,255,255,0.9); color: var(--text-secondary); border: 1px solid rgba(221,209,195,0.8); box-shadow: var(--shadow-sm); backdrop-filter: blur(8px); transition: transform 0.15s ease, color 0.2s ease, background-color 0.2s ease; }
        .wishlist-btn:hover { color: var(--error); transform: scale(1.06); }
        .wishlist-btn.active { color: var(--error); background: rgba(255,245,245,0.95); border-color: rgba(139,58,58,0.25); }
      `}</style>

      <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: 'rgba(247,242,235,0.92)', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '0.22rem 0.6rem', borderRadius: '999px', backdropFilter: 'blur(8px)' }}>{product.category}</span>
      {hasDiscount && (
        <span style={{ position: 'absolute', top: 42, left: 12, zIndex: 2, background: '#B83227', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', padding: '0.22rem 0.6rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(184,50,39,0.35)' }}>
          {Math.round(discountPercent)}% OFF
        </span>
      )}
      <button
        type="button"
        className={`wishlist-btn${wishlisted ? ' active' : ''}`}
        onClick={handleWishlistToggle}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>

      <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} loading="lazy" />
        {isOutOfStock && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,24,16,0.72)', pointerEvents: 'none', zIndex: 2 }}><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>Out of Stock</span></div>}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>{product.name}</h3>
        {product.rating && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem' }}><span style={{ fontSize: '0.7rem', color: '#C4953A' }}>★</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{product.rating.toFixed(1)}</span></div>}
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
        <div style={{ marginTop: 'auto', paddingTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {product.stock <= 5 && product.stock > 0 && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: '#C4953A', letterSpacing: '0.06em', display: 'block', marginBottom: '0.15rem' }}>Only {product.stock} left</span>}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700, color: hasDiscount ? '#B83227' : 'var(--text-primary)', letterSpacing: '0.01em' }}>
                {formatPrice(effectivePrice)}
              </span>
              {hasDiscount && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
          <button className={`add-cart-btn${added ? ' success' : ''}`} onClick={handleAdd} disabled={isOutOfStock || adding} title={isOutOfStock ? 'Out of stock' : 'Add to Cart'}>{adding ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : added ? <Check size={14} /> : <ShoppingCart size={14} />}</button>
        </div>
        {errorMsg && <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', background: 'rgba(139,58,58,0.08)', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '10px' }}><AlertCircle size={11} style={{ color: 'var(--error)', flexShrink: 0 }} /><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--error)', fontWeight: 600 }}>{errorMsg}</span></div>}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Link>
  );
}
