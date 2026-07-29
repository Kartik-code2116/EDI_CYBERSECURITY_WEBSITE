import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 mt-20"
      style={{ background: 'rgba(5,10,20,0.9)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>🛡️</div>
              <span className="font-bold text-white">CyberShield AI</span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              AI-powered cyber threat detection platform for URLs, PDFs, and documents. 
              Protect your organization with real-time threat intelligence.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link to="/analyze/url" className="hover:text-cyber-cyan transition-colors">URL Analyzer</Link></li>
              <li><Link to="/analyze/document" className="hover:text-cyber-cyan transition-colors">Document Analyzer</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyber-cyan transition-colors">Dashboard</Link></li>
              <li><Link to="/history" className="hover:text-cyber-cyan transition-colors">Scan History</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link to="/login" className="hover:text-cyber-cyan transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-cyber-cyan transition-colors">Register</Link></li>
              <li><Link to="/profile" className="hover:text-cyber-cyan transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} CyberShield AI. All rights reserved.</p>
          <p className="text-gray-700 text-xs">Built with ❤️ for a safer digital world</p>
        </div>
      </div>
    </footer>
  );
}
