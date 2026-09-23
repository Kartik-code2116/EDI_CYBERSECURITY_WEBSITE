/**
 * Extension Download Scanner Route
 * 
 * A dedicated endpoint for the Chrome Extension to submit downloaded files
 * for malware/virus analysis WITHOUT requiring user JWT authentication.
 * 
 * Security: Protected by EXTENSION_API_KEY (set in .env)
 * This keeps user accounts separate from extension scans.
 * 
 * POST /api/extension/scan-download
 *   - multipart/form-data with 'file' field
 *   - Header: x-extension-key: <EXTENSION_API_KEY>
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeDocument } = require('../services/aiService');

// ── Extension API Key middleware ───────────────────────────────────────────────
const extensionKeyAuth = (req, res, next) => {
  const key = req.headers['x-extension-key'];
  const validKey = process.env.EXTENSION_API_KEY || 'extension-dev-key-change-in-production';

  if (!key || key !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid extension API key',
    });
  }
  next();
};

// ── Upload config (broader file types than main upload middleware) ──────────────
const uploadDir = path.join(__dirname, '../uploads/extension');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.ps1', '.vbs', '.js',
  '.jar', '.dmg', '.sh', '.scr', '.pif', '.reg', '.dll',
];

const SCANNABLE_TYPES = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // Executables (flag but don't block upload)
  'application/octet-stream',
  'application/x-msdownload',
  'application/x-executable',
  'application/x-dosexec',
  // Text/scripts
  'text/plain',
  'application/javascript',
  'application/x-sh',
];

const extensionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const extensionUpload = multer({
  storage: extensionStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for extension scans
  fileFilter: (req, file, cb) => {
    // Accept all files — we categorize them during analysis
    cb(null, true);
  },
});

// ── POST /api/extension/scan-download ─────────────────────────────────────────
router.post(
  '/scan-download',
  extensionKeyAuth,
  extensionUpload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const { originalname, mimetype, path: filePath, size } = req.file;
    const fileExt = path.extname(originalname).toLowerCase();

    // Pre-scan flag: executables are always flagged as high risk
    const isExecutable = DANGEROUS_EXTENSIONS.includes(fileExt);

    try {
      // Call the existing AI document analysis service
      const aiResult = await analyzeDocument(filePath, originalname, mimetype);

      // Boost threat score for executable files
      let finalScore = aiResult.threatScore || 0;
      if (isExecutable) {
        finalScore = Math.max(finalScore, 65); // Executables are at minimum suspicious
      }

      const threatLevel =
        finalScore < 25 ? 'safe' :
        finalScore < 50 ? 'warning' :
        finalScore < 75 ? 'suspicious' : 'malicious';

      // Build extension-friendly response
      const response = {
        success: true,
        fileName: originalname,
        fileSize: size,
        fileType: mimetype,
        isExecutable,
        threatScore: finalScore,
        threatLevel,
        confidenceScore: aiResult.confidenceScore || 70,
        detectedFeatures: [
          ...(aiResult.detectedFeatures || []),
          isExecutable ? 'Executable file type — high risk category' : null,
        ].filter(Boolean),
        macrosFound: aiResult.macrosFound || false,
        hiddenObjects: aiResult.hiddenObjects || false,
        embeddedLinks: aiResult.embeddedLinks || [],
        recommendation:
          threatLevel === 'safe'
            ? 'File appears clean. Download is safe to proceed.'
            : threatLevel === 'warning'
            ? 'File has some suspicious signals. Open with caution.'
            : threatLevel === 'suspicious'
            ? 'File appears suspicious. Avoid opening unless from a trusted source.'
            : '🚨 DO NOT open this file. High probability of malware/virus detected.',
        aiExplanation: aiResult.aiExplanation || '',
        scanDuration: aiResult.scanDuration || 0,
      };

      res.json(response);
    } catch (error) {
      console.error('Extension download scan error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Scan failed',
        message: error.message,
      });
    } finally {
      // Clean up uploaded file after scanning
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }
  }
);

// ── GET /api/extension/health ─────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'extension-scanner' });
});

module.exports = router;
