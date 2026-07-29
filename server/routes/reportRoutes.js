const express = require('express');
const { generateReport, getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getReports);
router.get('/:scanId', protect, generateReport);

module.exports = router;
