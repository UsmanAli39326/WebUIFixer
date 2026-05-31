const express = require('express');
const Audit = require('../models/Audit');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/recommendations/:auditId
router.get('/:auditId', verifyToken, async (req, res) => {
  const audit = await Audit.get(req.params.auditId);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  if (audit.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ auditId: req.params.auditId, recommendations: audit.issues });
});

module.exports = router;
