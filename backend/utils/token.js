/**
 * JWT helper for signing and verifying authentication tokens.
 */
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set in backend/.env');
  }

  if (secret === 'replace_with_a_long_random_secret_string') {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Default JWT_SECRET placeholder cannot be used outside development');
    }
    console.warn(
      'WARNING: Using placeholder JWT_SECRET from .env.example. Replace it with a strong random string.'
    );
  }

  return secret;
}

function generateToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  generateToken,
  verifyToken,
};
