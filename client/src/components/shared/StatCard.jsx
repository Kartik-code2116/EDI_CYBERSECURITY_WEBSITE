import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, title, value, subtitle, color = 'cyan', index = 0 }) {
  const colors = {
    cyan: { text: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10', border: 'border-cyber-cyan/20', shadow: 'hover:shadow-cyber' },
    green: { text: 'text-cyber-green', bg: 'bg-cyber-green/10', border: 'border-cyber-green/20', shadow: 'hover:shadow-green' },
    red: { text: 'text-cyber-red', bg: 'bg-cyber-red/10', border: 'border-cyber-red/20', shadow: 'hover:shadow-red' },
    purple: { text: 'text-cyber-purple-light', bg: 'bg-cyber-purple/10', border: 'border-cyber-purple/20', shadow: 'hover:shadow-purple' },
  };
  const c = colors[color] || colors.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`glass-card p-6 border ${c.border} transition-all duration-300 ${c.shadow} cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <motion.p
            className={`text-3xl font-bold font-mono ${c.text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            {value ?? '—'}
          </motion.p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          {Icon && <Icon className={c.text} size={22} />}
        </div>
      </div>
      {/* Bottom glow line */}
      <div className={`mt-4 h-0.5 rounded-full ${c.bg}`} style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />
    </motion.div>
  );
}
