const express = require("express");
const Template = require("../models/Template");
const { verifyToken } = require("../middleware/auth");
const { analyzeWebsite } = require("../ai/fastapiClient");

const router = express.Router();

/**
 * POST /api/marketplace/upload
 * Upload a template (via URL), AI checks it.
 */
router.post("/upload", verifyToken, async (req, res) => {
  const { title, url, price } = req.body;
  if (!title || !url || price === undefined) {
    return res.status(400).json({ error: "Missing title, url, or price" });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: "Price must be a positive number" });
  }

  try {
    // Call AI engine to analyze the template (useAi = false)
    const analysis = await analyzeWebsite(url, false);
    
    // Check if the currentScore is returned
    const score = analysis.summary?.currentScore || 0;
    
    const threshold = 80;
    const isApproved = score >= threshold;
    const status = isApproved ? "approved" : "rejected";

    const newTemplate = await Template.create({
      userId: req.user.id,
      title,
      url,
      price: numericPrice,
      score,
      status,
      issues: analysis.issues // Store issues so user can see why it was rejected
    });

    res.status(isApproved ? 201 : 200).json({
      message: isApproved ? "Template approved and listed!" : "Template rejected due to low score. See issues for details.",
      template: newTemplate
    });
  } catch (err) {
    console.error("[Marketplace] Upload failed:", err.message);
    res.status(500).json({ error: "Failed to analyze and upload template. " + err.message });
  }
});

/**
 * GET /api/marketplace/templates
 * Get all approved templates for sale.
 */
router.get("/templates", async (req, res) => {
  try {
    const templates = await Template.findAllApproved();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

module.exports = router;
