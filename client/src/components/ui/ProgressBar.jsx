import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/threatColors';

export default function ProgressBar({ value = 0, max = 100, label, color, showValue = true, size = 'md', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || getScoreColor(pct);

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-gray-400">
          {label && <span>{label}</span>}
          {showValue && <span style={{ color: barColor }} className="font-mono font-semibold">{value}/{max}</span>}
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${barColor}99, ${barColor})`, boxShadow: `0 0 10px ${barColor}60` }}
        />
      </div>
    </div>
  );
}
