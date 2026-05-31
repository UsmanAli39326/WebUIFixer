/**
 * WCAG Accessibility Rule Engine
 *
 * Implements deterministic, measurable WCAG-based checks:
 *   1. Color contrast (simplified luminance check)
 *   2. Font size minimum
 *   3. Missing text content on interactive elements
 */

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse an rgb/rgba CSS color string into { r, g, b, a }.
 * Returns null if the string cannot be parsed.
 */
function parseColor(colorStr) {
  if (!colorStr) return null;

  const match = colorStr.match(
    /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/
  );
  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Compute relative luminance (WCAG 2.x formula).
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two luminance values.
 * Returns a value between 1 and 21.
 */
function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a CSS pixel value like "16px" → 16. Returns NaN for non-px values.
 */
function parsePx(value) {
  if (!value || typeof value !== "string") return NaN;
  return parseFloat(value);
}

// ── Rules ────────────────────────────────────────────────────────────

/**
 * Rule 1 — Color Contrast
 * WCAG 2.1 SC 1.4.3: Minimum contrast ratio of 4.5:1 for normal text,
 * 3:1 for large text (≥ 18px bold or ≥ 24px).
 */
function checkColorContrast(element) {
  // Only check elements that have visible text
  if (!element.text) return null;

  const fg = parseColor(element.styles.color);
  const bg = parseColor(element.styles.backgroundColor);
  if (!fg || !bg) return null;

  // Skip fully transparent backgrounds (inherited; hard to evaluate here)
  if (bg.a === 0) return null;

  const fgLum = relativeLuminance(fg);
  const bgLum = relativeLuminance(bg);
  const ratio = contrastRatio(fgLum, bgLum);

  const fontSize = parsePx(element.styles.fontSize);
  const fontWeight = parseInt(element.styles.fontWeight, 10) || 400;
  const isLargeText =
    fontSize >= 24 || (fontSize >= 18 && fontWeight >= 700);

  const threshold = isLargeText ? 3 : 4.5;

  if (ratio < threshold) {
    return {
      id: "wcag-contrast",
      type: "accessibility",
      message: `Low color contrast ratio ${ratio.toFixed(2)}:1 (minimum ${threshold}:1 required). Foreground: ${element.styles.color}, Background: ${element.styles.backgroundColor}`,
      fix: `Increase the contrast between text color and background color to at least ${threshold}:1.`,
      severity: ratio < 2 ? "high" : "medium",
    };
  }

  return null;
}

/**
 * Rule 2 — Font Size Minimum
 * Text smaller than 12px is difficult to read for many users.
 */
function checkFontSize(element) {
  if (!element.text) return null;

  const fontSize = parsePx(element.styles.fontSize);
  if (isNaN(fontSize)) return null;

  if (fontSize < 12) {
    return {
      id: "wcag-font-size",
      type: "accessibility",
      message: `Font size ${fontSize}px is below the 12px minimum for readability.`,
      fix: `Increase font size to at least 12px.`,
      severity: fontSize < 10 ? "high" : "medium",
    };
  }

  return null;
}

/**
 * Rule 3 — Missing Text Content on Interactive Elements
 * Buttons, links, and inputs must have a discernible text label.
 */
function checkMissingText(element) {
  if (!element.isInteractive) return null;

  const hasText = !!(
    element.text ||
    element.ariaLabel ||
    element.alt
  );

  if (!hasText) {
    return {
      id: "wcag-missing-text",
      type: "accessibility",
      message: `Interactive <${element.tag}> element has no text content, aria-label, or alt text.`,
      fix: `Add descriptive text content, an aria-label attribute, or alt text to this element.`,
      severity: "high",
    };
  }

  return null;
}

/**
 * Rule 4 — Form Field Labels
 * WCAG 1.3.1: Form inputs must have an associated label or descriptive attribute.
 */
function checkFormLabels(element) {
  if (!['input', 'select', 'textarea'].includes(element.tag)) return null;
  // Ignore hidden inputs or non-interactive types
  if (element.attributes && (element.attributes.type === 'hidden' || element.attributes.type === 'submit' || element.attributes.type === 'button')) return null;

  const hasLabel = !!(
    element.ariaLabel ||
    element.ariaLabelledBy ||
    element.title ||
    (element.id && true) // Scraper might not link labels directly, but checking aria attributes and placeholder helps.
  );

  const placeholder = element.attributes ? element.attributes.placeholder : null;

  if (!hasLabel && !placeholder) {
    return {
      id: "wcag-form-label",
      type: "accessibility",
      message: `Form field <${element.tag}> has no associated label or descriptive attribute.`,
      fix: "Add an aria-label, title, or a linked <label>.",
      severity: "high"
    };
  }
  return null;
}

/**
 * Rule 5 — Focus Visible
 * WCAG 2.4.7: Interactive elements must have a visible focus indicator.
 */
function checkFocusIndicator(element) {
  if (!element.isInteractive) return null;

  const styles = element.styles || {};
  const outline = styles.outline || 'none';
  const boxShadow = styles.boxShadow || 'none';
  
  // Browsers apply default outlines, but if explicitly set to none without box-shadow fallback:
  if (outline === 'none' && boxShadow === 'none' && styles.outlineWidth === '0px') {
    return {
      id: "wcag-focus-visible",
      type: "accessibility",
      message: `Interactive element <${element.tag}> may not have a visible focus indicator.`,
      fix: "Ensure an outline or box-shadow is present on :focus state.",
      severity: "medium"
    };
  }
  return null;
}

/**
 * Rule 6 — Color Not Sole Means
 * WCAG 1.4.1: Color must not be used as the sole method of conveying meaning.
 */
function checkColorNotSoleMeans(element) {
  if (!element.text && element.styles && element.styles.backgroundColor && element.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    // If it's a structural element (like div/span) without text/icon but has background color, it might be a status indicator.
    // Exclude images, inputs, and elements with aria labels.
    if (!['img', 'input', 'canvas', 'svg'].includes(element.tag) && !element.ariaLabel && !element.alt) {
      return {
        id: "wcag-color-not-sole-means",
        type: "accessibility",
        message: "Color may be the only way to distinguish this element.",
        fix: "Add text, an icon, or a pattern in addition to color to convey meaning.",
        severity: "medium"
      };
    }
  }
  return null;
}

// ── Public API ───────────────────────────────────────────────────────

const wcagRules = [
  checkColorContrast, 
  checkFontSize, 
  checkMissingText, 
  checkFormLabels, 
  checkFocusIndicator, 
  checkColorNotSoleMeans
];

/**
 * Run all WCAG rules against a single element.
 * @param {object} element - Scraped element data.
 * @returns {Array} Array of issue objects (may be empty).
 */
function runWcagRules(element) {
  const issues = [];
  for (const rule of wcagRules) {
    const result = rule(element);
    if (result) {
      issues.push(result);
    }
  }
  return issues;
}

module.exports = { runWcagRules, parseColor, relativeLuminance, contrastRatio };
