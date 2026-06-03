/**
 * Web Accessibility & Design Rule Auditor — Express Server
 */

require("dotenv").config();
const express = require("express");
const { analyzeWebsite, checkHealth } = require("./ai/fastapiClient");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const marketplaceRoutes = require("./routes/marketplace");
const adminRoutes = require("./routes/admin");
const recommendationsRoutes = require('./routes/recommendations');
const { verifyToken } = require("./middleware/auth");
const Audit = require("./models/Audit"); // Updated to use Mongoose model
const ReportService = require("./services/reportService");
const { connectDatabase } = require("./db");
const logger = require("./logger");
const { log } = require('./services/activityLogger');
const { apiLimiter, authLimiter, auditLimiter } = require("./middleware/rateLimiter");
const { urlValidator } = require("./validation");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────

app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// CORS
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173", "https://webfixer-frontend.com", "https://kreate-ui.vercel.app"];

app.use((req, res, next) => {
  const origin = req.headers.origin; ``
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// ── API Routes ──────────────────────────────────────────────────────
app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes); // Stricter limit for auth
app.use("/api/user", userRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationsRoutes);
const path = require("path");
app.use('/api/marketplace/uploads', (req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none';");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", "attachment");
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ── Helpers ──────────────────────────────────────────────────────────

const dns = require('dns').promises;

/**
 * Basic URL validation with robust SSRF protection.
 */
async function isSafeUrl(str) {
  try {
    const url = new URL(str);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const hostname = url.hostname;

    // Quick block for exact string matches
    if (hostname === "localhost" || hostname === "[::1]" || hostname === "::1") {
      return false;
    }

    try {
      const lookup = await dns.lookup(hostname);
      const ip = lookup.address;

      // Blocklist for SSRF prevention on resolved IP
      if (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("169.254.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
        ip.startsWith("0.") ||
        ip === "0.0.0.0"
      ) {
        return false;
      }
    } catch (dnsErr) {
      // If DNS resolution fails, we shouldn't audit it anyway
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ── Routes ───────────────────────────────────────────────────────────

/**
 * GET /audit?url=<target>&ai=true
 *
 * Query params:
 *   url  (required) — The page URL to audit.
 *   ai   (optional) — Set to "true" to request AI-generated fixes.
 */
app.get("/audit", verifyToken, auditLimiter, urlValidator, async (req, res) => {
  const { url, ai } = req.query;
  const useAi = ai === "true";

  // 1. Validate URL
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  const safe = await isSafeUrl(url);
  if (!safe) {
    return res.status(400).json({
      error: `Invalid URL: "${url}". Must be a valid http or https URL.`,
    });
  }

  logger.info(`[Audit] Delegating audit for ${url} to AI Engine (AI Fix: ${useAi})...`);

  try {
    const startTime = Date.now();

    // 2. Delegate analysis and AI fixing to FastAPI
    const result = await analyzeWebsite(url, useAi);

    const duration = Date.now() - startTime;
    logger.info(`[Audit] AI Engine completed in ${duration}ms`);

    // 3. Save to Audit Store for reporting
    const auditId = Date.now().toString();
    logger.debug("Audit result issues:", { type: typeof result.issues, isArray: Array.isArray(result.issues) });
    await Audit.saveAudit(auditId, { ...result, url, userId: req.user.id });
    log(req.user.id, 'audit_created', { url });

    res.json({
      id: auditId,
      url,
      summary: result.summary,
      issues: result.issues,
      fixedHtml: result.fixedHtml,
      styleOverlay: result.styleOverlay,
      duration
    });

  } catch (err) {
    logger.error(`[Audit] Failed: ${err.message}`);

    // Classify errors
    if (err.message.includes("Timeout")) {
      return res.status(504).json({ error: `Timeout: ${err.message}` });
    }
    if (err.message.includes("Network error") || err.message.includes("ECONNREFUSED")) {
      return res.status(502).json({ error: "AI Engine is unavailable. Please check if the FastAPI server is running." });
    }

    return res.status(500).json({ error: `Audit failed: ${err.message}` });
  }
});

/**
 * GET /api/audit/:id/report/pdf
 */
app.get("/api/audit/:id/report/pdf", verifyToken, async (req, res) => {
  try {
    const audit = await Audit.get(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found" });

    if (audit.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=audit-report-${req.params.id}.pdf`);

    await ReportService.generatePDF(audit, res);
    log(undefined, 'report_downloaded', { auditId: req.params.id });
  } catch (err) {
    logger.error("Error generating PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

/**
 * GET /api/audit/:id/report/html
 */
app.get("/api/audit/:id/report/html", verifyToken, async (req, res) => {
  try {
    const audit = await Audit.get(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found" });

    if (audit.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const html = ReportService.generateHTML(audit);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    logger.error("Error generating HTML:", err);
    res.status(500).json({ error: "Failed to generate HTML" });
  }
});

/**
 * DELETE /api/audit/:id
 * Delete an audit report
 */
app.delete("/api/audit/:id", verifyToken, async (req, res) => {
  try {
    const audit = await Audit.get(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found" });
    if (audit.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    await Audit.delete(req.params.id);
    res.json({ message: "Audit deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete audit" });
  }
});

/**
 * PATCH /api/audit/:id/suggestions/:ruleId/accept
 * Mark an AI suggestion as accepted
 */
app.patch("/api/audit/:id/suggestions/:ruleId/accept", verifyToken, async (req, res) => {
  try {
    const audit = await Audit.get(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found" });
    if (audit.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const updated = await Audit.setIssueAccepted(req.params.id, req.params.ruleId, true);
    res.json(updated || { error: "Suggestion not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept suggestion" });
  }
});

/**
 * PATCH /api/audit/:id/suggestions/:ruleId/reject
 * Mark an AI suggestion as rejected
 */
app.patch("/api/audit/:id/suggestions/:ruleId/reject", verifyToken, async (req, res) => {
  try {
    const audit = await Audit.get(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found" });
    if (audit.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const updated = await Audit.setIssueAccepted(req.params.id, req.params.ruleId, false);
    res.json(updated || { error: "Suggestion not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject suggestion" });
  }
});

/**
 * GET /health — Health check endpoint.
 */
app.get("/health", async (req, res) => {
  const aiEngineHealth = await checkHealth();
  res.json({
    status: "ok",
    aiEngine: aiEngineHealth,
    uptime: process.uptime(),
  });
});

/**
 * GET / — Root info.
 */
app.get("/", (req, res) => {
  res.json({
    name: "Web Accessibility & Design Rule Auditor",
    version: "1.0.0",
    endpoints: {
      audit: "GET /audit?url=<target>&ai=true",
      health: "GET /health",
    },
  });
});

// ── Start Server ─────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      logger.info(`\n🚀 Auditor API running at http://localhost:${PORT}`);
      logger.info(`   Try: http://localhost:${PORT}/audit?url=https://example.com`);
      logger.info(`   AI Engine: http://localhost:8000\n`);
    });
  });
}

module.exports = app;
