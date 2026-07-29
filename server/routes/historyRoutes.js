const express = require('express');
const { getHistory, getScan, deleteScan, getStats } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, getStats);
router.get('/', protect, getHistory);
router.get('/:id', protect, getScan);
router.delete('/:id', protect, deleteScan);

module.exports = router;
