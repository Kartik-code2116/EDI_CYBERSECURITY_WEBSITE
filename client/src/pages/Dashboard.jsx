import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getStats } from '../services/reportService';
import StatCard from '../components/shared/StatCard';
import ThreatDistributionChart from '../components/charts/ThreatDistributionChart';
import ScanHistoryChart from '../components/charts/ScanHistoryChart';
import ThreatSeverityChart from '../components/charts/ThreatSeverityChart';
import WeeklyActivityChart from '../components/charts/WeeklyActivityChart';
import ThreatBadge from '../components/shared/ThreatBadge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatDateTime, truncate } from '../utils/formatters';
import toast from 'react-hot-toast';

// Simple icon components
const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const LinkIcon  = ({ className }) => <Icon className={className} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />;
const DocIcon   = ({ className }) => <Icon className={className} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
const ShieldIcon= ({ className }) => <Icon className={className} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
const CheckIcon = ({ className }) => <Icon className={className} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />;

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-white">
            Welcome back, <span className="text-gradient-cyber">{user?.name}</span> 👋
          </motion.h1>
          <p className="text-gray-500 text-sm mt-1">Here's your real-time security overview</p>
        </div>
        <div className="flex gap-3">
          <Link to="/analyze/url"
            className="btn-cyber text-white text-sm px-4 py-2 rounded-xl inline-flex items-center gap-2">
            🔗 Analyze URL
          </Link>
          <Link to="/analyze/document"
            className="btn-outline-cyber text-sm px-4 py-2 rounded-xl inline-flex items-center gap-2">
            📄 Upload Doc
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={LinkIcon}   title="URLs Scanned"       value={data?.stats?.urls    ?? 0} subtitle="Total URL analyses"     color="cyan"   index={0} />
            <StatCard icon={DocIcon}    title="Documents Scanned"  value={data?.stats?.docs    ?? 0} subtitle="PDF & DOCX files"        color="purple" index={1} />
            <StatCard icon={ShieldIcon} title="Threats Detected"   value={data?.stats?.threats ?? 0} subtitle="Suspicious + Malicious"  color="red"    index={2} />
            <StatCard icon={CheckIcon}  title="Safe Analyses"      value={data?.stats?.safe    ?? 0} subtitle="Safe + Warning"          color="green"  index={3} />
          </>
        )}
      </div>

      {/* Charts — all receive real data; each handles its own empty state */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Distribution — click slice → /history?threatLevel=x */}
        <ThreatDistributionChart data={data?.threatDist ?? []} />

        {/* Weekly Activity — click → /history */}
        <WeeklyActivityChart data={data?.weeklyActivity ?? []} />

        {/* Scan History 30-day — click → /history */}
        <ScanHistoryChart data={data?.scanHistory30Days ?? []} />

        {/* Threat Severity Radar — click type → /history?type=x */}
        <ThreatSeverityChart data={data?.threatSeverity ?? []} />
      </div>

      {/* Recent scans */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Recent Scans</h3>
          <Link to="/history" className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.recentScans?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  {['Type', 'Target', 'Threat Level', 'Score', 'Date'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentScans.map((scan) => (
                  <tr key={scan._id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-lg">
                        {scan.type === 'url' ? '🔗' : scan.type === 'pdf' ? '📄' : '📝'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-300 font-mono text-xs">
                      {truncate(scan.originalName || scan.target, 35)}
                    </td>
                    <td className="py-3 pr-4">
                      <ThreatBadge level={scan.threatLevel} size="sm" />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-sm"
                        style={{ color: scan.threatScore > 75 ? '#ff3366' : scan.threatScore > 50 ? '#ff8800' : scan.threatScore > 25 ? '#ffcc00' : '#00ff88' }}>
                        {scan.threatScore}/100
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{formatDateTime(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🛡️</div>
            <p className="text-gray-400 font-medium">No scans yet</p>
            <p className="text-gray-600 text-sm mt-1">Run your first analysis to see results here</p>
            <Link to="/analyze/url"
              className="btn-cyber text-white text-sm px-4 py-2 rounded-xl inline-flex items-center gap-2 mt-4">
              Start Scanning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
