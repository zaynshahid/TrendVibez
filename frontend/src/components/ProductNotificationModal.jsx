import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

export default function ProductNotificationModal({ forceShow = false, onClose = () => {} }) {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [productData, setProductData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is not logged in and not forceShow (admin preview), do not fetch or display
    if (!user && !forceShow) return;

    // Check session storage if already shown in this session
    const hasSeen = sessionStorage.getItem('has_seen_login_notification');
    if (hasSeen === 'true' && !forceShow) return;

    async function fetchNotificationProduct() {
      try {
        const res = await fetch(`${API_URL}/admin/settings/featured-notification`);
        if (res.ok) {
          const data = await res.json();
          if ((data.enabled || forceShow) && data.product) {
            setProductData(data.product);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to load featured notification product:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotificationProduct();
  }, [user, forceShow]);

  const handleClose = () => {
    setIsOpen(false);
    if (!forceShow) {
      sessionStorage.setItem('has_seen_login_notification', 'true');
    }
    onClose();
  };

  if (!isOpen || !productData) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: 'rgba(28, 16, 11, 0.65)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '540px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Top Banner Gradient */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, var(--brown-dark) 0%, var(--coffee) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#F7F2EB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: '#DDD1C3' }} />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#EDE4D8',
                }}
              >
                Welcome Back! Featured Drop
              </span>
            </div>

            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#F7F2EB',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '1.75rem 1.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              {/* Product Image */}
              <div
                style={{
                  position: 'relative',
                  width: '160px',
                  height: '190px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <img
                  src={productData.image}
                  alt={productData.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: 'rgba(59, 42, 34, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#F7F2EB',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  {productData.category}
                </div>
              </div>

              {/* Product Content Details */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--coffee)',
                    marginBottom: '0.35rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Tag size={12} /> Just Added to Catalog
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.4rem',
                    lineHeight: 1.25,
                  }}
                >
                  {productData.name}
                </h3>

                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--brown-primary)',
                    marginBottom: '0.65rem',
                  }}
                >
                  {formatPrice(productData.price)}
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {productData.description}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Link
                    to={`/products/${productData.id}`}
                    onClick={handleClose}
                    className="btn-primary"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBag size={14} /> Shop Now <ArrowRight size={13} />
                  </Link>

                  <button
                    onClick={handleClose}
                    className="btn-outline"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
