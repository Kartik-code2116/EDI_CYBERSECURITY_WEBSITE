const path = require('path');
const fs = require('fs');
const Scan = require('../models/Scan');
const ThreatLog = require('../models/ThreatLog');
const { analyzeUrl, analyzeDocument } = require('../services/aiService');

// @desc    Analyze a URL
// @route   POST /api/analyze/url
const analyzeUrlHandler = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const start = Date.now();
    const aiResult = await analyzeUrl(url);
    const duration = Date.now() - start;

    const scan = await Scan.create({
      user: req.user._id,
      type: 'url',
      target: url,
      threatLevel: aiResult.threatLevel,
      threatScore: aiResult.threatScore,
      confidenceScore: aiResult.confidenceScore,
      detectedFeatures: aiResult.detectedFeatures || [],
      recommendation: aiResult.recommendation,
      aiExplanation: aiResult.aiExplanation,
      scanDuration: aiResult.scanDuration || duration,
      rawAiResponse: aiResult,
      status: 'completed',
    });

    // Log threat if score > 50
    if (aiResult.threatScore > 50) {
      await ThreatLog.create({
        scan: scan._id,
        user: req.user._id,
        threatType: 'URL Threat',
        severity:
          aiResult.threatScore > 80
            ? 'critical'
            : aiResult.threatScore > 60
            ? 'high'
            : 'medium',
        description: aiResult.aiExplanation,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(201).json({ scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Analyze a document (PDF/DOCX)
// @route   POST /api/analyze/document
const analyzeDocumentHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const fileType = mimetype === 'application/pdf' ? 'pdf' : 'docx';

    const start = Date.now();
    const aiResult = await analyzeDocument(filePath, originalname, mimetype);
    const duration = Date.now() - start;

    const scan = await Scan.create({
      user: req.user._id,
      type: fileType,
      target: filename,
      originalName: originalname,
      fileSize: size,
      pages: aiResult.pages,
      threatLevel: aiResult.threatLevel,
      threatScore: aiResult.threatScore,
      confidenceScore: aiResult.confidenceScore,
      detectedFeatures: aiResult.detectedFeatures || [],
      recommendation: aiResult.recommendation,
      aiExplanation: aiResult.aiExplanation,
      macrosFound: aiResult.macrosFound || false,
      hiddenObjects: aiResult.hiddenObjects || false,
      embeddedLinks: aiResult.embeddedLinks || [],
      scanDuration: aiResult.scanDuration || duration,
      rawAiResponse: aiResult,
      status: 'completed',
    });

    if (aiResult.threatScore > 50) {
      await ThreatLog.create({
        scan: scan._id,
        user: req.user._id,
        threatType: `${fileType.toUpperCase()} Document Threat`,
        severity:
          aiResult.threatScore > 80 ? 'critical' : aiResult.threatScore > 60 ? 'high' : 'medium',
        description: aiResult.aiExplanation,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(201).json({ scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeUrlHandler, analyzeDocumentHandler };
