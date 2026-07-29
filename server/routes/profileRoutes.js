const express = require('express');
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.put('/password', protect, changePassword);
router.delete('/', protect, deleteAccount);

module.exports = router;
