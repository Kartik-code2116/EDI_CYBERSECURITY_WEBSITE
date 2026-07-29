import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analyze/url', label: 'URL Analyzer' },
  { href: '/analyze/document', label: 'Doc Analyzer' },
  { href: '/history', label: 'History' },
  { href: '/reports', label: 'Reports' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(5,10,20,0.9)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
              🛡️
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">
              Cyber<span className="text-gradient-cyber">Shield</span> AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.href ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname.startsWith('/admin') ? 'text-cyber-purple-light bg-cyber-purple/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                Admin
              </Link>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
                <span className="text-gray-500 text-xs">▾</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-48 glass-card py-1 shadow-cyber-lg z-50">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      👤 Profile
                    </Link>
                    <hr className="border-white/5 my-1" />
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-cyber-red hover:bg-cyber-red/10 transition-colors">
                      🚪 Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="lg:hidden overflow-hidden border-t border-white/5" style={{ background: 'rgba(5,10,20,0.95)' }}>
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm ${location.pathname === link.href ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
