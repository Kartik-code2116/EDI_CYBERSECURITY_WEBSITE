/**
 * Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 * - Track active tab URL changes
 * - Coordinate analysis requests from popup
 * - Cache analysis results per tab
 * - Forward messages between popup and content scripts
 */

import type {
  TabAnalysisState,
  AnalysisResponse,
  PageMetadata,
  ExtensionMessage,
} from '../types';
import { analyzeUrl, analyzePage } from '../services/api';
import { getTabState, setTabState, getSettings } from '../services/storage';

// ── Tab change tracking ───────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // When a new page loads, clear the old analysis result for that tab
  if (changeInfo.status === 'loading' && tab.url) {
    const cleanUrl = tab.url;
    if (cleanUrl.startsWith('chrome://') || cleanUrl.startsWith('chrome-extension://')) {
      return;
    }
    try {
      const hostname = new URL(cleanUrl).hostname;
      await setTabState(tabId, {
        tabId,
        url: cleanUrl,
        domain: hostname,
        state: 'idle',
      });
    } catch {
      // Invalid URL — ignore
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`tab_state_${tabId}`]);
});

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage & Record<string, unknown>, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open
  }
);

async function handleMessage(
  message: ExtensionMessage & Record<string, unknown>,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'TRIGGER_SCAN': {
      const payload = message.payload as { tabId: number; url: string };
      const { tabId, url } = payload;
      await performScan(tabId, url);
      const state = await getTabState(tabId);
      sendResponse({ type: 'TAB_STATE_RESPONSE', payload: state });
      break;
    }

    case 'GET_TAB_STATE': {
      const payload = message.payload as { tabId: number };
      const state = await getTabState(payload.tabId);
      sendResponse({ type: 'TAB_STATE_RESPONSE', payload: state });
      break;
    }

    default:
      sendResponse({ type: 'UNKNOWN_MESSAGE' });
  }
}

// ── Core scan logic ───────────────────────────────────────────────────────────

async function performScan(tabId: number, url: string): Promise<void> {
  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url.slice(0, 50);
  }

  // Mark as scanning
  await setTabState(tabId, {
    tabId,
    url,
    domain,
    state: 'scanning',
  });

  try {
    const settings = await getSettings();
    let result: AnalysisResponse;

    // Try to collect page metadata from the content script
    let pageMetadata: PageMetadata | null = null;
    try {
      pageMetadata = await collectPageData(tabId);
    } catch {
      // Content script not ready (e.g. browser internal page) — fall back to URL-only
      pageMetadata = null;
    }

    if (pageMetadata && !settings.privacyMode) {
      result = await analyzePage(pageMetadata);
    } else {
      result = await analyzeUrl(url);
    }

    await setTabState(tabId, {
      tabId,
      url,
      domain,
      state: 'done',
      result,
      scannedAt: Date.now(),
    });

    // Show notification for dangerous sites
    if (settings.showNotifications && result.risk.severity !== 'SAFE') {
      showDangerNotification(domain, result);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await setTabState(tabId, {
      tabId,
      url,
      domain,
      state: 'error',
      errorMessage: errorMsg,
    });
  }
}

// ── Content script communication ──────────────────────────────────────────────

function collectPageData(tabId: number): Promise<PageMetadata> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Content script timeout')), 5000);
    chrome.tabs.sendMessage(
      tabId,
      { type: 'COLLECT_PAGE_DATA' },
      (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.type === 'PAGE_DATA_COLLECTED' && response.payload) {
          resolve(response.payload as PageMetadata);
        } else {
          reject(new Error('Invalid response from content script'));
        }
      }
    );
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

function showDangerNotification(domain: string, result: AnalysisResponse): void {
  const severityLabels: Record<string, string> = {
    SUSPICIOUS: '⚠️ Suspicious Website',
    DANGEROUS: '🚨 Dangerous Website',
    CRITICAL: '🚨 CRITICAL THREAT',
  };

  const title = severityLabels[result.risk.severity] || '⚠️ Security Warning';
  const body = `${domain}: Risk Score ${result.risk.risk_score}/100\n${
    result.risk.threats.slice(0, 2).join(', ')
  }`;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message: body,
  });
}
