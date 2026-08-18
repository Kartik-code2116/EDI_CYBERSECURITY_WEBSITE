import React from 'react';
import { useSettings } from '../hooks/useSettings';

export const OptionsPage: React.FC = () => {
  const { settings, updateSettings, saving } = useSettings();

  if (!settings) {
    return <div className="options-loading">Loading...</div>;
  }

  return (
    <div className="options-root">
      <header className="options-header">
        <div className="header-brand">
          <span className="shield-icon">🛡️</span>
          <div>
            <div className="brand-title">AI Security Assistant</div>
            <div className="brand-subtitle">Settings & Privacy</div>
          </div>
        </div>
      </header>

      <div className="options-content">

        {/* API Configuration */}
        <section className="options-section">
          <h2 className="section-title">Backend API</h2>
          <div className="option-row">
            <label className="option-label" htmlFor="api-url">API Base URL</label>
            <input
              id="api-url"
              type="url"
              className="option-input"
              value={settings.apiBaseUrl}
              onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
              placeholder="http://localhost:8000"
            />
            <div className="option-hint">The URL where the FastAPI backend is running.</div>
          </div>
        </section>

        {/* Scan Behavior */}
        <section className="options-section">
          <h2 className="section-title">Scan Behavior</h2>

          <div className="option-row">
            <label className="option-label">
              <input
                type="checkbox"
                checked={settings.autoScan}
                onChange={(e) => updateSettings({ autoScan: e.target.checked })}
              />
              <span>Auto-scan websites (manually triggered for now)</span>
            </label>
            <div className="option-hint">Currently scan requires clicking "Scan Website".</div>
          </div>

          <div className="option-row">
            <label className="option-label">
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => updateSettings({ showNotifications: e.target.checked })}
              />
              <span>Show browser notifications for dangerous sites</span>
            </label>
          </div>

          <div className="option-row">
            <label className="option-label">
              <input
                type="checkbox"
                checked={settings.blockHighRisk}
                onChange={(e) => updateSettings({ blockHighRisk: e.target.checked })}
              />
              <span>Block navigation to CRITICAL risk sites</span>
            </label>
            <div className="option-hint option-warning">
              ⚠ This is experimental. False positives may block legitimate sites.
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="options-section">
          <h2 className="section-title">Privacy</h2>

          <div className="privacy-box">
            <h3 className="privacy-subtitle">What we collect</h3>
            <ul className="privacy-list">
              <li>✅ Current page URL</li>
              <li>✅ Page title and description</li>
              <li>✅ Visible text (truncated)</li>
              <li>✅ Number of forms (not values)</li>
              <li>✅ Number of scripts and iframes</li>
            </ul>
            <h3 className="privacy-subtitle">What we NEVER collect</h3>
            <ul className="privacy-list never">
              <li>❌ Passwords or form values</li>
              <li>❌ Cookies or session tokens</li>
              <li>❌ Authentication tokens</li>
              <li>❌ Personal messages</li>
              <li>❌ Browser history</li>
              <li>❌ Sensitive user information</li>
            </ul>
          </div>

          <div className="option-row">
            <label className="option-label">
              <input
                type="checkbox"
                checked={settings.privacyMode}
                onChange={(e) => updateSettings({ privacyMode: e.target.checked })}
              />
              <span>Privacy mode (URL-only analysis, no page content)</span>
            </label>
            <div className="option-hint">
              When enabled, only the URL is sent to the backend. Reduces accuracy.
            </div>
          </div>
        </section>

        {/* About */}
        <section className="options-section">
          <h2 className="section-title">About</h2>
          <div className="about-box">
            <div className="about-row">
              <span>Version</span><span>1.0.0</span>
            </div>
            <div className="about-row">
              <span>Backend</span><span>{settings.apiBaseUrl}</span>
            </div>
            <div className="about-row">
              <span>Extension ID</span><span className="mono">{chrome.runtime.id}</span>
            </div>
          </div>
        </section>

        {saving && (
          <div className="saving-indicator">Saving...</div>
        )}
      </div>
    </div>
  );
};
