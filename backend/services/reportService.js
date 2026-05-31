const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * Report Generation Service
 */
const ReportService = {
  /**
   * Generates a professional PDF report.
   */
  generatePDF: async (auditData, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(25).text("Web Auditor - Accessibility Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`URL: ${auditData.url}`, { color: "blue" });
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Summary Section
    doc.fontSize(18).text("Summary of Findings", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Issues: ${auditData.summary.totalIssues}`);
    doc.text(`- Critical: ${auditData.summary.bySeverity.critical}`);
    doc.text(`- High: ${auditData.summary.bySeverity.high}`);
    doc.text(`- Medium: ${auditData.summary.bySeverity.medium}`);
    doc.text(`- Low: ${auditData.summary.bySeverity.low}`);
    doc.moveDown();

    // Detailed Issues
    doc.fontSize(18).text("Detailed Issues", { underline: true });
    doc.moveDown(0.5);

    auditData.issues.forEach((issue, index) => {
      if (doc.y > 650) doc.addPage(); // Basic pagination

      doc.fontSize(12).font("Helvetica-Bold").text(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.element}`);
      doc.font("Helvetica").fontSize(10).text(`Issue: ${issue.issue}`);
      doc.text(`Suggested Fix: ${issue.fix}`, { color: "green" });
      doc.moveDown(0.5);
    });

    doc.end();
  },

  /**
   * Generates a self-contained HTML report.
   */
  generateHTML: (auditData) => {
    const esc = (str) => String(str).replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[match]);

    const issuesHtml = auditData.issues.map(i => `
      <div class="issue-card severity-${esc(i.severity)}">
        <div class="header">
          <strong>&lt;${esc(i.element)}&gt;</strong>
          <span class="badge">${esc(i.severity)}</span>
        </div>
        <p>${esc(i.issue)}</p>
        <p class="fix"><strong>Fix:</strong> ${esc(i.fix)}</p>
      </div>
    `).join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Web Auditor Report - ${esc(auditData.url)}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
          .summary { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .issue-card { border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 5px solid #ccc; }
          .severity-critical { border-left-color: #d946ef; }
          .severity-high { border-left-color: #ef4444; }
          .severity-medium { border-left-color: #f59e0b; }
          .severity-low { border-left-color: #3b82f6; }
          .badge { float: right; text-transform: uppercase; font-size: 0.8em; font-weight: bold; }
          .fix { color: #059669; }
          h1 { color: #6366f1; }
        </style>
      </head>
      <body>
        <h1>Web Auditor Report</h1>
        <div class="summary">
          <h2>Summary for ${esc(auditData.url)}</h2>
          <p>Total Issues Found: <strong>${auditData.summary.totalIssues}</strong></p>
          <ul>
            <li>Critical: ${auditData.summary.bySeverity.critical}</li>
            <li>High: ${auditData.summary.bySeverity.high}</li>
          </ul>
        </div>
        <div class="issues">
          ${issuesHtml}
        </div>
      </body>
      </html>
    `;
  }
};

module.exports = ReportService;
