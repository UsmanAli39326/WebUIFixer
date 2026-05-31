/**
 * Web Accessibility & Design Rule Auditor — Express Server
 */

require("dotenv").config();
const express = require("express");
const { analyzeWebsite, checkHealth } = require("./ai/fastapiClient");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const marketplaceRoutes = require("./routes/marketplace");
const { verifyToken } = require("./middleware/auth");
const AuditStore = require("./models/Audit");
const ReportService = require("./services/reportService");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────

app.use(express.json());

// CORS
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173", "https://webfixer-frontend.com"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
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
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/marketplace", marketplaceRoutes);

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Basic URL validation with SSRF protection.
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    
    const hostname = url.hostname;
    
    // Blocklist for SSRF prevention
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
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
app.get("/audit", verifyToken, async (req, res) => {
  const { url, ai } = req.query;
  const useAi = ai === "true";

  // 1. Validate URL
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: `Invalid URL: "${url}". Must be a valid http or https URL.`,
    });
  }

  console.log(`[Audit] Delegating audit for ${url} to AI Engine (AI Fix: ${useAi})...`);

  try {
    const startTime = Date.now();
    
    // 2. Delegate analysis and AI fixing to FastAPI
    const result = await analyzeWebsite(url, useAi);
    
    const duration = Date.now() - startTime;
    console.log(`[Audit] AI Engine completed in ${duration}ms`);

    // 3. Save to Audit Store for reporting
    const auditId = Date.now().toString();
    AuditStore.save(auditId, { ...result, url });

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
    console.error("[Audit] Failed:", err.message);
    
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
app.get("/api/audit/:id/report/pdf", async (req, res) => {
  const audit = AuditStore.get(req.params.id);
  if (!audit) return res.status(404).json({ error: "Audit not found" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=audit-report-${req.params.id}.pdf`);
  
  await ReportService.generatePDF(audit, res);
});

/**
 * GET /api/audit/:id/report/html
 */
app.get("/api/audit/:id/report/html", (req, res) => {
  const audit = AuditStore.get(req.params.id);
  if (!audit) return res.status(404).json({ error: "Audit not found" });

  const html = ReportService.generateHTML(audit);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
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

app.listen(PORT, () => {
  console.log(`\n🚀 Auditor API running at http://localhost:${PORT}`);
  console.log(`   Try: http://localhost:${PORT}/audit?url=https://example.com`);
  console.log(`   AI Engine: http://localhost:8000\n`);
});
