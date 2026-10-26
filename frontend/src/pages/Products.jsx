import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, ArrowUpDown, Loader2, X,
  Star, PackageCheck, DollarSign, RotateCcw, Ruler
} from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { API_URL } from '../context/AuthContext.jsx';
import { getSubcategoriesForCategory } from '../constants/categories.js';

// ─── Utility ────────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? '' : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', transition: 'transform 0.15s ease' }}
          title={`${star}+ stars`}
        >
          <Star
            size={18}
            style={{
              fill: star <= (hovered || value) ? '#C4953A' : 'var(--beige)',
              color: star <= (hovered || value) ? '#C4953A' : 'var(--beige)',
              transition: 'fill 0.15s ease, color 0.15s ease',
            }}
          />
        </button>
      ))}
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: value ? '#C4953A' : 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>
        {value ? `${value}+ stars` : 'Any'}
      </span>
    </div>
  );
}

// ─── Active Filter Chip ──────────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        background: 'rgba(111,78,55,0.08)',
        border: '1px solid rgba(111,78,55,0.2)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: 'var(--brown-primary)',
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: 'var(--brown-primary)', opacity: 0.7 }}
        aria-label={`Remove ${label} filter`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState('');
  const [draftInStock, setDraftInStock] = useState(false);
  const [draftSize, setDraftSize] = useState('');
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sizeOptionsLoaded, setSizeOptionsLoaded] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const activeCategory    = searchParams.get('category')    || 'All';
  const activeSubcategory = searchParams.get('subcategory') || '';
  const activeSort        = searchParams.get('sort')        || 'newest';
  const activeQuery       = searchParams.get('q')           || '';
  const activeMinPrice    = searchParams.get('minPrice')    || '';
  const activeMaxPrice    = searchParams.get('maxPrice')    || '';
  const activeMinRating   = searchParams.get('minRating')   || '';
  const activeInStock     = searchParams.get('inStock')     || '';
  const activeSize        = searchParams.get('size')        || '';

  useEffect(() => {
    setDraftMinPrice(activeMinPrice);
    setDraftMaxPrice(activeMaxPrice);
    setDraftMinRating(activeMinRating);
    setDraftInStock(activeInStock === 'true');
    setDraftSize(activeSize);
  }, [activeMinPrice, activeMaxPrice, activeMinRating, activeInStock, activeSize]);

  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoading(true);
      try {
        const queryParts = [];
        if (activeCategory && activeCategory !== 'All') queryParts.push(`category=${encodeURIComponent(activeCategory)}`);
        if (activeSubcategory) queryParts.push(`subcategory=${encodeURIComponent(activeSubcategory)}`);
        if (activeQuery) queryParts.push(`q=${encodeURIComponent(activeQuery)}`);
        if (activeSort) queryParts.push(`sort=${encodeURIComponent(activeSort)}`);
        if (activeMinPrice !== '') queryParts.push(`minPrice=${encodeURIComponent(activeMinPrice)}`);
        if (activeMaxPrice !== '') queryParts.push(`maxPrice=${encodeURIComponent(activeMaxPrice)}`);
        if (activeMinRating !== '') queryParts.push(`minRating=${encodeURIComponent(activeMinRating)}`);
        if (activeInStock === 'true') queryParts.push(`inStock=true`);
        if (activeSize !== '') queryParts.push(`size=${encodeURIComponent(activeSize)}`);
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const res = await fetch(`${API_URL}/products${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredProducts();
  }, [activeCategory, activeSubcategory, activeSort, activeQuery, activeMinPrice, activeMaxPrice, activeMinRating, activeInStock, activeSize]);

  useEffect(() => {
    async function fetchSizeOptions() {
      setSizeOptionsLoaded(false);
      try {
        const queryString = activeCategory && activeCategory !== 'All'
          ? `?category=${encodeURIComponent(activeCategory)}`
          : '';
        const res = await fetch(`${API_URL}/products/meta/sizes${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setSizeOptions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load size filter options:', err);
        setSizeOptions([]);
      } finally {
        setSizeOptionsLoaded(true);
      }
    }
    fetchSizeOptions();
  }, [activeCategory]);

  useEffect(() => {
    if (activeSize && sizeOptionsLoaded && !sizeOptions.some(size => size.toLowerCase() === activeSize.toLowerCase())) {
      updateParam('size', '');
    }
  }, [activeSize, sizeOptions, sizeOptionsLoaded]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === 'All' || value === '' || value === 'false') newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('q', searchTerm);
  };

  const applyAdvancedFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    if (draftMinPrice !== '') newParams.set('minPrice', draftMinPrice); else newParams.delete('minPrice');
    if (draftMaxPrice !== '') newParams.set('maxPrice', draftMaxPrice); else newParams.delete('maxPrice');
    if (draftMinRating !== '') newParams.set('minRating', draftMinRating); else newParams.delete('minRating');
    if (draftInStock) newParams.set('inStock', 'true'); else newParams.delete('inStock');
    if (draftSize !== '') newParams.set('size', draftSize); else newParams.delete('size');
    setSearchParams(newParams);
  };

  const resetAdvancedFilters = () => {
    setDraftMinPrice(''); setDraftMaxPrice(''); setDraftMinRating(''); setDraftInStock(false); setDraftSize('');
    const newParams = new URLSearchParams(searchParams);
    ['minPrice','maxPrice','minRating','inStock','size'].forEach(k => newParams.delete(k));
    setSearchParams(newParams);
  };

  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setDbCategories(data.map(c => c.name));
        }
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    }
    fetchCategories();
  }, []);

  const resetAllFilters = () => {
    setSearchTerm(''); setDraftMinPrice(''); setDraftMaxPrice(''); setDraftMinRating(''); setDraftInStock(false); setDraftSize('');
    setSearchParams({});
  };

  const defaultCategoryList = ['All', 'Men', 'Women', 'Kids', 'Watches', 'Footwear'];
  const allCategoryOptions = ['All'];
  const categorySet = new Set(['all']);
  
  [...defaultCategoryList.slice(1), ...dbCategories].forEach(c => {
    if (c && typeof c === 'string') {
      const trimmed = c.trim();
      const lower = trimmed.toLowerCase();
      if (!categorySet.has(lower)) {
        categorySet.add(lower);
        allCategoryOptions.push(trimmed);
      }
    }
  });

  const activeFilterChips = [];
  if (activeQuery) activeFilterChips.push({ label: `"${activeQuery}"`, key: 'q' });
  if (activeCategory !== 'All') activeFilterChips.push({ label: activeCategory, key: 'category' });
  if (activeSubcategory) activeFilterChips.push({ label: `Type: ${activeSubcategory}`, key: 'subcategory' });
  if (activeMinPrice) activeFilterChips.push({ label: `Min $${activeMinPrice}`, key: 'minPrice' });
  if (activeMaxPrice) activeFilterChips.push({ label: `Max $${activeMaxPrice}`, key: 'maxPrice' });
  if (activeMinRating) activeFilterChips.push({ label: `${activeMinRating}+ ★`, key: 'minRating' });
  if (activeInStock === 'true') activeFilterChips.push({ label: 'In Stock', key: 'inStock' });
  if (activeSize) activeFilterChips.push({ label: `Size: ${activeSize}`, key: 'size' });

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    padding: '0.55rem 0.75rem',
    outline: 'none',
  };

  return (
    <div className="animate-slide-up" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        .products-input:focus { border-color: var(--brown-primary); box-shadow: 0 0 0 3px rgba(111,78,55,0.1); }
        .cat-tab { font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 999px; transition: all 0.2s ease; }
        .cat-tab-active { background: var(--brown-primary) !important; color: #ffffff !important; border-color: var(--brown-primary) !important; box-shadow: 0 4px 14px rgba(111,78,55,0.25); }
        .sort-select { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.75rem; padding: 0.5rem 0.75rem; outline: none; cursor: pointer; }
        .sort-select:focus { border-color: var(--brown-primary); }
      `}</style>

      {/* ── Top Category Header Banner ───────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '2.5rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Title & Top Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(111,78,55,0.08)', borderRadius: '999px', marginBottom: '0.5rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-primary)' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown-primary)' }}>
                  {activeCategory !== 'All' ? `${activeCategory} Collection` : 'All Collections'}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--brown-dark)', letterSpacing: '-0.02em', margin: 0 }}>
                {activeCategory !== 'All' ? `${activeCategory}'s Collection` : 'The Clothing Collection'}
              </h1>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                Discover our curated range of luxury apparel & modern wardrobe essentials.
              </p>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '340px', position: 'relative' }}>
              <input
                id="collection-search-input"
                type="text"
                placeholder="Search collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="products-input"
                style={{
                  ...inputStyle,
                  borderRadius: '999px',
                  paddingLeft: '1.1rem',
                  paddingRight: '2.5rem',
                  height: '42px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--brown-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.2rem',
                }}
                aria-label="Search collection"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Categories Navigation Bar On Top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Select Category
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Showing items for: <strong style={{ color: 'var(--brown-primary)' }}>{activeCategory}</strong>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                overflowX: 'auto',
                paddingBottom: '0.4rem',
                scrollbarWidth: 'none',
              }}
            >
              {allCategoryOptions.map((cat) => {
                const isActive = (activeCategory.toLowerCase() === cat.toLowerCase()) || (activeCategory === 'All' && cat === 'All');
                return (
                  <button
                    key={cat}
                    id={`top-cat-${cat.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      if (cat === 'All' || !cat) {
                        newParams.delete('category');
                      } else {
                        newParams.set('category', cat);
                      }
                      newParams.delete('subcategory');
                      setSearchParams(newParams);
                    }}
                    className={`cat-tab ${isActive ? 'cat-tab-active' : ''}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      background: isActive ? 'var(--brown-primary)' : 'var(--bg-primary)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)',
                    }}
                  >
                    <span>{cat}</span>
                    {isActive && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subcategory Pills Bar (Shown when a category is selected) */}
            {activeCategory !== 'All' && getSubcategoriesForCategory(activeCategory).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
                    Type / Subcategory:
                  </span>
                  <button
                    type="button"
                    onClick={() => updateParam('subcategory', '')}
                    style={{
                      padding: '0.3rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: !activeSubcategory ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)',
                      background: !activeSubcategory ? 'rgba(111,78,55,0.12)' : 'var(--bg-primary)',
                      color: !activeSubcategory ? 'var(--brown-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All {activeCategory}
                  </button>
                  {getSubcategoriesForCategory(activeCategory).map(sub => {
                    const isSubActive = activeSubcategory.toLowerCase() === sub.toLowerCase();
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateParam('subcategory', isSubActive ? '' : sub)}
                        style={{
                          padding: '0.3rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSubActive ? '1px solid var(--brown-primary)' : '1px solid var(--border-color)',
                          background: isSubActive ? 'var(--brown-primary)' : 'var(--bg-primary)',
                          color: isSubActive ? '#ffffff' : 'var(--text-secondary)',
                          boxShadow: isSubActive ? '0 2px 8px rgba(111,78,55,0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Body ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Filter Sidebar ──────────────────────────────────── */}
          <aside>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                position: 'sticky',
                top: '80px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Refine</h2>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Narrow your results</p>
                </div>
                <button
                  onClick={resetAdvancedFilters}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Categories */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Category</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {allCategoryOptions.map((cat) => {
                      const isActive = (activeCategory.toLowerCase() === cat.toLowerCase()) || (activeCategory === 'All' && cat === 'All');
                      return (
                        <button
                          key={cat}
                          id={`sidebar-cat-${cat.toLowerCase()}`}
                          type="button"
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            if (cat === 'All' || !cat) {
                              newParams.delete('category');
                            } else {
                              newParams.set('category', cat);
                            }
                            newParams.delete('subcategory');
                            setSearchParams(newParams);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--brown-primary)' : 'var(--text-secondary)',
                            background: isActive ? 'rgba(111,78,55,0.08)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{cat}</span>
                          {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-primary)' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <DollarSign size={13} style={{ color: 'var(--brown-primary)' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Price Range</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>$</span>
                      <input
                        id="filter-min-price"
                        type="number" min="0" placeholder="Min"
                        value={draftMinPrice}
                        onChange={(e) => setDraftMinPrice(e.target.value)}
                        className="products-input"
                        style={{ ...inputStyle, paddingLeft: '1.25rem' }}
                      />
                    </div>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>–</span>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>$</span>
                      <input
                        id="filter-max-price"
                        type="number" min="0" placeholder="Max"
                        value={draftMaxPrice}
                        onChange={(e) => setDraftMaxPrice(e.target.value)}
                        className="products-input"
                        style={{ ...inputStyle, paddingLeft: '1.25rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <Star size={13} style={{ color: '#C4953A' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Min Rating</span>
                  </div>
                  <StarRating
                    value={draftMinRating ? parseInt(draftMinRating) : 0}
                    onChange={(v) => setDraftMinRating(v === 0 ? '' : String(v))}
                  />
                </div>

                {/* Size */}
                {(sizeOptions.length > 0 || draftSize) && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <Ruler size={13} style={{ color: 'var(--brown-primary)' }} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Size</span>
                    </div>
                    <select
                      id="filter-size-select"
                      value={draftSize}
                      onChange={(e) => setDraftSize(e.target.value)}
                      className="products-input"
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Any size</option>
                      {sizeOptions.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* In Stock */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <PackageCheck size={13} style={{ color: 'var(--olive)' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Availability</span>
                  </div>
                  <button
                    id="filter-in-stock-toggle"
                    type="button"
                    onClick={() => setDraftInStock((v) => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      width: '100%', padding: '0.6rem 0.75rem',
                      background: draftInStock ? 'rgba(109,119,83,0.1)' : 'var(--bg-primary)',
                      border: `1px solid ${draftInStock ? 'rgba(109,119,83,0.4)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: draftInStock ? 'var(--olive)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Toggle pill */}
                    <span style={{ position: 'relative', display: 'inline-flex', width: 32, height: 18, borderRadius: 9, background: draftInStock ? 'var(--olive)' : 'var(--beige)', transition: 'background 0.2s ease', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 3, left: draftInStock ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </span>
                    In Stock Only
                  </button>
                </div>
              </div>

              <button
                id="apply-filters-btn"
                onClick={applyAdvancedFilters}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', padding: '0.65rem 1rem' }}
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* ── Products Grid ───────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
                <select
                  id="sort-select"
                  value={activeSort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active:</span>
                {activeFilterChips.map(({ label, key }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    onRemove={() => { if (key === 'q') setSearchTerm(''); updateParam(key, ''); }}
                  />
                ))}
                {activeFilterChips.length > 1 && (
                  <button
                    onClick={resetAllFilters}
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '0.25rem' }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 size={28} style={{ color: 'var(--brown-primary)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading collection…</span>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '5rem 2rem',
                  border: '1px dashed var(--beige)',
                  background: 'var(--bg-card)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No products found</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try adjusting your filters or search terms.</p>
                <button onClick={resetAllFilters} className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
