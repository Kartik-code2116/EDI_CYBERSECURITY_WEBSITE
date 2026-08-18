import React from 'react';
import type { AnalysisResponse } from '../types';

interface WarningBannerProps {
  result: AnalysisResponse;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ result }) => {
  const { risk } = result;
  const isCritical = risk.severity === 'CRITICAL';

  const config = {
    DANGEROUS: {
      emoji: '🚨',
      title: 'HIGH RISK WEBSITE',
      color: '#ff8800',
      bg: 'rgba(255, 136, 0, 0.1)',
      border: 'rgba(255, 136, 0, 0.35)',
    },
    CRITICAL: {
      emoji: '🚨',
      title: 'CRITICAL THREAT DETECTED',
      color: '#ff3366',
      bg: 'rgba(255, 51, 102, 0.12)',
      border: 'rgba(255, 51, 102, 0.4)',
    },
  }[risk.severity as 'DANGEROUS' | 'CRITICAL'] ?? {
    emoji: '⚠️',
    title: 'SUSPICIOUS WEBSITE',
    color: '#ffcc00',
    bg: 'rgba(255, 204, 0, 0.08)',
    border: 'rgba(255, 204, 0, 0.3)',
  };

  return (
    <div
      className="warning-banner"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `4px solid ${config.color}`,
      }}
    >
      <div className="warning-header">
        <span className="warning-emoji">{config.emoji}</span>
        <span className="warning-title" style={{ color: config.color }}>
          {config.title}
        </span>
      </div>

      {risk.threats.length > 0 && (
        <div className="warning-threats">
          <div className="warning-threats-label">Threats detected:</div>
          {risk.threats.slice(0, 4).map((threat, i) => (
            <div key={i} className="warning-threat-item">
              <span style={{ color: config.color }}>›</span> {threat}
            </div>
          ))}
        </div>
      )}

      <div className="warning-recommendation">
        <strong>Recommended action:</strong> {result.recommendation}
      </div>
    </div>
  );
};
