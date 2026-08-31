import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function Wishlist() {
  const { wishlist, clearWishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            <Link to="/products" className="btn-ghost" style={{ width: 'fit-content', marginBottom: '0.85rem' }}>
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ display: 'inline-flex', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(139,58,58,0.1)', color: 'var(--error)' }}>
                <Heart size={18} fill="currentColor" />
              </span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--brown-dark)' }}>Wishlist</h1>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {wishlist.length ? `${wishlist.length} saved product${wishlist.length !== 1 ? 's' : ''}` : 'Save products you love and revisit them later.'}
            </p>
          </div>

          {wishlist.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className="btn-outline"
              style={{ padding: '0.55rem 1rem', fontSize: '0.7rem' }}
            >
              <Trash2 size={14} /> Clear Wishlist
            </button>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--beige)', background: 'var(--bg-card)', borderRadius: '24px' }}>
            <div style={{ display: 'inline-flex', width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(111,78,55,0.08)', color: 'var(--brown-primary)', marginBottom: '1rem' }}>
              <ShoppingBag size={30} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>Your Wishlist is Empty</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.7, marginBottom: '1.4rem' }}>
              Tap the heart on any product to keep your favorites in one place.
            </p>
            <Link to="/products" className="btn-primary">
              Browse Collection
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {wishlist.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => wishlist.forEach((product) => removeFromWishlist(product.id))}
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                Remove all saved products
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
