import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { API_URL } from '../context/AuthContext.jsx';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const res = await fetch(`${API_URL}/products?sort=newest`);
        if (res.ok) {
          const data = await res.json();
          setFeatured(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="hero-panel" style={{ minHeight: '88vh', margin: '2rem', padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', minHeight: '88vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4rem 3rem', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--coffee)', borderBottom: '1px solid rgba(111,78,55,0.3)', paddingBottom: '0.35rem' }}>New Season Arrivals</div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.7rem, 5vw, 4.4rem)', fontWeight: 800, lineHeight: 1.08, color: 'var(--brown-dark)', marginBottom: '1.35rem' }}>Redefine Your Style,<br /><em style={{ fontStyle: 'italic', color: 'var(--coffee)' }}>Own Your Vibe.</em></h1>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', lineHeight: 1.9, color: 'var(--text-secondary)', marginBottom: '2.2rem', maxWidth: '440px' }}>Crafted for modern wardrobes with warm textures, elegant tailoring, and a quietly luxurious feel.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/products" className="btn-primary">Shop Collection <ArrowRight size={14} /></Link>
                <a href="#categories" className="btn-outline">Explore Categories</a>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', borderTopRightRadius: '32px', borderBottomRightRadius: '32px' }}>
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80" alt="Luxury fashion portrait" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(59,42,34,0.14) 100%)' }} />
          </div>
        </div>
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

      <section id="categories" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '0.75rem' }}>Curated for Every Wardrobe</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--text-primary)' }}>Shop by Category</h2>
            <div className="section-divider" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.35rem' }}>
            {[
              { to: '/products?category=Men', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&auto=format&fit=crop&q=80', label: "Men's Apparel", sub: 'Tailoring & Denim' },
              { to: '/products?category=Women', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80', label: "Women's Wear", sub: 'Dresses & Trousers' },
              { to: '/products?category=Kids', img: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=700&auto=format&fit=crop&q=80', label: 'Kids & Toddlers', sub: 'Fleece & Dungarees' },
              { to: '/products?category=Footwear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', label: 'Footwear', sub: 'Sneakers & Loafers' },
            ].map(({ to, img, label, sub }, index) => (
              <motion.div key={to} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.08 }}>
                <Link to={to} style={{ position: 'relative', display: 'block', height: '420px', overflow: 'hidden', textDecoration: 'none', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }} className="soft-card">
                  <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform 0.6s ease' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(44,24,16,0.86) 0%, rgba(44,24,16,0.2) 60%, rgba(44,24,16,0) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--bg-primary)', marginBottom: '0.3rem' }}>{label}</h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--beige)', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.05em' }}>{sub} <ArrowRight size={12} /></p>
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
