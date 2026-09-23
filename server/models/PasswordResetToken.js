const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * PasswordResetToken — secure password reset flow
 *
 * Security properties:
 * - Token stored as SHA-256 hash — raw token is never saved to DB
 * - Expires in 1 hour
 * - Single-use: marked `used` after first consumption
 * - One active token per user (old tokens replaced on new request)
 */
const passwordResetTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Only the HASH of the token is stored here — never the raw token
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Automatically remove expired tokens from DB after TTL
    expires: 3600, // seconds — MongoDB TTL index
  },
});

/**
 * Static: Generate a secure raw token and return it along
 * with the hash to store. The raw token is sent to the user;
 * only the hash goes to the database.
 */
passwordResetTokenSchema.statics.generateToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

/**
 * Static: Hash a raw token for DB lookup.
 */
passwordResetTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
