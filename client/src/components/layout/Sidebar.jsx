import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/analyze/url',      icon: '🔗', label: 'URL Analyzer'   },
  { to: '/analyze/document', icon: '📄', label: 'Doc Analyzer'   },
  { to: '/analyze/image',    icon: '🖼️', label: 'Image Analyzer' },
  { to: '/history', icon: '📋', label: 'Scan History' },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col"
      style={{ background: 'rgba(10,22,40,0.8)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>🛡️</div>
          <div>
            <p className="text-white font-bold text-sm">CyberShield AI</p>
            <p className="text-gray-500 text-xs">Security Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-4 mb-3">Navigation</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-4 mt-6 mb-3">Admin</p>
            <NavLink to="/admin"
              className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
              <span className="text-lg">⚙️</span>
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="text-gray-500 hover:text-cyber-red transition-colors text-sm">↩</button>
        </div>
      </div>
    </aside>
  );
}
