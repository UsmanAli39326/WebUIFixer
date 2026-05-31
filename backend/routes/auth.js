const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { registrationValidator, loginValidator } = require("../validation");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "webfixer_secret_key_123";

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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    res.json({ message: "Login successful", token });
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
    // TODO: Add token to blacklist in Redis or database
    // For now, client-side logout (token removal from localStorage)
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
      return res.json({ message: "If email exists, password reset link has been sent" });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    
    // Simulate sending email by logging token to server console
    console.log(`\n========================================================`);
    console.log(`🔒 EMAIL SENT TO: ${email}`);
    console.log(`🔑 PASSWORD RESET TOKEN: ${resetToken}`);
    console.log(`========================================================\n`);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to process request" });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and password required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
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

module.exports = router;
