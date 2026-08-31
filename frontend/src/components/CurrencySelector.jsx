import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext.jsx';

export default function CurrencySelector() {
  const { currency, setCurrency, currencyMeta } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <style>{`
        .currency-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.55rem;
          background: rgba(111,78,55,0.08);
          border: 1px solid rgba(111,78,55,0.2);
          border-radius: 999px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--brown-primary);
          transition: background 0.18s ease, border-color 0.18s ease;
          white-space: nowrap;
        }
        .currency-btn:hover {
          background: rgba(111,78,55,0.15);
          border-color: rgba(111,78,55,0.35);
        }
        .currency-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 200;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(44,24,16,0.14);
          padding: 0.5rem;
          min-width: 180px;
          animation: fadeIn 0.12s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .currency-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: background 0.15s ease, color 0.15s ease;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .currency-option:hover { background: rgba(111,78,55,0.08); color: var(--brown-primary); }
        .currency-option.active { background: rgba(111,78,55,0.1); color: var(--brown-primary); }
        .currency-option .symbol { font-weight: 800; color: var(--brown-primary); min-width: 22px; font-size: 0.82rem; }
        .currency-option .label { flex: 1; }
        .currency-option .check { color: var(--brown-primary); font-size: 0.7rem; }
      `}</style>

      <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          className="currency-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label="Select currency"
          aria-expanded={open}
          title="Change currency"
        >
          <span>{currencyMeta.flag}</span>
          <span>{currency}</span>
          <ChevronDown
            size={11}
            style={{
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </button>

        {open && (
          <div className="currency-dropdown" role="listbox" aria-label="Currency options">
            {Object.values(CURRENCIES).map((c) => (
              <button
                key={c.code}
                role="option"
                aria-selected={c.code === currency}
                className={`currency-option${c.code === currency ? ' active' : ''}`}
                onClick={() => { setCurrency(c.code); setOpen(false); }}
              >
                <span className="symbol">{c.symbol.trim()}</span>
                <span className="label">{c.name}</span>
                <span style={{ fontSize: '0.9rem' }}>{c.flag}</span>
                {c.code === currency && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
