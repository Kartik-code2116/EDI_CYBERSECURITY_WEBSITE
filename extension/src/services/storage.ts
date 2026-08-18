/**
 * chrome.storage helpers — typed wrappers for extension storage.
 */

import type { TabAnalysisState, ExtensionSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...result.settings });
    });
  });
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: { ...current, ...settings } }, resolve);
  });
}

// ── Tab Analysis State ────────────────────────────────────────────────────────

const TAB_STATE_PREFIX = 'tab_state_';

export async function getTabState(tabId: number): Promise<TabAnalysisState | null> {
  return new Promise((resolve) => {
    const key = `${TAB_STATE_PREFIX}${tabId}`;
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] ?? null);
    });
  });
}

export async function setTabState(tabId: number, state: TabAnalysisState): Promise<void> {
  return new Promise((resolve) => {
    const key = `${TAB_STATE_PREFIX}${tabId}`;
    chrome.storage.local.set({ [key]: state }, resolve);
  });
}

export async function clearTabState(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const key = `${TAB_STATE_PREFIX}${tabId}`;
    chrome.storage.local.remove([key], resolve);
  });
}

// ── API URL shortcut ──────────────────────────────────────────────────────────

export async function getApiBaseUrl(): Promise<string> {
  const settings = await getSettings();
  return settings.apiBaseUrl;
}
