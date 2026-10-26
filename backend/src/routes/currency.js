import express from 'express';
import { getRates } from '../services/currencyService.js';

const router = express.Router();

// GET /api/currency/rates
// Returns cached USD-based exchange rates for PKR, EUR, GBP, AED, SAR
// Rates are updated automatically every 6 hours
router.get('/rates', async (req, res) => {
  try {
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    console.error('[Currency] Error retrieving rates:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve exchange rates',
      message: error.message
    });
  }
});

export default router;
