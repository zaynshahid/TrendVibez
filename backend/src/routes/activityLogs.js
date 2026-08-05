import express from 'express';
import { getActivityLogs, getActivityLogsMeta } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/activity-logs
 * Returns a paginated, filtered list of all admin activity log entries.
 *
 * Query params:
 *   page     - page number (default: 1)
 *   limit    - records per page (default: 20, max: 100)
 *   search   - full-text search across adminName, action, module, recordId
 *   action   - filter by exact action string
 *   adminId  - filter by admin user ID
 *   dateFrom - ISO date string lower bound (inclusive)
 *   dateTo   - ISO date string upper bound (inclusive, adds 1 day internally)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', action = '', adminId = '', dateFrom = '', dateTo = '' } = req.query;

    // Cap limit at 100 to prevent huge payloads
    const safeLimitNum = Math.min(parseInt(limit) || 20, 100);

    const result = await getActivityLogs({
      page: parseInt(page) || 1,
      limit: safeLimitNum,
      search: search.trim(),
      action: action.trim(),
      adminId: adminId.trim(),
      dateFrom: dateFrom.trim(),
      dateTo: dateTo.trim()
    });

    res.json(result);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * GET /api/admin/activity-logs/meta
 * Returns the distinct action types and admin users present in the logs.
 * Used to populate the filter dropdowns in the frontend.
 */
router.get('/meta', requireAdmin, async (req, res) => {
  try {
    const meta = await getActivityLogsMeta();
    res.json(meta);
  } catch (error) {
    console.error('Get activity logs meta error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
