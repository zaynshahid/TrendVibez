import express from 'express';

const router = express.Router();

// Simple in-memory cache for exchange rates
let rateCache = null;
let rateCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// GET /api/currency/rates
// Returns live USD-based exchange rates for PKR, EUR, GBP, AED, SAR
router.get('/rates', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached rates if fresh
    if (rateCache && (now - rateCacheTime) < CACHE_TTL_MS) {
      return res.json(rateCache);
    }

    // Fetch from open.er-api.com (free, no key required)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('Exchange rate API returned unsuccessful result');
    }

    // Only include the currencies we support
    const SUPPORTED = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
    const filteredRates = {};
    for (const code of SUPPORTED) {
      filteredRates[code] = data.rates[code] ?? 1;
    }

    rateCache = {
      base: 'USD',
      rates: filteredRates,
      fetchedAt: new Date().toISOString()
    };
    rateCacheTime = now;

    res.json(rateCache);
  } catch (error) {
    console.error('[Currency] Failed to fetch exchange rates:', error.message);

    // If we have stale cache, return it rather than fail
    if (rateCache) {
      return res.json({ ...rateCache, stale: true });
    }

    // Ultimate fallback: hardcoded approximate rates
    res.json({
      base: 'USD',
      rates: {
        USD: 1,
        PKR: 278.5,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        SAR: 3.75
      },
      fallback: true
    });
  }
});

export default router;
