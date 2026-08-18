import React from 'react';
import type { AnalysisResponse } from '../types';

interface ThreatListProps {
  result: AnalysisResponse;
}

interface CheckItem {
  label: string;
  status: 'pass' | 'fail' | 'warning' | 'placeholder';
  detail?: string;
}

export const ThreatList: React.FC<ThreatListProps> = ({ result }) => {
  const { risk, url_features, page_features, vision, nlp } = result;

  const items: CheckItem[] = [];

  // SSL check
  if (url_features) {
    items.push({
      label: 'SSL / HTTPS',
      status: url_features.has_https ? 'pass' : 'fail',
      detail: url_features.has_https ? 'Encrypted connection' : 'No encryption',
    });
  }

  // Domain check
  const hasSuspiciousDomain = (url_features?.has_suspicious_tld || url_features?.has_punycode || url_features?.has_ip_address) ?? false;
  items.push({
    label: 'Domain Analysis',
    status: hasSuspiciousDomain ? 'fail' : 'pass',
    detail: hasSuspiciousDomain ? 'Suspicious domain signals' : 'Domain appears normal',
  });

  // Brand impersonation
  const hasBrandImpersonation = risk.threats.some(t =>
    t.toLowerCase().includes('brand') || t.toLowerCase().includes('impersonat')
  );
  if (hasBrandImpersonation || (page_features?.brand_keywords_found?.length ?? 0) > 0) {
    items.push({
      label: 'Brand Impersonation',
      status: hasBrandImpersonation ? 'fail' : 'warning',
      detail: hasBrandImpersonation
        ? `Brand references: ${page_features?.brand_keywords_found?.slice(0, 2).join(', ')}`
        : 'Brand references detected — verify legitimacy',
    });
  }

  // Login form / credential harvesting
  if (page_features) {
    if (page_features.password_field_detected || page_features.login_form_detected) {
      const isExternal = page_features.external_form_submission;
      items.push({
        label: 'Login Form',
        status: isExternal ? 'fail' : page_features.credential_form_score > 0.7 ? 'warning' : 'pass',
        detail: isExternal
          ? 'Form submits to external domain!'
          : page_features.login_form_detected
          ? 'Login form detected'
          : 'Password field present',
      });
    }
  }

  // Social engineering / NLP
  if (nlp && nlp.analyzed) {
    const hasSocialEng = nlp.overall_score > 0.4;
    items.push({
      label: 'Social Engineering',
      status: hasSocialEng ? 'fail' : 'pass',
      detail: hasSocialEng
        ? `Urgency/manipulation content: ${nlp.indicators.slice(0, 1).join(', ')}`
        : 'No manipulation patterns detected',
    });
  }

  // Vision
  if (vision) {
    items.push({
      label: 'Visual Analysis',
      status: vision.model_available ? (vision.threat_score > 0.5 ? 'fail' : 'pass') : 'placeholder',
      detail: vision.model_available
        ? vision.threats_detected[0] || 'No visual threats'
        : '[MODEL PLACEHOLDER] YOLO model not loaded',
    });
  }

  // Suspicious scripts
  if (page_features && page_features.suspicious_js_patterns.length > 0) {
    items.push({
      label: 'Suspicious Scripts',
      status: 'fail',
      detail: page_features.suspicious_js_patterns[0],
    });
  }

  const statusIcon = {
    pass: '✓',
    fail: '✗',
    warning: '⚠',
    placeholder: '○',
  };

  const statusColor = {
    pass: '#00ff88',
    fail: '#ff3366',
    warning: '#ffcc00',
    placeholder: '#5a6478',
  };

  return (
    <div className="threat-list">
      {items.map((item, i) => (
        <div key={i} className="threat-item">
          <span
            className="threat-icon"
            style={{ color: statusColor[item.status] }}
          >
            {statusIcon[item.status]}
          </span>
          <div className="threat-content">
            <span className="threat-label">{item.label}</span>
            {item.detail && (
              <span
                className="threat-detail"
                style={{
                  color: item.status === 'fail'
                    ? '#ff6b6b'
                    : item.status === 'warning'
                    ? '#ffcc00'
                    : '#5a6478',
                }}
              >
                {item.detail}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
