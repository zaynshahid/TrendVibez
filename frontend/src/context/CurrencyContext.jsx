import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { API_URL } from './AuthContext.jsx';

// ─── Currency metadata ──────────────────────────────────────────────────────
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar',          flag: '🇺🇸' },
  PKR: { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee',    flag: '🇵🇰' },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro',               flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£',   name: 'British Pound',      flag: '🇬🇧' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham',         flag: '🇦🇪' },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal',        flag: '🇸🇦' },
};

const STORAGE_KEY = 'tv_currency';
const DEFAULT_CURRENCY = 'USD';

// ─── Context ────────────────────────────────────────────────────────────────
const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY
  );
  const [rates, setRates] = useState({ USD: 1, PKR: 278.5, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75 });
  const [ratesLoaded, setRatesLoaded] = useState(false);

  // Fetch live rates once on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchRates() {
      try {
        const res = await fetch(`${API_URL}/currency/rates`);
        if (!res.ok) throw new Error('Rate fetch failed');
        const data = await res.json();
        if (!cancelled && data?.rates) {
          setRates(data.rates);
          setRatesLoaded(true);
        }
      } catch (err) {
        // Silently fall back to hardcoded rates already set as default state
        console.warn('[Currency] Using fallback rates:', err.message);
        setRatesLoaded(true);
      }
    }
    fetchRates();
    return () => { cancelled = true; };
  }, []);

  // Persist selection
  const setCurrency = useCallback((code) => {
    if (!CURRENCIES[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setCurrencyState(code);
  }, []);

  /**
   * Convert a price from USD to the selected currency.
   * DB prices are stored in USD.
   */
  const convert = useCallback((priceUsd) => {
    const rate = rates[currency] ?? 1;
    return parseFloat(priceUsd) * rate;
  }, [rates, currency]);

  /**
   * Format a USD price for display in the selected currency.
   * e.g. formatPrice(45) => "₨ 12,533" or "$45.00"
   */
  const formatPrice = useCallback((priceUsd) => {
    const converted = convert(priceUsd);
    const meta = CURRENCIES[currency];

    // PKR shows no decimal; USD/EUR/GBP show 2; AED/SAR show 2
    const decimals = currency === 'PKR' ? 0 : 2;

    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${meta.symbol}${formatted}`;
  }, [convert, currency]);

  const formatPriceWithCurrency = useCallback((priceUsd, currencyCode, currencyRate) => {
    const rate = currencyRate ?? 1;
    const converted = parseFloat(priceUsd) * rate;
    const meta = CURRENCIES[currencyCode] || CURRENCIES.USD;
    const decimals = currencyCode === 'PKR' ? 0 : 2;
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${meta.symbol}${formatted}`;
  }, []);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      ratesLoaded,
      convert,
      formatPrice,
      formatPriceWithCurrency,
      currencyMeta: CURRENCIES[currency],
      CURRENCIES,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
