export const THREAT_COLORS = {
  safe: { bg: 'bg-cyber-green/10', text: 'text-cyber-green', border: 'border-cyber-green/30', hex: '#00ff88' },
  warning: { bg: 'bg-cyber-yellow/10', text: 'text-cyber-yellow', border: 'border-cyber-yellow/30', hex: '#ffcc00' },
  suspicious: { bg: 'bg-cyber-orange/10', text: 'text-cyber-orange', border: 'border-cyber-orange/30', hex: '#ff8800' },
  malicious: { bg: 'bg-cyber-red/10', text: 'text-cyber-red', border: 'border-cyber-red/30', hex: '#ff3366' },
};

export const getThreatColor = (level) => THREAT_COLORS[level] || THREAT_COLORS.safe;

export const getThreatLabel = (level) => {
  const labels = { safe: '✓ Safe', warning: '⚠ Warning', suspicious: '⚡ Suspicious', malicious: '✕ Malicious' };
  return labels[level] || level;
};

export const getScoreColor = (score) => {
  if (score < 25) return '#00ff88';
  if (score < 50) return '#ffcc00';
  if (score < 75) return '#ff8800';
  return '#ff3366';
};
