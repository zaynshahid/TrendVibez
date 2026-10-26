import { fetchLiveRates } from './currencyService.js';

let schedulerId = null;

/**
 * Start the currency rate scheduler
 * Updates rates every 6 hours
 */
export function startCurrencyScheduler() {
  console.log('[Scheduler] Starting currency rate scheduler (updates every 6 hours)');

  // Fetch rates immediately on startup
  fetchLiveRates().then(() => {
    console.log('[Scheduler] Initial currency rates fetched');
  }).catch(err => {
    console.error('[Scheduler] Failed to fetch initial rates:', err.message);
  });

  // Schedule updates every 6 hours (6 * 60 * 60 * 1000 milliseconds)
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  
  schedulerId = setInterval(async () => {
    try {
      console.log(`[Scheduler] Updating currency rates at ${new Date().toISOString()}`);
      await fetchLiveRates();
    } catch (error) {
      console.error('[Scheduler] Error during scheduled rate update:', error.message);
    }
  }, SIX_HOURS_MS);

  return schedulerId;
}

/**
 * Stop the currency rate scheduler
 */
export function stopCurrencyScheduler() {
  if (schedulerId) {
    clearInterval(schedulerId);
    console.log('[Scheduler] Currency rate scheduler stopped');
    schedulerId = null;
  }
}
