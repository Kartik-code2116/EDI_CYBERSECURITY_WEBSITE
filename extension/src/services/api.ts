/**
 * API client — communicates with the FastAPI backend.
 *
 * PRIVACY: Never sends passwords, cookies, tokens, or form values.
 * Only sends structural metadata collected by the content script.
 */

import type { AnalysisResponse, PageMetadata } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:8000';

async function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiBaseUrl'], (result) => {
      resolve(result.apiBaseUrl || DEFAULT_BASE_URL);
    });
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ── API Methods ────────────────────────────────────────────────────────────────

/**
 * Analyze a URL only (fast — no page content sent).
 */
export async function analyzeUrl(url: string): Promise<AnalysisResponse> {
  const base = await getApiBaseUrl();
  const response = await fetchWithTimeout(
    `${base}/api/analyze/url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json() as Promise<AnalysisResponse>;
}

/**
 * Analyze a full page using safely-collected metadata.
 * The metadata never includes passwords, form values, or cookies.
 */
export async function analyzePage(meta: PageMetadata): Promise<AnalysisResponse> {
  const base = await getApiBaseUrl();

  // Truncate visible text to 5000 chars max
  const safeText = (meta.visibleText || '').slice(0, 5000);

  const payload = {
    url: meta.url,
    title: meta.title?.slice(0, 256),
    meta_description: meta.metaDescription?.slice(0, 512),
    visible_text: safeText,
    form_count: meta.formCount,
    password_field_count: meta.passwordFieldCount,
    external_script_count: meta.externalScriptCount,
    iframe_count: meta.iframeCount,
    link_count: meta.linkCount,
    external_links: (meta.externalLinks || []).slice(0, 20),
  };

  const response = await fetchWithTimeout(
    `${base}/api/analyze/page`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json() as Promise<AnalysisResponse>;
}

/**
 * Health check — verify backend is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const base = await getApiBaseUrl();
    const response = await fetchWithTimeout(
      `${base}/api/health`,
      { method: 'GET' },
      5000
    );
    return response.ok;
  } catch {
    return false;
  }
}
