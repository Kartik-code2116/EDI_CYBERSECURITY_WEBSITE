/**
 * useAnalysis — manages scan state for the popup.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TabAnalysisState, Severity } from '../types';

export function useAnalysis() {
  const [state, setState] = useState<TabAnalysisState | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Get current tab info on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id && tab.url) {
        setCurrentTabId(tab.id);
        setCurrentUrl(tab.url);
        // Get cached state for this tab
        chrome.runtime.sendMessage(
          { type: 'GET_TAB_STATE', payload: { tabId: tab.id } },
          (response) => {
            if (response?.payload) {
              setState(response.payload as TabAnalysisState);
            }
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    });
  }, []);

  const triggerScan = useCallback(async () => {
    if (!currentTabId || !currentUrl) return;

    // Optimistically update state to scanning
    setState((prev) => ({
      tabId: currentTabId,
      url: currentUrl,
      domain: prev?.domain || currentUrl,
      state: 'scanning',
    }));

    chrome.runtime.sendMessage(
      {
        type: 'TRIGGER_SCAN',
        payload: { tabId: currentTabId, url: currentUrl },
      },
      (response) => {
        if (response?.payload) {
          setState(response.payload as TabAnalysisState);
        } else {
          setState((prev) => ({
            ...(prev ?? { tabId: currentTabId, url: currentUrl, domain: currentUrl }),
            state: 'error',
            errorMessage: 'Scan failed. Is the backend running?',
          }));
        }
      }
    );
  }, [currentTabId, currentUrl]);

  const severity: Severity = (() => {
    if (loading) return 'SCANNING';
    if (!state) return 'UNKNOWN';
    if (state.state === 'scanning') return 'SCANNING';
    if (state.state === 'error') return 'ERROR';
    if (state.state === 'done' && state.result) return state.result.risk.severity as Severity;
    return 'UNKNOWN';
  })();

  const domain = (() => {
    if (state?.domain) return state.domain;
    try {
      return new URL(currentUrl).hostname;
    } catch {
      return currentUrl.slice(0, 40);
    }
  })();

  return {
    state,
    severity,
    domain,
    loading,
    currentUrl,
    triggerScan,
    isScanning: state?.state === 'scanning',
    result: state?.result ?? null,
    errorMessage: state?.errorMessage ?? null,
  };
}
