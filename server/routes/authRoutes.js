const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match.');
        return true;
      }),
  ],
  register
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', refreshToken);

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail()],
  forgotPassword
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match.');
        return true;
      }),
  ],
  resetPassword
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
