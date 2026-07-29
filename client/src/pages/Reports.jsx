import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getReports, downloadReport } from '../services/reportService';
import ThreatBadge from '../components/shared/ThreatBadge';
import Button from '../components/ui/Button';
import { formatDateTime, truncate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getReports()
      .then(res => setReports(res.data.reports))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (scanId, idx) => {
    setDownloading(idx);
    try {
      const res = await downloadReport(scanId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report-${scanId}.pdf`;
      link.click();
      toast.success('Report downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📊 <span className="text-gradient-cyber">Reports</span></h1>
        <p className="text-gray-500 text-sm mt-1">Download your security analysis reports</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-9 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reports.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, i) => (
            <motion.div key={report._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 space-y-4 hover:border-cyber-cyan/20 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm truncate" title={report.scan?.originalName || report.scan?.target}>
                    {truncate(report.scan?.originalName || report.scan?.target, 30)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{formatDateTime(report.createdAt)}</p>
                </div>
                <span className="text-2xl">{report.reportType === 'url' ? '🔗' : '📄'}</span>
              </div>

              <div className="flex items-center justify-between">
                <ThreatBadge level={report.scan?.threatLevel} size="sm" />
                <span className="text-xs font-mono" style={{ color: report.threatScore > 50 ? '#ff3366' : '#00ff88' }}>
                  Score: {report.threatScore}/100
                </span>
              </div>

              {report.summary && (
                <p className="text-gray-500 text-xs leading-relaxed">{truncate(report.summary, 80)}</p>
              )}

              <Button onClick={() => handleDownload(report.scan?._id, i)}
                loading={downloading === i} variant="outline" fullWidth size="sm">
                📥 Download PDF
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400 font-medium">No reports yet</p>
          <p className="text-gray-600 text-sm mt-2">Complete a scan and download its report to see it here</p>
        </div>
      )}
    </div>
  );
}
