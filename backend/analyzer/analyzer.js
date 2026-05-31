/**
 * Analyzer Module
 *
 * Orchestrates all rule engines against scraped element data.
 * Runs per-element WCAG + design rules, then page-level design rules.
 */

const { runWcagRules } = require("../rules/wcagRules");
const { runDesignRules, checkColorConsistency } = require("../rules/designRules");

/**
 * Analyze an array of scraped elements against all rule engines.
 *
 * @param {Array} elements - Array of element objects from the scraper.
 * @returns {{ issues: Array, summary: object }}
 */
function analyze(elements) {
  const issues = [];
  const severityCounts = { high: 0, medium: 0, low: 0 };
  const typeCounts = { accessibility: 0, design: 0 };

  // ── Per-element rules ──────────────────────────────────────────────
  for (const element of elements) {
    // WCAG rules
    const wcagIssues = runWcagRules(element);
    for (const issue of wcagIssues) {
      issues.push({
        element: element.tag,
        id: element.id || "",
        className: element.className || "",
        text: element.text ? element.text.substring(0, 80) : "",
        issue: issue.message,
        fix: issue.fix,
        type: issue.type,
        severity: issue.severity,
        ruleId: issue.id,
      });
      severityCounts[issue.severity]++;
      typeCounts[issue.type]++;
    }

    // Design rules
    const designIssues = runDesignRules(element);
    for (const issue of designIssues) {
      issues.push({
        element: element.tag,
        id: element.id || "",
        className: element.className || "",
        text: element.text ? element.text.substring(0, 80) : "",
        issue: issue.message,
        fix: issue.fix,
        type: issue.type,
        severity: issue.severity,
        ruleId: issue.id,
      });
      severityCounts[issue.severity]++;
      typeCounts[issue.type]++;
    }
  }

  // ── Page-level rules ───────────────────────────────────────────────
  const colorIssues = checkColorConsistency(elements);
  for (const issue of colorIssues) {
    issues.push({
      element: issue.element || "page",
      text: "",
      issue: issue.message,
      fix: issue.fix,
      type: issue.type,
      severity: issue.severity,
      ruleId: issue.id,
    });
    severityCounts[issue.severity]++;
    typeCounts[issue.type]++;
  }

  // ── Summary stats ──────────────────────────────────────────────────
  const summary = {
    totalIssues: issues.length,
    bySeverity: { ...severityCounts },
    byType: { ...typeCounts },
    elementsScanned: elements.length,
  };

  return { issues, summary };
}

module.exports = { analyze };
