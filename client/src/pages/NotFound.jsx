import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen cyber-grid-bg flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="text-8xl mb-4 animate-float">🛡️</div>
        <h1 className="text-8xl font-extrabold font-mono text-gradient-cyber mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Access Denied — Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">The resource you're looking for doesn't exist or has been moved to a secure location.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn-cyber text-white px-6 py-3 rounded-xl">Go Home</Link>
          <Link to="/dashboard" className="btn-outline-cyber px-6 py-3 rounded-xl">Dashboard</Link>
        </div>
      </motion.div>
    </div>
  );
}
