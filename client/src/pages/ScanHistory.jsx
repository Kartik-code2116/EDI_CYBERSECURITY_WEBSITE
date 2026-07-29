import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getHistory, deleteScan } from '../services/reportService';
import { downloadReport } from '../services/reportService';
import ThreatBadge from '../components/shared/ThreatBadge';
import Button from '../components/ui/Button';
import { formatDateTime, truncate, formatFileSize } from '../utils/formatters';
import toast from 'react-hot-toast';

const TYPES = ['all', 'url', 'pdf', 'docx'];
const LEVELS = ['all', 'safe', 'warning', 'suspicious', 'malicious'];

export default function ScanHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Pre-populate filters from URL query params (set by dashboard chart clicks)
  const [typeFilter, setTypeFilter]   = useState(searchParams.get('type')        || 'all');
  const [levelFilter, setLevelFilter] = useState(searchParams.get('threatLevel') || 'all');
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (levelFilter !== 'all') params.threatLevel = levelFilter;
      const res = await getHistory(params);
      setScans(res.data.scans);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, levelFilter]);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scan?')) return;
    setDeleting(id);
    try {
      await deleteScan(id);
      toast.success('Scan deleted');
      fetchHistory(pagination.page);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res = await downloadReport(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report-${id}.pdf`;
      link.click();
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📋 Scan <span className="text-gradient-cyber">History</span></h1>
        <p className="text-gray-500 text-sm mt-1">All your past security analyses in one place</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text" placeholder="Search by URL or filename…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-cyber pl-9 h-10 text-sm"
            />
          </div>
          {/* Type filter */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="input-cyber h-10 text-sm px-3 w-auto">
            {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>)}
          </select>
          {/* Level filter */}
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className="input-cyber h-10 text-sm px-3 w-auto">
            {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Type', 'Target', 'Threat Level', 'Score', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : scans.length ? scans.map((scan) => (
                <motion.tr key={scan._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(scan.createdAt)}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300 font-mono uppercase">{scan.type}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-300 text-xs font-mono max-w-xs truncate" title={scan.originalName || scan.target}>
                    {truncate(scan.originalName || scan.target, 40)}
                  </td>
                  <td className="px-4 py-4"><ThreatBadge level={scan.threatLevel} size="sm" /></td>
                  <td className="px-4 py-4 font-mono text-sm"
                    style={{ color: scan.threatScore > 75 ? '#ff3366' : scan.threatScore > 50 ? '#ff8800' : scan.threatScore > 25 ? '#ffcc00' : '#00ff88' }}>
                    {scan.threatScore}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${scan.status === 'completed' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-red/10 text-cyber-red'}`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownload(scan._id)} disabled={downloading === scan._id}
                        className="text-cyber-cyan hover:text-cyan-300 text-xs transition-colors disabled:opacity-50" title="Download Report">
                        {downloading === scan._id ? '…' : '📥'}
                      </button>
                      <button onClick={() => handleDelete(scan._id)} disabled={deleting === scan._id}
                        className="text-cyber-red hover:text-red-400 text-xs transition-colors disabled:opacity-50" title="Delete">
                        {deleting === scan._id ? '…' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400">No scans found</p>
                    <p className="text-gray-600 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="px-4 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-gray-500 text-xs">Total: {pagination.total} scans</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={pagination.page === 1}
                onClick={() => fetchHistory(pagination.page - 1)}>← Prev</Button>
              <span className="text-gray-500 text-xs px-2">{pagination.page} / {pagination.pages}</span>
              <Button size="sm" variant="ghost" disabled={pagination.page === pagination.pages}
                onClick={() => fetchHistory(pagination.page + 1)}>Next →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
