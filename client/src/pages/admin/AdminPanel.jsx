import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAdminStats, getAdminUsers, deleteAdminUser } from '../../services/reportService';
import ThreatBadge from '../../components/shared/ThreatBadge';
import Button from '../../components/ui/Button';
import { formatDateTime, truncate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const StatBox = ({ label, value, icon, color = 'cyan' }) => {
  const colors = {
    cyan: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20',
    red: 'text-cyber-red bg-cyber-red/10 border-cyber-red/20',
    green: 'text-cyber-green bg-cyber-green/10 border-cyber-green/20',
    purple: 'text-cyber-purple-light bg-cyber-purple/10 border-cyber-purple/20',
  };
  return (
    <div className={`glass-card p-5 border ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${colors[color].split(' ')[0]}`}>{value}</p>
    </div>
  );
};

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data.users); })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    setDeleting(id);
    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deactivated');
    } catch {
      toast.error('Failed to deactivate user');
    } finally {
      setDeleting(null);
    }
  };

  const tabs = ['overview', 'users', 'scans', 'ai_status', 'logs'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">⚙️ Admin <span className="text-gradient-cyber">Panel</span></h1>
        <p className="text-gray-500 text-sm mt-1">Platform administration and monitoring</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Users" value={stats?.totalUsers ?? '—'} icon="👥" color="cyan" />
            <StatBox label="Total Scans" value={stats?.totalScans ?? '—'} icon="🔍" color="purple" />
            <StatBox label="Threats Detected" value={stats?.totalThreats ?? '—'} icon="☠️" color="red" />
            <StatBox label="Safe Analyses" value={(stats?.totalScans ?? 0) - (stats?.totalThreats ?? 0)} icon="✅" color="green" />
          </div>

          {/* Recent users */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">🆕 Recent Registrations</h3>
            <div className="space-y-3">
              {stats?.recentUsers?.map(user => (
                <div key={user._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-cyber-purple/20 text-cyber-purple-light' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>{user.role}</span>
                    <p className="text-gray-600 text-xs mt-1">{formatDateTime(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent scans */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">🔍 Recent Platform Scans</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    {['User', 'Type', 'Target', 'Threat Level', 'Date'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-left text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recentScans?.map(scan => (
                    <tr key={scan._id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4 text-gray-300">{scan.user?.name || 'Unknown'}</td>
                      <td className="py-3 pr-4"><span className="bg-white/5 px-2 py-0.5 rounded font-mono uppercase">{scan.type}</span></td>
                      <td className="py-3 pr-4 text-gray-400 font-mono">{truncate(scan.originalName || scan.target, 30)}</td>
                      <td className="py-3 pr-4"><ThreatBadge level={scan.threatLevel} size="sm" /></td>
                      <td className="py-3 text-gray-600">{formatDateTime(scan.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white font-semibold">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${user.role === 'admin' ? 'bg-cyber-purple/20 text-cyber-purple-light' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${user.isActive ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-red/10 text-cyber-red'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => handleDeleteUser(user._id)} disabled={deleting === user._id || user.role === 'admin'}
                        className="text-cyber-red hover:text-red-400 text-xs transition-colors disabled:opacity-30" title="Deactivate user">
                        {deleting === user._id ? '…' : '🚫 Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Status tab */}
      {activeTab === 'ai_status' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(stats?.aiStatus || [
            { name: 'URL Threat Classifier', status: 'online', accuracy: '97.3%', version: 'v2.1' },
            { name: 'Document Analyzer', status: 'online', accuracy: '95.8%', version: 'v1.8' },
          ]).map((model, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 border ${model.status === 'online' ? 'border-cyber-green/20' : 'border-cyber-red/20'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold">{model.name}</p>
                  <p className="text-gray-500 text-xs mt-1">Version {model.version}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${model.status === 'online' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-red/10 text-cyber-red'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${model.status === 'online' ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
                  {model.status === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Accuracy</span>
                <span className="text-cyber-cyan font-mono font-bold">{model.accuracy}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">🔔 Threat Logs</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats?.threatLogs?.map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${log.severity === 'critical' ? 'bg-cyber-red/20 text-cyber-red' : log.severity === 'high' ? 'bg-cyber-orange/20 text-cyber-orange' : 'bg-cyber-yellow/20 text-cyber-yellow'}`}>
                  {log.severity?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{log.threatType}</p>
                  <p className="text-gray-500 text-xs truncate">{log.description}</p>
                  <p className="text-gray-600 text-xs mt-1">User: {log.user?.email} — {formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            )) ?? <p className="text-gray-500 text-sm">No threat logs available</p>}
          </div>
        </div>
      )}

      {/* Scans tab placeholder */}
      {activeTab === 'scans' && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">All Platform Scans</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'Type', 'Target', 'Threat Level', 'Score', 'Date'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-left text-gray-500 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentScans?.map(scan => (
                  <tr key={scan._id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-gray-300 text-xs">{scan.user?.name || 'N/A'}</td>
                    <td className="py-3 pr-4"><span className="bg-white/5 px-2 py-0.5 rounded font-mono text-xs uppercase">{scan.type}</span></td>
                    <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{truncate(scan.originalName || scan.target, 30)}</td>
                    <td className="py-3 pr-4"><ThreatBadge level={scan.threatLevel} size="sm" /></td>
                    <td className="py-3 pr-4 font-mono text-sm" style={{ color: scan.threatScore > 50 ? '#ff3366' : '#00ff88' }}>{scan.threatScore}</td>
                    <td className="py-3 text-gray-500 text-xs">{formatDateTime(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
