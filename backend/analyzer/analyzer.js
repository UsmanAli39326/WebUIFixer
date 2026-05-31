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

  if (!Array.isArray(elements)) {
    throw new Error("Elements must be an array");
  }
  
  const validElements = elements.filter(el => el && typeof el === 'object');
  if (validElements.length === 0) {
    throw new Error("No valid elements to analyze");
  }

  // ── Per-element rules ──────────────────────────────────────────────
  for (const element of validElements) {
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
  
  // 1. Color Consistency
  const colorIssues = checkColorConsistency(validElements);
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

  // 2. Page Title (WCAG 2.4.2)
  const titleElement = validElements.find(el => el.tag === 'title');
  if (!titleElement || !titleElement.text || titleElement.text.trim() === '') {
    issues.push({
      element: "title",
      id: "wcag-page-title",
      className: "",
      text: "",
      issue: "Page has no descriptive title",
      fix: "Add a <title> tag with descriptive text in the <head>",
      type: "accessibility",
      severity: "high",
      ruleId: "wcag-page-title"
    });
    severityCounts["high"]++;
    typeCounts["accessibility"]++;
  } else if (titleElement.text.trim().length < 5) {
    issues.push({
      element: "title",
      id: "wcag-title-too-short",
      className: "",
      text: titleElement.text.trim(),
      issue: "Page title is too short or generic",
      fix: "Use a descriptive page title (20-60 characters)",
      type: "accessibility",
      severity: "medium",
      ruleId: "wcag-title-too-short"
    });
    severityCounts["medium"]++;
    typeCounts["accessibility"]++;
  }

  // 3. Language Declaration (WCAG 3.1.1)
  const htmlElement = validElements.find(el => el.tag === 'html');
  const lang = htmlElement && htmlElement.attributes ? htmlElement.attributes.lang : null;
  if (!lang) {
    issues.push({
      element: "html",
      id: "wcag-language-missing",
      className: "",
      text: "",
      issue: "Page has no language declaration",
      fix: "Add a lang attribute to the <html> tag (e.g., lang='en')",
      type: "accessibility",
      severity: "medium",
      ruleId: "wcag-language-missing"
    });
    severityCounts["medium"]++;
    typeCounts["accessibility"]++;
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
