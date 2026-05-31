const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Template = require("../models/Template");
const Download = require("../models/Download");
const Payment = require("../models/Payment");
const { verifyToken } = require("../middleware/auth");
const { analyzeWebsite } = require("../ai/fastapiClient");

const router = express.Router();

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = ['application/zip', 'application/x-zip-compressed', 'image/png', 'image/jpeg', 'image/webp'];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
});

/**
 * POST /api/marketplace/upload
 * Upload a template (via URL and optional file), AI checks it.
 */
router.post("/upload", verifyToken, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  const { title, url, price, category, description } = req.body;
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
    
    let filePath = "";
    if (req.files && req.files.file) {
      filePath = req.files.file[0].filename;
    }

    let imagePath = "";
    if (req.files && req.files.image) {
      imagePath = req.files.image[0].filename;
    }

    const newTemplate = await Template.add({
      userId: req.user.id,
      title,
      url,
      price: numericPrice,
      category: category || "",
      description: description || "",
      score,
      status,
      filePath,
      imagePath,
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

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

/**
 * GET /api/marketplace/templates
 * Get all approved templates for sale, with optional search query
 */
router.get("/templates", async (req, res) => {
  try {
    const { search } = req.query;
    let templates = await Template.findAllApproved();
    
    if (search) {
      const q = search.toLowerCase();
      templates = templates.filter(t => t.title.toLowerCase().includes(q));
    }
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

/**
 * GET /api/marketplace/templates/:id/download
 * Download the uploaded ZIP file for a template
 */
router.get("/templates/:id/download", verifyToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    if (!template.filePath) {
      return res.status(404).json({ error: "No file was uploaded for this template" });
    }

    const file = path.join(uploadDir, template.filePath);
    if (!fs.existsSync(file)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    
    res.download(file, err => {
      if (!err) {
        Download.create({ templateId: template.id, userId: req.user.id }).catch(console.error);
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to download template" });
  }
});

/**
 * POST /api/marketplace/templates/:id/purchase
 * Stub endpoint for template purchases
 */
router.post('/templates/:id/purchase', verifyToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    await Payment.create({ userId: req.user.id, templateId: template.id, amount: template.price });
    res.status(501).json({ message: 'Payment processing not yet implemented. Record created.' });
  } catch (err) {
    res.status(500).json({ error: "Failed to process purchase" });
  }
});



module.exports = router;
