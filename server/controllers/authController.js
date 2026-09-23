const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

/**
 * Sanitize a caught error for client responses.
 * Never leaks raw mongoose/DB error messages in production.
 */
const sanitizeError = (error, fallback = 'Something went wrong. Please try again.') => {
  if (process.env.NODE_ENV === 'development') return error.message;
  return fallback;
};

// ── @desc    Register user ────────────────────────────────────────────────────
// ── @route   POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ name: name.trim(), email, password });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[register]', error);
    return res.status(500).json({ error: sanitizeError(error) });
  }
};

// ── @desc    Login user ───────────────────────────────────────────────────────
// ── @route   POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Single generic message prevents user enumeration
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        darkMode: user.darkMode,
      },
    });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({ error: sanitizeError(error) });
  }
};

// ── @desc    Refresh access token ─────────────────────────────────────────────
// ── @route   POST /api/auth/refresh
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh token required.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.json({ token: generateToken(user._id) });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

// ── @desc    Forgot password — generate & store reset token ──────────────────
// ── @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond the same way — prevents user enumeration
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Invalidate any existing tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Generate a new secure token
    const { rawToken, tokenHash } = PasswordResetToken.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

    // In production: send email with reset link containing rawToken
    // e.g. https://yourapp.com/reset-password?token=<rawToken>
    //
    // In development: return token directly so you can test without email setup
    const isDev = process.env.NODE_ENV === 'development';

    return res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(isDev && {
        _dev_reset_token: rawToken,
        _dev_note: 'This field is only shown in development mode. Remove email bypass before going to production.',
        _dev_reset_url: `http://localhost:5173/reset-password?token=${rawToken}`,
      }),
    });
  } catch (error) {
    console.error('[forgotPassword]', error);
    return res.status(500).json({ error: sanitizeError(error) });
  }
};

// ── @desc    Reset password using token ───────────────────────────────────────
// ── @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) return res.status(400).json({ error: 'Reset token is required.' });
  if (!password) return res.status(400).json({ error: 'New password is required.' });
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    const tokenHash = PasswordResetToken.hashToken(token);

    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({
        error: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    const user = await User.findById(resetRecord.user);
    if (!user || !user.isActive) {
      return res.status(400).json({ error: 'Account not found or deactivated.' });
    }

    // Update password — the pre-save hook in User model will hash it
    user.password = password;
    await user.save();

    // Invalidate the token so it cannot be reused
    resetRecord.used = true;
    await resetRecord.save();

    return res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[resetPassword]', error);
    return res.status(500).json({ error: sanitizeError(error) });
  }
};

// ── @desc    Get current user ─────────────────────────────────────────────────
// ── @route   GET /api/auth/me
const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { register, login, refreshToken, forgotPassword, resetPassword, getMe };
