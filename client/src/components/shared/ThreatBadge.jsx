import Badge from '../ui/Badge';

const icons = {
  safe: '🛡️',
  warning: '⚠️',
  suspicious: '⚡',
  malicious: '☠️',
};

export default function ThreatBadge({ level, size = 'md' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold
      ${sizes[size]}
      ${level === 'safe' ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30' : ''}
      ${level === 'warning' ? 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/30' : ''}
      ${level === 'suspicious' ? 'bg-cyber-orange/10 text-cyber-orange border-cyber-orange/30' : ''}
      ${level === 'malicious' ? 'bg-cyber-red/10 text-cyber-red border-cyber-red/30' : ''}
    `}>
      <span>{icons[level]}</span>
      <span>{level?.charAt(0).toUpperCase() + level?.slice(1)}</span>
    </span>
  );
}
