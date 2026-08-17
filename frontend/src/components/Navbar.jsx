import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ShoppingBag, User, LogOut, Menu, X, LayoutDashboard, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`;

  return (
    <>
      <style>{`
        .nav-link { font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-secondary); text-decoration: none; padding-bottom: 2px; border-bottom: 1.5px solid transparent; transition: color 0.2s ease, border-color 0.2s ease; }
        .nav-link:hover, .nav-link-active { color: var(--brown-primary); border-bottom-color: var(--brown-primary); }
        .nav-cart-badge { position: absolute; top: -6px; right: -7px; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: var(--brown-primary); color: #fff; font-size: 9px; font-weight: 700; font-family: var(--font-sans); }
        .mobile-nav-link { display: block; padding: 0.75rem 1rem; font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary); text-decoration: none; border-bottom: 1px solid var(--border-subtle); transition: color 0.2s ease, background-color 0.2s ease; }
        .mobile-nav-link:hover, .mobile-nav-link-active { color: var(--brown-primary); background-color: rgba(111,78,55,0.08); }
        .icon-btn { display: flex; align-items: center; justify-content: center; padding: 0.4rem; color: var(--text-secondary); background: none; border: none; cursor: pointer; transition: color 0.2s ease; border-radius: 999px; }
        .icon-btn:hover { color: var(--brown-primary); background-color: rgba(111,78,55,0.08); }
      `}</style>

      <nav ref={navRef} style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', backgroundColor: 'rgba(247,242,235,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-color)', boxShadow: scrolled ? 'var(--shadow-md)' : 'none', transition: 'box-shadow 0.3s ease' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', height: '68px', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--brown-dark)', letterSpacing: '0.04em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--brown-primary)', flexShrink: 0 }} />
              TrendVibe
            </Link>

            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2.25rem' }}>
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/products" className={navLinkClass}>Collection</NavLink>
              <NavLink to="/about" className={navLinkClass}>Our Story</NavLink>
              <NavLink to="/support" className={navLinkClass}>Support</NavLink>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#6F4E37]/10 hover:bg-[#6F4E37]/20 text-[#6F4E37] border border-[#6F4E37]/30 transition-all cursor-pointer shadow-2xs hover:scale-105"
                title="Open AI Fashion Assistant"
              >
                <Sparkles size={13} className="text-[#8B5E3C] animate-pulse" />
                <span>AI Stylist</span>
              </button>
            </div>

            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '1.1rem' }}>
              <Link to="/cart" style={{ position: 'relative', display: 'inline-flex', color: 'var(--text-secondary)', transition: 'color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--brown-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'} aria-label="Shopping cart">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </Link>
              <span style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isAdmin && <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--olive)', textDecoration: 'none', transition: 'color 0.2s ease' }}><LayoutDashboard size={14} /><span>Admin</span></Link>}
                  <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--brown-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}><User size={15} /><span>{user.name.split(' ')[0]}</span></Link>
                  <button className="icon-btn" onClick={handleLogout} title="Sign Out" style={{ color: 'var(--text-muted)' }}><LogOut size={16} /></button>
                </div>
              ) : (
                <Link to="/login" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.7rem' }}>Sign In</Link>
              )}
            </div>

            <div className="flex md:hidden" style={{ alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6F4E37]/10 text-[#6F4E37] border border-[#6F4E37]/30"
              >
                <Sparkles size={12} className="text-[#8B5E3C]" />
                <span>AI</span>
              </button>
              <Link to="/cart" style={{ position: 'relative', display: 'inline-flex', color: 'var(--text-secondary)' }} aria-label="Shopping cart"><ShoppingBag size={20} />{cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}</Link>
              <button className="icon-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">{isOpen ? <X size={22} /> : <Menu size={22} />}</button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
            <NavLink to="/" end onClick={() => setIsOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' mobile-nav-link-active' : ''}`}>Home</NavLink>
            <NavLink to="/products" onClick={() => setIsOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' mobile-nav-link-active' : ''}`}>Collection</NavLink>
            <NavLink to="/about" onClick={() => setIsOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' mobile-nav-link-active' : ''}`}>Our Story</NavLink>
            <NavLink to="/support" onClick={() => setIsOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' mobile-nav-link-active' : ''}`}>Support</NavLink>
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('open-ai-chatbot'));
              }}
              className="mobile-nav-link flex items-center gap-2 text-[#6F4E37] font-semibold w-full text-left"
            >
              <Sparkles size={14} className="text-[#8B5E3C]" />
              <span>Ask AI Fashion Stylist</span>
            </button>

            <div style={{ padding: '1rem 1rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={14} /> {user.name}</span><span className="badge-luxury">{user.role}</span></div>
                  {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--olive)', textDecoration: 'none' }}><LayoutDashboard size={14} /> Admin Dashboard</Link>}
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}><User size={14} /> My Dashboard</Link>
                  <button className="btn-danger" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem 1rem' }}><LogOut size={14} /> Sign Out</button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem 1rem' }}>Sign In</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
