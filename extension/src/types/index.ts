/**
 * All TypeScript types for the AI Security Assistant extension.
 * Shared across popup, background, and content scripts.
 */

// ── Risk / Analysis Types ─────────────────────────────────────────────────────

export type Severity = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'CRITICAL' | 'SCANNING' | 'UNKNOWN' | 'ERROR';

export interface RiskResult {
  risk_score: number;         // 0–100
  severity: Severity;
  url_risk: number;
  page_risk: number;
  vision_risk: number;
  nlp_risk: number;
  behavior_risk: number;
  threats: string[];
  evidence: string[];
  confidence: number;
}

export interface URLFeatures {
  length: number;
  subdomain_count: number;
  special_char_count: number;
  has_https: boolean;
  has_ip_address: boolean;
  has_suspicious_tld: boolean;
  hyphen_count: number;
  digit_count: number;
  has_punycode: boolean;
  has_at_symbol: boolean;
  has_double_slash: boolean;
  suspicious_keywords_found: string[];
  url_entropy: number;
  domain: string;
  tld: string;
  path_length: number;
  query_param_count: number;
}

export interface PageFeatures {
  login_form_detected: boolean;
  password_field_detected: boolean;
  external_form_submission: boolean;
  suspicious_iframe: boolean;
  hidden_elements_detected: boolean;
  external_scripts_count: number;
  redirect_detected: boolean;
  suspicious_js_patterns: string[];
  brand_keywords_found: string[];
  form_count: number;
  credential_form_score: number;
}

export interface VisionResult {
  analyzed: boolean;
  model_available: boolean;
  detections: unknown[];
  threat_score: number;
  threats_detected: string[];
  note: string;
}

export interface NLPResult {
  analyzed: boolean;
  urgency_score: number;
  threat_score: number;
  financial_pressure_score: number;
  impersonation_score: number;
  overall_score: number;
  indicators: string[];
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  url: string;
  domain: string;
  risk: RiskResult;
  url_features?: URLFeatures;
  page_features?: PageFeatures;
  vision?: VisionResult;
  nlp?: NLPResult;
  explanation: string;
  recommendation: string;
  model_versions: Record<string, string>;
  scan_duration_ms: number;
}

// ── Page Metadata ──────────────────────────────────────────────────────────────

export interface PageMetadata {
  url: string;
  title: string;
  metaDescription: string;
  visibleText: string;
  formCount: number;
  passwordFieldCount: number;
  externalScriptCount: number;
  iframeCount: number;
  linkCount: number;
  externalLinks: string[];
}

// ── Extension State ───────────────────────────────────────────────────────────

export type ScanState = 'idle' | 'collecting' | 'scanning' | 'done' | 'error';

export interface TabAnalysisState {
  tabId: number;
  url: string;
  domain: string;
  state: ScanState;
  result?: AnalysisResponse;
  errorMessage?: string;
  scannedAt?: number;
}

// ── Extension Messages ────────────────────────────────────────────────────────

export type MessageType =
  | 'COLLECT_PAGE_DATA'
  | 'PAGE_DATA_COLLECTED'
  | 'TRIGGER_SCAN'
  | 'SCAN_COMPLETE'
  | 'SCAN_ERROR'
  | 'GET_TAB_STATE'
  | 'TAB_STATE_RESPONSE'
  | 'SETTINGS_CHANGED';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface CollectPageDataMessage extends ExtensionMessage {
  type: 'COLLECT_PAGE_DATA';
}

export interface PageDataCollectedMessage extends ExtensionMessage {
  type: 'PAGE_DATA_COLLECTED';
  payload: PageMetadata;
}

export interface TriggerScanMessage extends ExtensionMessage {
  type: 'TRIGGER_SCAN';
  payload: { tabId: number; url: string };
}

export interface ScanCompleteMessage extends ExtensionMessage {
  type: 'SCAN_COMPLETE';
  payload: { tabId: number; result: AnalysisResponse };
}

export interface ScanErrorMessage extends ExtensionMessage {
  type: 'SCAN_ERROR';
  payload: { tabId: number; error: string };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface ExtensionSettings {
  apiBaseUrl: string;
  autoScan: boolean;
  showNotifications: boolean;
  blockHighRisk: boolean;
  scanTimeout: number;
  privacyMode: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: 'http://localhost:8000',
  autoScan: false,
  showNotifications: true,
  blockHighRisk: false,
  scanTimeout: 30000,
  privacyMode: false,
};
