import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, glow = false, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      onClick={onClick}
      className={`
        glass-card p-6
        ${hover ? 'cursor-pointer transition-all duration-300 hover:border-cyber-cyan/30 hover:shadow-cyber' : ''}
        ${glow ? 'shadow-cyber-lg animate-glow' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
