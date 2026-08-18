import React from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { StatusBadge } from '../components/StatusBadge';
import { RiskGauge } from '../components/RiskGauge';
import { ThreatList } from '../components/ThreatList';
import { ScanButton } from '../components/ScanButton';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { WarningBanner } from '../components/WarningBanner';

export const PopupPage: React.FC = () => {
  const { state, severity, domain, loading, result, errorMessage, triggerScan, isScanning } = useAnalysis();

  const showWarning = severity === 'DANGEROUS' || severity === 'CRITICAL';
  const risk = result?.risk;

  return (
    <div className="popup-root">
      {/* Header */}
      <header className="popup-header">
        <div className="header-brand">
          <span className="shield-icon">🛡️</span>
          <div>
            <div className="brand-title">AI Security Assistant</div>
            <div className="brand-subtitle">Real-time threat detection</div>
          </div>
        </div>
        <a
          className="settings-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
          }}
          title="Settings"
        >
          ⚙
        </a>
      </header>

      {/* Current website */}
      <div className="domain-row">
        <div className="domain-label">Current website</div>
        <div className="domain-value" title={domain}>{domain || '—'}</div>
      </div>

      {/* Status + gauge row */}
      <div className="status-row">
        <div className="status-left">
          <StatusBadge severity={severity} size="md" />
          {risk && (
            <div className="score-meta">
              <div className="score-label">Risk Score</div>
              <div className="score-breakdown">
                <div className="score-bar-row">
                  <span>URL</span>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${risk.url_risk}%`,
                        background: risk.url_risk > 60 ? '#ff3366' : risk.url_risk > 30 ? '#ffcc00' : '#00ff88',
                      }}
                    />
                  </div>
                </div>
                <div className="score-bar-row">
                  <span>Page</span>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${risk.page_risk}%`,
                        background: risk.page_risk > 60 ? '#ff3366' : risk.page_risk > 30 ? '#ffcc00' : '#00ff88',
                      }}
                    />
                  </div>
                </div>
                <div className="score-bar-row">
                  <span>NLP</span>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${risk.nlp_risk}%`,
                        background: risk.nlp_risk > 60 ? '#ff3366' : risk.nlp_risk > 30 ? '#ffcc00' : '#00ff88',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <RiskGauge score={risk?.risk_score ?? 0} severity={severity} size={110} />
      </div>

      {/* Warning banner for high risk */}
      {showWarning && result && <WarningBanner result={result} />}

      {/* Recommendation */}
      {result && !showWarning && (
        <div className="recommendation-bar">
          <span className="rec-icon">
            {severity === 'SAFE' ? '✓' : '⚠'}
          </span>
          {result.recommendation}
        </div>
      )}

      {/* Threat checklist */}
      {result && (
        <div className="section">
          <div className="section-title">Security Checks</div>
          <ThreatList result={result} />
        </div>
      )}

      {/* AI Explanation */}
      {result && (
        <ExplanationPanel result={result} />
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="error-box">
          <span className="error-icon">⚠</span>
          <div>
            <div className="error-title">Scan Failed</div>
            <div className="error-message">{errorMessage}</div>
            <div className="error-hint">Make sure the backend is running on localhost:8000</div>
          </div>
        </div>
      )}

      {/* Scan button */}
      <div className="scan-row">
        <ScanButton
          onScan={triggerScan}
          isScanning={isScanning}
          disabled={loading}
        />
        {result && (
          <div className="scan-time">
            {result.scan_duration_ms}ms · {result.model_versions.risk_engine || ''}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="popup-footer">
        <span>Privacy first • No passwords collected</span>
        <span className="footer-dot">·</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
};
