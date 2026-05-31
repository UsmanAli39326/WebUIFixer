const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Audit = require("../models/Audit");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/user/profile
 * Fetch logged-in user profile
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    // using findById (which we implemented as returning lean object or mongoose doc depending on implementation, 
    // but in User.js we just return the mongoose doc to allow .password checks etc., 
    // although our User schema toJSON removes password, so we can just send it).
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /api/user/profile
 * Update profile details
 */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, profile } = req.body;
    const updatedUser = await User.updateProfile(req.user.id, { name, profile });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * PUT /api/user/change-password
 * Change password for authenticated user
 */
router.put("/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Both passwords required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash and set new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account (irreversible)
 */
router.delete("/account", verifyToken, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required to delete account" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    // Delete user and their audits
    await User.deleteById(req.user.id);
    
    // We can also delete user's audits from Audit collection
    // Note: Assuming Audit model has a deleteMany method, or we can use mongoose model directly.
    const mongoose = require('mongoose');
    await mongoose.model('Audit').deleteMany({ userId: req.user.id });

    res.json({ message: "Account deleted permanently" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

/**
 * GET /api/user/audits
 * Get user's analysis history
 */
router.get("/audits", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const auditData = await Audit.getByUserId(req.user.id, page, limit);
    res.json(auditData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audits" });
  }
});

/**
 * GET /api/user/admin/users
 * Admin only: List all users
 */
router.get("/admin/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const allUsers = await User.findAll();
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
