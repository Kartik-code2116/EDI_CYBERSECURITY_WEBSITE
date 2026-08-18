import React from 'react';
import type { Severity } from '../types';

interface StatusBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
}

const SEVERITY_CONFIG = {
  SAFE: {
    label: 'SAFE',
    color: '#00ff88',
    bg: 'rgba(0, 255, 136, 0.12)',
    border: 'rgba(0, 255, 136, 0.3)',
    glow: '0 0 12px rgba(0, 255, 136, 0.4)',
    icon: '✓',
  },
  SUSPICIOUS: {
    label: 'SUSPICIOUS',
    color: '#ffcc00',
    bg: 'rgba(255, 204, 0, 0.12)',
    border: 'rgba(255, 204, 0, 0.3)',
    glow: '0 0 12px rgba(255, 204, 0, 0.4)',
    icon: '⚠',
  },
  DANGEROUS: {
    label: 'HIGH RISK',
    color: '#ff8800',
    bg: 'rgba(255, 136, 0, 0.12)',
    border: 'rgba(255, 136, 0, 0.3)',
    glow: '0 0 12px rgba(255, 136, 0, 0.4)',
    icon: '⚠',
  },
  CRITICAL: {
    label: 'CRITICAL',
    color: '#ff3366',
    bg: 'rgba(255, 51, 102, 0.15)',
    border: 'rgba(255, 51, 102, 0.4)',
    glow: '0 0 16px rgba(255, 51, 102, 0.5)',
    icon: '🚨',
  },
  SCANNING: {
    label: 'SCANNING',
    color: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.25)',
    glow: '0 0 12px rgba(0, 212, 255, 0.3)',
    icon: '◌',
  },
  UNKNOWN: {
    label: 'NOT SCANNED',
    color: '#8892a4',
    bg: 'rgba(136, 146, 164, 0.08)',
    border: 'rgba(136, 146, 164, 0.2)',
    glow: 'none',
    icon: '?',
  },
  ERROR: {
    label: 'ERROR',
    color: '#ff6b6b',
    bg: 'rgba(255, 107, 107, 0.1)',
    border: 'rgba(255, 107, 107, 0.25)',
    glow: 'none',
    icon: '!',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ severity, size = 'md' }) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.UNKNOWN;
  const isScanning = severity === 'SCANNING';

  const padMap = { sm: '4px 10px', md: '6px 14px', lg: '8px 18px' };
  const fontMap = { sm: '10px', md: '11px', lg: '13px' };

  return (
    <span
      className={isScanning ? 'status-badge scanning-pulse' : 'status-badge'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: padMap[size],
        borderRadius: '20px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: fontMap[size],
        fontWeight: 700,
        letterSpacing: '0.08em',
        boxShadow: config.glow,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span style={{ fontSize: size === 'sm' ? '10px' : '12px' }}>{config.icon}</span>
      {config.label}
    </span>
  );
};
