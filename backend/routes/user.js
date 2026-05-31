const express = require("express");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/user/profile
 * Fetch logged-in user profile
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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
    const updatedUser = await User.updateProfile(req.user.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ message: "Profile updated", user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
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
