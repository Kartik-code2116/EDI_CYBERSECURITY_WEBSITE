import { motion } from 'framer-motion';
import { getScoreColor, getThreatLabel } from '../../utils/threatColors';

export default function RiskMeter({ score = 0, level = 'safe', size = 'lg' }) {
  const angle = (score / 100) * 180 - 90; // -90 to 90 degrees
  const color = getScoreColor(score);

  const sizes = {
    sm: { w: 120, r: 45, stroke: 8, font: 'text-xl' },
    md: { w: 180, r: 70, stroke: 10, font: 'text-2xl' },
    lg: { w: 240, r: 95, stroke: 12, font: 'text-4xl' },
  };
  const { w, r, stroke, font } = sizes[size];
  const cx = w / 2;
  const cy = w / 2;
  const circumference = Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: w, height: w / 2 + 20 }}>
        <svg width={w} height={w / 2 + stroke} viewBox={`0 0 ${w} ${w / 2 + stroke}`}>
          {/* Track */}
          <path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${w - stroke / 2} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Progress */}
          <motion.path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${w - stroke / 2} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          {/* Needle */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={cx + (r - 10) * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={cy + (r - 10) * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ rotate: -90, originX: cx, originY: cy }}
            animate={{ rotate: angle, originX: cx, originY: cy }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={6} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>

        {/* Score label */}
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <motion.span
            className={`${font} font-bold font-mono`}
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-gray-500 text-sm">/100</span>
        </div>
      </div>

      {/* Threat level badge */}
      <div className={`px-4 py-1.5 rounded-full border text-sm font-bold`}
        style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}>
        {getThreatLabel(level)}
      </div>

      {/* Scale labels */}
      <div className="flex gap-1 mt-1">
        {['SAFE', 'WARNING', 'SUSPICIOUS', 'MALICIOUS'].map((l, i) => {
          const colors = ['#00ff88', '#ffcc00', '#ff8800', '#ff3366'];
          return (
            <span key={l} className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: colors[i], backgroundColor: colors[i] + '15' }}>
              {l}
            </span>
          );
        })}
      </div>
    </div>
  );
}
