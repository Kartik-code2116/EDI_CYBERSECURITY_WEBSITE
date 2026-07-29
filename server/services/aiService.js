const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Calls the external AI URL analysis service.
 * Replace AI_URL_ANALYZER_API in .env with your actual AI endpoint.
 */
const analyzeUrl = async (url) => {
  try {
    const response = await axios.post(
      process.env.AI_URL_ANALYZER_API,
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    // Return mock response when AI service is unavailable (development mode)
    if (process.env.NODE_ENV === 'development') {
      return generateMockUrlResult(url);
    }
    throw new Error(`AI URL service error: ${error.message}`);
  }
};

/**
 * Calls the external AI document analysis service.
 * Replace AI_DOC_ANALYZER_API in .env with your actual AI endpoint.
 */
const analyzeDocument = async (filePath, originalName, mimetype) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), { filename: originalName });
    form.append('mimetype', mimetype);

    const response = await axios.post(process.env.AI_DOC_ANALYZER_API, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      timeout: 60000,
    });
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return generateMockDocResult(originalName);
    }
    throw new Error(`AI Document service error: ${error.message}`);
  }
};

// ─── Mock Responses for Development ─────────────────────────────────────────

const generateMockUrlResult = (url) => {
  const score = Math.floor(Math.random() * 100);
  const level =
    score < 25 ? 'safe' : score < 50 ? 'warning' : score < 75 ? 'suspicious' : 'malicious';

  return {
    threatScore: score,
    threatLevel: level,
    confidenceScore: Math.floor(70 + Math.random() * 30),
    detectedFeatures: [
      score > 30 && 'Suspicious redirect chain',
      score > 50 && 'Phishing keywords detected',
      score > 70 && 'Known malicious domain pattern',
      score > 80 && 'SSL certificate mismatch',
    ].filter(Boolean),
    recommendation:
      level === 'safe'
        ? 'This URL appears safe to visit. Standard caution advised.'
        : level === 'warning'
        ? 'Exercise caution. Some suspicious signals detected.'
        : level === 'suspicious'
        ? 'Avoid this URL. Multiple threat indicators found.'
        : 'Do NOT visit this URL. High probability of malicious activity.',
    aiExplanation: `Analysis of ${url} completed using neural threat classification. The model detected ${score > 50 ? 'multiple' : 'minimal'} threat indicators with a confidence of ${Math.floor(70 + Math.random() * 30)}%.`,
    scanDuration: Math.floor(800 + Math.random() * 1200),
  };
};

const generateMockDocResult = (fileName) => {
  const score = Math.floor(Math.random() * 100);
  const level =
    score < 25 ? 'safe' : score < 50 ? 'warning' : score < 75 ? 'suspicious' : 'malicious';

  return {
    threatScore: score,
    threatLevel: level,
    confidenceScore: Math.floor(70 + Math.random() * 30),
    pages: Math.floor(1 + Math.random() * 50),
    macrosFound: score > 60,
    hiddenObjects: score > 70,
    embeddedLinks: score > 40 ? ['http://suspicious-link.example.com'] : [],
    detectedFeatures: [
      score > 30 && 'Obfuscated content detected',
      score > 50 && 'Suspicious macro code',
      score > 70 && 'Hidden objects present',
    ].filter(Boolean),
    recommendation:
      level === 'safe'
        ? 'Document appears clean. No threats detected.'
        : 'Do not open this document in a production environment.',
    aiExplanation: `Deep scan of ${fileName} revealed ${score > 50 ? 'significant' : 'low'} threat indicators. The document was analyzed using static and heuristic analysis techniques.`,
    scanDuration: Math.floor(1200 + Math.random() * 2000),
  };
};

module.exports = { analyzeUrl, analyzeDocument };
