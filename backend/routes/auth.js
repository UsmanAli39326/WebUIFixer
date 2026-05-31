const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");
const RefreshToken = require("../models/RefreshToken");
const crypto = require('crypto');
const { log } = require('../services/activityLogger');
const { sendPasswordResetEmail } = require('../services/emailService');
const { registrationValidator, loginValidator } = require("../validation");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");

/**
 * POST /api/auth/register
 */
router.post("/register", registrationValidator, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user"
    };

    const createdUser = await User.create(newUser);

    res.status(201).json({ message: "User registered", user: createdUser });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", loginValidator, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is suspended. Contact support." });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const storedToken = await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    user.lastLogin = new Date();
    try {
      await user.save();
    } catch (saveErr) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw saveErr;
    }

    log(user.id, 'login', { ip: req.ip });
    res.json({ message: "Login successful", token, refreshToken });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate user token (add to blacklist)
 */
router.post("/logout", verifyToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await TokenBlacklist.create({ token, expiresAt });
      }
    }
    log(req.user.id, 'logout');
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security)
      return res.json({ message: "If email exists, password reset OTP has been sent" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.passwordResetOtp = otp;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    
    await sendPasswordResetEmail(email, otp);

    res.json({ message: "If email exists, password reset OTP has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with OTP
 */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password required" });
  }

  try {
    const user = await User.findByEmail(email);

    if (!user || user.passwordResetOtp !== otp || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code required" });
  }

  try {
    // TODO: Verify email code from database
    // For now, simple validation
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark as verified
    user.emailVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User is inactive or deleted' });
    }
    
    const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token: newToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;
