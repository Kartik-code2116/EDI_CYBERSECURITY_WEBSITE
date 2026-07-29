const express = require('express');
const { analyzeUrlHandler, analyzeDocumentHandler } = require('../controllers/analyzeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/url', protect, analyzeUrlHandler);
router.post('/document', protect, upload.single('file'), analyzeDocumentHandler);

module.exports = router;
