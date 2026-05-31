const express = require("express");
const User = require("../models/User");
const Audit = require("../models/Audit");
const Template = require("../models/Template");
const Download = require("../models/Download");
const Payment = require("../models/Payment");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/admin/analytics
 * Fetch global analytics
 */
router.get("/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    const audits = await Audit.getAll();
    const templates = await Template.getAll();
    const downloads = await Download.countDocuments();
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalUsers: users.length,
      totalAudits: audits.length,
      totalTemplates: templates.length,
      totalDownloads: downloads,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account
 */
router.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await User.deleteById(req.params.id);
    
    // Also clean up their audits
    const mongoose = require('mongoose');
    await mongoose.model('Audit').deleteMany({ userId: req.params.id });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * PATCH /api/admin/users/:id/block
 * Toggle block status
 */
router.patch("/users/:id/block", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Need to update isActive status
    const mongoose = require('mongoose');
    const UserModel = mongoose.model('User');
    
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: req.params.id },
      { isActive: !user.isActive },
      { new: true }
    );

    res.json({ message: "User status updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

const ActivityLog = require('../models/ActivityLog');
router.get('/logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const logs = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

module.exports = router;
