import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const isOutOfStock = product.stock <= 0;

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
      `}</style>

      <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: 'rgba(247,242,235,0.92)', fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '0.22rem 0.6rem', borderRadius: '999px', backdropFilter: 'blur(8px)' }}>{product.category}</span>

      <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} loading="lazy" />
        {isOutOfStock && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,24,16,0.65)', backdropFilter: 'blur(2px)' }}><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>Out of Stock</span></div>}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>{product.name}</h3>
        {product.rating && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem' }}><span style={{ fontSize: '0.7rem', color: '#C4953A' }}>★</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{product.rating.toFixed(1)}</span></div>}
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
        <div style={{ marginTop: 'auto', paddingTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {product.stock <= 5 && product.stock > 0 && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: '#C4953A', letterSpacing: '0.06em', display: 'block', marginBottom: '0.15rem' }}>Only {product.stock} left</span>}
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>${product.price.toFixed(2)}</span>
          </div>
          <button className={`add-cart-btn${added ? ' success' : ''}`} onClick={handleAdd} disabled={isOutOfStock || adding} title={isOutOfStock ? 'Out of stock' : 'Add to Cart'}>{adding ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : added ? <Check size={14} /> : <ShoppingCart size={14} />}</button>
        </div>
        {errorMsg && <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', background: 'rgba(139,58,58,0.08)', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '10px' }}><AlertCircle size={11} style={{ color: 'var(--error)', flexShrink: 0 }} /><span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--error)', fontWeight: 600 }}>{errorMsg}</span></div>}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Link>
  );
}
