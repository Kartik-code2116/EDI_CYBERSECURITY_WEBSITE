import React from 'react';
import type { AnalysisResponse } from '../types';

interface ExplanationPanelProps {
  result: AnalysisResponse;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ result }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="explanation-panel">
      <button
        className="explanation-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span>🤖 AI Analysis</span>
        <span className="toggle-icon" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="explanation-body">
          <p className="explanation-text">{result.explanation}</p>

          {result.risk.evidence.length > 0 && (
            <div className="evidence-list">
              <div className="evidence-title">Evidence:</div>
              {result.risk.evidence.slice(0, 5).map((ev, i) => (
                <div key={i} className="evidence-item">
                  <span className="bullet">•</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          )}

          <div className="model-note">
            <span className="model-note-icon">ℹ</span>
            Analyst: {result.model_versions.security_analyst || 'template_v1'}
            {result.model_versions.vision_detector?.includes('placeholder') &&
              ' · Vision: placeholder active'
            }
          </div>
        </div>
      )}
    </div>
  );
};
