import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import {
  Search,
  Calendar,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  Activity,
  Shield,
  Clock,
  User,
  Database,
  Globe,
  Mail
} from 'lucide-react';

export default function ActivityLogTab() {
  const { token } = useAuth();

  // Filter States
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Meta Options for Dropdowns
  const [metaActions, setMetaActions] = useState([]);
  const [metaAdmins, setMetaAdmins] = useState([]);

  // Data & UI States
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Log for Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch meta options (actions & admins)
  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/activity-logs/meta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetaActions(data.actions || []);
        setMetaAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity log meta:', err);
    }
  }, [token]);

  // Fetch paginated logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(actionFilter && { action: actionFilter }),
        ...(adminFilter && { adminId: adminFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      const res = await fetch(`${API_URL}/admin/activity-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to fetch activity logs (${res.status})`);
      }

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading activity logs');
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, actionFilter, adminFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Debounced search reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setAdminFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Helper for Action Badge Colors
  const getActionBadgeStyle = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'CREATE_PRODUCT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'UPDATE_PRODUCT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'DELETE_PRODUCT':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'UPDATE_ORDER_STATUS':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'DELETE_ORDER':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'UPDATE_USER_ROLE':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
      case 'DELETE_USER':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800';
      case 'UPDATE_PROFILE':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      case 'SEND_EMAIL':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  // Safe JSON parse helper
  const parseJsonData = (dataStr) => {
    if (!dataStr) return null;
    try {
      return typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brown-faint/70 dark:bg-[#34271f] p-6 rounded-3xl border border-brown-faint shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brown-primary" />
            <h2 className="text-xl font-bold text-brown-dark">Admin Activity Audit Logs</h2>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Comprehensive history of platform administrative operations, updates, and configuration actions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/90 text-brown-dark border border-brown-faint self-start sm:self-auto">
          <Database className="h-4 w-4 text-brown-primary" />
          <span>{total} Log Entries Recorded</span>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-brown-faint/70 p-5 rounded-3xl border border-brown-faint shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brown-primary" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-brown-faint bg-brown-faint/80 pl-9 pr-3 py-2 text-xs text-brown-dark focus:outline-none focus:border-brown-primary"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-brown-faint bg-brown-faint/80 px-3 py-2 text-xs text-brown-dark focus:outline-none focus:border-brown-primary"
            >
              <option value="">All Actions</option>
              {metaActions.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Admin Filter */}
          <div>
            <select
              value={adminFilter}
              onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-brown-faint bg-brown-faint/80 px-3 py-2 text-xs text-brown-dark focus:outline-none focus:border-brown-primary"
            >
              <option value="">All Admins</option>
              {metaAdmins.map((adm) => (
                <option key={adm.id} value={adm.id}>{adm.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1.5 rounded-xl border border-brown-faint bg-brown-faint/80 px-3 py-2">
            <span className="text-text-secondary text-[10px] uppercase font-bold">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full bg-transparent text-xs text-brown-dark focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5 rounded-xl border border-brown-faint bg-brown-faint/80 px-3 py-2">
            <span className="text-text-secondary text-[10px] uppercase font-bold">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full bg-transparent text-xs text-brown-dark focus:outline-none"
            />
          </div>
        </div>

        {/* Action Row: Reset Filter */}
        {(search || actionFilter || adminFilter || dateFrom || dateTo) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Activity Log Table */}
      <div className="payment-panel rounded-3xl border border-brown-faint shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-brown-primary" />
              <span className="text-xs text-brown-dark font-medium">Fetching audit trail...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-brown-dark">
            No activity log records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brown-faint/80 uppercase text-[10px] tracking-wider text-brown-primary font-bold border-b border-brown-faint">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-faint font-semibold text-brown-dark">
                {logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-brown-faint/60 dark:hover:bg-[#382916]/30 transition-colors">
                      <td className="px-6 py-4 text-brown-primary font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-brown-primary" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-brown-dark whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-brown-primary" />
                          <span>{log.adminName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-brown-primary capitalize">
                        {log.module}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-brown-primary max-w-[180px]">
                        {log.action === 'SEND_EMAIL' ? (() => {
                          const nd = parseJsonData(log.newData);
                          const recipient = nd?.recipient;
                          return recipient ? (
                            <div className="flex items-center gap-1.5" title={recipient}>
                              <Mail className="h-3 w-3 text-teal-500 shrink-0" />
                              <span className="truncate">{recipient}</span>
                            </div>
                          ) : <span className="truncate">{log.recordId || '-'}</span>;
                        })() : (
                          <span className="truncate" title={log.recordId || '-'}>{log.recordId || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-brown-primary hover:bg-brown-faint dark:text-brown-primary dark:hover:bg-[#34271f]/30 transition-colors inline-flex items-center justify-center"
                          title="View Log Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-brown-faint/70 border-t border-brown-faint text-xs font-semibold text-brown-primary">
          <div>
            Showing page <span className="font-bold text-brown-dark">{page}</span> of{' '}
            <span className="font-bold text-brown-dark">{totalPages}</span> ({total} entries total)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brown-faint bg-white hover:bg-brown-faint/60 text-brown-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brown-faint bg-white hover:bg-brown-faint/60 text-brown-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== DETAIL & JSON DIFF MODAL ==================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brown-faint bg-brown-faint/80">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brown-primary" />
                <div>
                  <h3 className="text-base font-bold text-brown-dark">Activity Audit Detail</h3>
                  <p className="text-[11px] text-brown-primary font-mono">Log ID #{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-full text-brown-dark hover:text-brown-primary hover:bg-brown-faint transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-2xl bg-brown-faint/80 border border-brown-faint space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brown-primary">Admin</span>
                  <div className="font-bold text-brown-dark truncate">{selectedLog.adminName}</div>
                  <div className="text-[10px] text-text-secondary font-mono truncate">{selectedLog.adminId}</div>
                </div>

                <div className="p-3 rounded-2xl bg-brown-faint/80 border border-brown-faint space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brown-primary">Action & Module</span>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getActionBadgeStyle(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div className="text-[10px] text-brown-primary font-mono capitalize">{selectedLog.module} module</div>
                </div>

                <div className="p-3 rounded-2xl bg-brown-faint/80 border border-brown-faint space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brown-primary">Target Record</span>
                  <div className="font-mono text-brown-dark truncate" title={selectedLog.recordId || 'N/A'}>
                    {selectedLog.recordId || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-brown-faint/80 border border-brown-faint space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brown-primary">IP & Time</span>
                  <div className="flex items-center gap-1 text-brown-dark font-mono text-[11px]">
                    <Globe className="h-3.5 w-3.5 text-brown-primary" />
                    <span>{selectedLog.ipAddress || 'unknown'}</span>
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* JSON Diff Side-by-Side Section */}
              {(selectedLog.oldData || selectedLog.newData) ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">State Snapshot Comparison</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Old Data */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 px-1">
                        <span>Previous State (oldData)</span>
                        {!selectedLog.oldData && <span className="text-slate-400 font-normal italic">None</span>}
                      </div>
                      <pre className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-64 whitespace-pre-wrap">
                        {selectedLog.oldData
                          ? JSON.stringify(parseJsonData(selectedLog.oldData), null, 2)
                          : '// No previous record state snapshot'}
                      </pre>
                    </div>

                    {/* New Data */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-1">
                        <span>New State (newData)</span>
                        {!selectedLog.newData && <span className="text-slate-400 font-normal italic">None</span>}
                      </div>
                      <pre className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-64 whitespace-pre-wrap">
                        {selectedLog.newData
                          ? JSON.stringify(parseJsonData(selectedLog.newData), null, 2)
                          : '// No new record state snapshot'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-450 italic text-center">
                  No state snapshots were recorded for this simple action.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
