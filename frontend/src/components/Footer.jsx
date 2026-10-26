import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--brown-dark)', color: 'var(--beige-light)', borderTop: '1px solid rgba(221,209,195,0.14)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(221,209,195,0.16)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--bg-primary)', letterSpacing: '0.04em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coffee)', display: 'inline-block', flexShrink: 0 }} />
              TrendVibe
            </Link>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', lineHeight: '1.8', color: 'var(--warm-gray)', maxWidth: '220px' }}>Curating premium clothing with timeless silhouettes, natural textures, and understated luxury.</p>
            <div style={{ width: '32px', height: '2px', background: 'var(--coffee)' }} />
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '1.25rem' }}>Shop Collections</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[{ to: '/products?category=Men', label: "Men's Fashion" }, { to: '/products?category=Women', label: "Women's Wear" }, { to: '/products?category=Kids', label: 'Kids & Infants' }, { to: '/products?category=Watches', label: 'Watches & Timepieces' }, { to: '/products?category=Footwear', label: 'Footwear' }, { to: '/products', label: 'All Products' }].map(({ to, label }) => (
                <li key={to}><Link to={to} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--beige)', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--bg-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--beige)'}>{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '1.25rem' }}>Customer Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { to: '/about', label: 'Our Story', isLink: true },
                { to: '/support', label: 'Help & Support', isLink: true },
                { label: 'Free 30-Day Returns' },
                { label: 'Standard Shipping: 3–5 days' }
              ].map(({ to, label, isLink }, i) => isLink ? <li key={i}><Link to={to} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--beige)', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--bg-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--beige)'}>{label}</Link></li> : <li key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--warm-gray)' }}>{label}</li>)}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '1.25rem' }}>Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[{ icon: <MapPin size={13} />, text: '123 Fashion Ave, NY 10001' }, { icon: <Phone size={13} />, text: '+1 (800) 555-8423' }, { icon: <Mail size={13} />, text: 'support@trendvibe.com' }].map(({ icon, text }, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--warm-gray)' }}><span style={{ color: 'var(--coffee)', marginTop: '1px', flexShrink: 0 }}>{icon}</span>{text}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingTop: '1.75rem' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--warm-gray)' }}>&copy; {new Date().getFullYear()} TrendVibe. All rights reserved.</p>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--warm-gray)', border: '1px solid rgba(221,209,195,0.2)', padding: '0.2rem 0.6rem' }}>Simulated Checkout Active</span>
        </div>
      </div>
    </footer>
  );
}
