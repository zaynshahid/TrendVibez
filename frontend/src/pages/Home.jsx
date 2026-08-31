import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, RefreshCw, ShieldCheck, Tag } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import ModelSlider from '../components/ModelSlider.jsx';
import ProductNotificationModal from '../components/ProductNotificationModal.jsx';
import { API_URL } from '../context/AuthContext.jsx';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, discountedRes] = await Promise.all([
          fetch(`${API_URL}/products?sort=newest`),
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products?discounted=true`)
        ]);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setFeatured(data.slice(0, 4));
        }
        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setCategories(cats);
        }
        if (discountedRes.ok) {
          const discData = await discountedRes.json();
          setDiscountedProducts(discData);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Homepage Login Product Notification Modal */}
      <ProductNotificationModal />

      {/* Featured Model & Product Swiper Slider */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }} 
        style={{ margin: '1.5rem 2rem 2rem' }}
      >
        <ModelSlider />
      </motion.section>

      <section style={{ backgroundColor: 'transparent', borderBottom: '1px solid rgba(221,209,195,0.4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.25rem 2rem 2.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: <Truck size={18} style={{ color: 'var(--brown-primary)' }} />, title: 'Express Shipping', desc: 'Free shipping on domestic orders over $75.' },
            { icon: <RefreshCw size={18} style={{ color: 'var(--brown-primary)' }} />, title: 'Easy Returns', desc: '30-day returns for a relaxed, confident experience.' },
            { icon: <ShieldCheck size={18} style={{ color: 'var(--brown-primary)' }} />, title: 'Secure Checkout', desc: 'A trustworthy, seamless buying journey.' },
          ].map(({ icon, title, desc }) => (
            <motion.div key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35 }} className="soft-card" style={{ padding: '1.25rem 1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(111,78,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.74rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Special Deals & Discounted Products Section */}
      {(loading || discountedProducts.length > 0) && (
        <section style={{ padding: '4rem 2rem 1rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B83227', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={13} /> Limited Time Offers
                </p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'var(--text-primary)' }}>
                  Special Deals & Discounts
                </h2>
              </div>
              <Link to="/products" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B83227', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderBottom: '1px solid #B83227', paddingBottom: '2px' }}>
                Browse full collection <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="skeleton" style={{ aspectRatio: '4/5', borderRadius: '22px' }} />
                    <div className="skeleton" style={{ height: 12, width: '60%' }} />
                    <div className="skeleton" style={{ height: 10, width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {discountedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="categories" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '0.75rem' }}>Curated for Every Wardrobe</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--text-primary)' }}>Shop by Category</h2>
            <div className="section-divider" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.35rem' }}>
            {categories.map(({ id, name, image, subtitle }, index) => (
              <motion.div key={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.08 }}>
                <Link to={`/products?category=${encodeURIComponent(name)}`} style={{ position: 'relative', display: 'block', height: '420px', overflow: 'hidden', textDecoration: 'none', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }} className="soft-card">
                  {image ? (
                    <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform 0.6s ease' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${(index * 67) % 360}, 45%, 28%) 0%, hsl(${(index * 67 + 40) % 360}, 55%, 18%) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '4rem', opacity: 0.25 }}>🏷️</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(44,24,16,0.86) 0%, rgba(44,24,16,0.2) 60%, rgba(44,24,16,0) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--bg-primary)', marginBottom: '0.3rem' }}>{name}</h3>
                    {subtitle && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--beige)', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.05em' }}>{subtitle} <ArrowRight size={12} /></p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 2rem 5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '0.6rem' }}>Newly Dropped</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'var(--text-primary)' }}>Featured Arrivals</h2>
            </div>
            <Link to="/products" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderBottom: '1px solid var(--brown-primary)', paddingBottom: '2px' }}>Browse full collection <ArrowRight size={13} /></Link>
          </div>

          {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>{[...Array(4)].map((_, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}><div className="skeleton" style={{ aspectRatio: '4/5', borderRadius: '22px' }} /><div className="skeleton" style={{ height: 12, width: '60%' }} /><div className="skeleton" style={{ height: 10, width: '80%' }} /></div>)}</div> : featured.length === 0 ? <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--beige)', borderRadius: '22px' }}><p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>No products available in the catalog yet.</p></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>{featured.map(product => <ProductCard key={product.id} product={product} />)}</div>}
        </div>
      </section>
    </div>
  );
}
