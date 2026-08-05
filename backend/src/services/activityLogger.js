import { insertActivityLog } from '../db.js';

/**
 * logActivity — fire-and-forget audit log helper.
 *
 * Never throws. Log failures are swallowed (with a console warning) so they
 * never block the HTTP response that triggered the action.
 *
 * @param {object} opts
 * @param {string}  opts.adminId   - ID of the admin performing the action
 * @param {string}  opts.adminName - Display name of the admin
 * @param {string}  opts.action    - Action constant, e.g. 'CREATE_PRODUCT'
 * @param {string}  opts.module    - Module/table name, e.g. 'products'
 * @param {string}  [opts.recordId]  - Primary key of the affected record
 * @param {object}  [opts.oldData]   - Snapshot BEFORE the change
 * @param {object}  [opts.newData]   - Snapshot AFTER the change
 * @param {string}  [opts.ipAddress] - Client IP address from req.ip
 */
export async function logActivity({ adminId, adminName, action, module, recordId, oldData, newData, ipAddress }) {
  try {
    await insertActivityLog({ adminId, adminName, action, module, recordId, oldData, newData, ipAddress });
  } catch (err) {
    // Log failures should never affect the actual API response
    console.warn(`⚠️ [ActivityLog] Failed to write log entry: ${err.message}`);
  }
}

/**
 * Convenience helper to extract the real client IP from an Express request,
 * handling reverse-proxy setups (X-Forwarded-For header).
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
