const badgeClasses = {
  safe: 'badge-safe',
  warning: 'badge-warning',
  suspicious: 'badge-suspicious',
  malicious: 'badge-malicious',
  info: 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 px-3 py-1 rounded-full text-xs font-semibold',
  purple: 'bg-cyber-purple/10 text-cyber-purple-light border border-cyber-purple/30 px-3 py-1 rounded-full text-xs font-semibold',
  default: 'bg-white/5 text-gray-300 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`${badgeClasses[variant] || badgeClasses.default} ${className}`}>
      {children}
    </span>
  );
}
