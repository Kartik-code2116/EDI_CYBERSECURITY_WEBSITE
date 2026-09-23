/**
 * Standard Scan Result Schema
 *
 * All scan endpoints (URL, document, extension) must return this shape.
 * This ensures the frontend, browser extension, and any external consumers
 * always receive a consistent, predictable response.
 *
 * Shape (per todos.md Phase 1.3):
 * {
 *   target         – the URL or filename that was scanned
 *   type           – 'url' | 'pdf' | 'docx' | 'document'
 *   status         – 'completed' | 'error' | 'pending'
 *   classification – 'safe' | 'suspicious' | 'malicious'
 *   risk_score     – 0–100 integer
 *   confidence     – 0.0–1.0 float
 *   evidence       – array of { indicator, description, severity }
 *   threat_intelligence – { matched: bool, source: string, details: string }
 *   iocs           – array of strings (URLs, IPs, hashes found)
 *   recommendations – array of strings
 *   meta           – scan duration, scan_id, timestamp
 * }
 */

/**
 * Map a raw AI service response to the standard scan result.
 *
 * @param {object} aiResult - Raw result from aiService.analyzeUrl / analyzeDocument
 * @param {string} target   - The URL or filename scanned
 * @param {string} type     - 'url' | 'pdf' | 'docx' | 'document'
 * @param {string} scanId   - The MongoDB Scan _id (string)
 * @param {number} duration - Wall-clock scan duration in ms
 * @returns {object} Standardised scan result
 */
function buildScanResult(aiResult, target, type, scanId, duration) {
  // Map legacy threatLevel strings to standard classification
  const classificationMap = {
    safe: 'safe',
    warning: 'suspicious',
    suspicious: 'suspicious',
    malicious: 'malicious',
  };

  const classification = classificationMap[aiResult.threatLevel] || 'suspicious';
  const riskScore = Math.min(100, Math.max(0, Math.round(aiResult.threatScore ?? 0)));
  const confidence = Math.min(1, Math.max(0, (aiResult.confidenceScore ?? 70) / 100));

  // Build evidence array from detectedFeatures
  const evidence = (aiResult.detectedFeatures || []).map((feature) => ({
    indicator: feature,
    description: feature,
    severity: riskScore > 75 ? 'high' : riskScore > 40 ? 'medium' : 'low',
  }));

  // IOCs: embedded links found in document scans
  const iocs = aiResult.embeddedLinks || [];

  // Default recommendations based on classification
  const defaultRecommendation =
    classification === 'safe'
      ? 'No significant threats detected. Proceed with normal caution.'
      : classification === 'suspicious'
      ? 'Treat with caution. Verify the source before interacting.'
      : 'High risk detected. Do not interact with this target.';

  const recommendations = aiResult.recommendation
    ? [aiResult.recommendation]
    : [defaultRecommendation];

  return {
    target,
    type,
    status: 'completed',
    classification,
    risk_score: riskScore,
    confidence: parseFloat(confidence.toFixed(2)),
    evidence,
    threat_intelligence: {
      matched: false,
      source: null,
      details: null,
    },
    iocs,
    recommendations,
    ai_explanation: aiResult.aiExplanation || null,
    meta: {
      scan_id: scanId,
      scan_duration_ms: aiResult.scanDuration || duration,
      timestamp: new Date().toISOString(),
      // Document-specific metadata
      ...(aiResult.pages !== undefined && { pages: aiResult.pages }),
      ...(aiResult.macrosFound !== undefined && { macros_found: aiResult.macrosFound }),
      ...(aiResult.hiddenObjects !== undefined && { hidden_objects: aiResult.hiddenObjects }),
    },
  };
}

module.exports = { buildScanResult };
