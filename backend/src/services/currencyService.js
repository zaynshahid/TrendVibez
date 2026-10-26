import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATES_FILE = path.join(__dirname, '../../data/rates.json');

const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const FALLBACK_RATES = {
  USD: 1,
  PKR: 278.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75
};

/**
 * Read rates from JSON file
 */
export function readRates() {
  try {
    if (fs.existsSync(RATES_FILE)) {
      const data = fs.readFileSync(RATES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[Currency] Error reading rates file:', err.message);
  }
  return getDefaultRates();
}

/**
 * Write rates to JSON file
 */
function writeRates(ratesData) {
  try {
    fs.writeFileSync(RATES_FILE, JSON.stringify(ratesData, null, 2));
    console.log('[Currency] Rates updated successfully at', new Date().toISOString());
  } catch (err) {
    console.error('[Currency] Error writing rates file:', err.message);
  }
}

/**
 * Get default rates object
 */
function getDefaultRates() {
  return {
    base: 'USD',
    rates: FALLBACK_RATES,
    updatedAt: new Date().toISOString(),
    source: 'fallback'
  };
}

/**
 * Fetch live rates from exchange API
 */
export async function fetchLiveRates() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('API returned unsuccessful result');
    }

    // Filter to supported currencies
    const filteredRates = {};
    for (const code of SUPPORTED_CURRENCIES) {
      filteredRates[code] = data.rates[code] ?? 1;
    }

    const ratesData = {
      base: 'USD',
      rates: filteredRates,
      updatedAt: new Date().toISOString(),
      source: 'open.er-api.com'
    };

    // Write to file
    writeRates(ratesData);
    return ratesData;
  } catch (error) {
    console.error('[Currency] Failed to fetch live rates:', error.message);
    
    // Return current cached rates if fetch fails
    const cached = readRates();
    return {
      ...cached,
      fetchError: true,
      fetchErrorMessage: error.message
    };
  }
}

/**
 * Check if rates are stale (older than 6 hours)
 */
export function isRatesStale(ratesData) {
  const updatedAt = new Date(ratesData.updatedAt);
  const now = new Date();
  const ageMs = now - updatedAt;
  const sixHoursMs = 6 * 60 * 60 * 1000;
  return ageMs > sixHoursMs;
}

/**
 * Get rates - read from cache, update if stale (older than 6 hours)
 */
export async function getRates() {
  const cached = readRates();
  
  // Log age of rates
  const ageMinutes = Math.round((new Date() - new Date(cached.updatedAt)) / 60000);
  console.log(`[Currency] Serving rates from ${cached.source} (${ageMinutes} min old)`);
  
  // Auto-refresh if stale — don't await so the current request gets served immediately
  if (isRatesStale(cached)) {
    console.log('[Currency] Rates are stale (>6h), triggering background refresh...');
    fetchLiveRates().catch(err => console.error('[Currency] Background refresh failed:', err.message));
  }

  return cached;
}
