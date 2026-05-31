const express = require("express");
const User = require("../models/User");
const Audit = require("../models/Audit");
const Template = require("../models/Template");
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

    res.json({
      totalUsers: users.length,
      totalAudits: audits.length,
      totalTemplates: templates.length
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

module.exports = router;
