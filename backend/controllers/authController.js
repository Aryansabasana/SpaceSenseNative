/**
 * Authentication Controller
 * Handles registration, login, profile updates, and password reset.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid input.';
      return res.status(400).json({ message: firstMessage });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error while creating account.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.comparePassword(String(password));
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error while logging in.' });
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    user: req.user.toSafeJSON(),
  });
}

async function updateProfile(req, res) {
  try {
    const { name, preferredStyle, measurementUnit, profileImage } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      }
      req.user.name = trimmedName;
    }

    if (preferredStyle !== undefined) {
      req.user.preferredStyle = preferredStyle;
    }

    if (measurementUnit !== undefined) {
      req.user.measurementUnit = measurementUnit;
    }

    if (profileImage !== undefined) {
      req.user.profileImage = String(profileImage).trim();
    }

    req.user.profileCompleted = true;
    await req.user.save();

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: req.user.toSafeJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid profile data.';
      return res.status(400).json({ message: firstMessage });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error while updating profile.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Do not reveal whether the email exists in production responses
    if (!user) {
      return res.status(200).json({
        message: 'If an account matches that email, a reset code has been generated.',
      });
    }

    const resetCode = String(crypto.randomInt(100000, 999999));
    user.resetCodeHash = await bcrypt.hash(resetCode, 10);
    user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const responsePayload = {
      message: 'Password reset code generated (valid for 15 minutes).',
    };

    // Only expose the code in local development because email delivery is not configured yet
    if (process.env.NODE_ENV === 'development') {
      responsePayload.devResetCode = resetCode;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error while generating reset code.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetCodeHash +resetCodeExpiresAt +password'
    );

    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    if (user.resetCodeExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired. Request a new one.' });
    }

    const isCodeValid = await bcrypt.compare(String(code).trim(), user.resetCodeHash);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid reset code.' });
    }

    user.password = String(newPassword);
    user.resetCodeHash = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error while resetting password.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};
