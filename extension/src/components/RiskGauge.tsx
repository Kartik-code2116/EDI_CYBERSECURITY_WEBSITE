import React from 'react';
import type { Severity } from '../types';

interface RiskGaugeProps {
  score: number;        // 0–100
  severity: Severity;
  size?: number;        // diameter in px
}

const SEVERITY_COLORS = {
  SAFE: '#00ff88',
  SUSPICIOUS: '#ffcc00',
  DANGEROUS: '#ff8800',
  CRITICAL: '#ff3366',
  SCANNING: '#00d4ff',
  UNKNOWN: '#3a4555',
  ERROR: '#ff6b6b',
};

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, severity, size = 120 }) => {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.UNKNOWN;
  const isScanning = severity === 'SCANNING';
  const isUnknown = severity === 'UNKNOWN' || severity === 'ERROR';

  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const displayScore = isUnknown ? 0 : isScanning ? 0 : Math.min(100, Math.max(0, score));
  const progress = circumference * (1 - displayScore / 100);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="risk-gauge"
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isScanning ? circumference * 0.7 : progress}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
          className={isScanning ? 'gauge-spin' : ''}
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isScanning ? (
          <span style={{ color: '#00d4ff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' }}>
            SCANNING
          </span>
        ) : isUnknown ? (
          <span style={{ color: '#3a4555', fontSize: '11px', fontWeight: 600 }}>
            —
          </span>
        ) : (
          <>
            <span
              style={{
                color,
                fontSize: size < 80 ? '20px' : '28px',
                fontWeight: 800,
                lineHeight: 1,
                textShadow: `0 0 20px ${color}66`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {displayScore}
            </span>
            <span style={{ color: '#5a6478', fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em' }}>
              / 100
            </span>
          </>
        )}
      </div>
    </div>
  );
};
