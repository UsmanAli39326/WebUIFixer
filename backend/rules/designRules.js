/**
 * Design System Rule Engine
 *
 * Implements measurable, objective design-system checks:
 *   1. Spacing system adherence (margins / padding)
 *   2. Font scale consistency
 *   3. Color usage consistency (excessive unique colors)
 */

// ── Constants ────────────────────────────────────────────────────────

/** Allowed spacing values in px */
const SPACING_SCALE = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]);

/** Allowed font sizes in px */
const FONT_SCALE = new Set([10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]);

/** Maximum unique foreground colors before flagging */
const MAX_UNIQUE_COLORS = 6;

// ── Helpers ──────────────────────────────────────────────────────────

function parsePx(value) {
  if (!value || typeof value !== "string") return NaN;
  return parseFloat(value);
}

/**
 * Find the closest allowed value from a scale set.
 */
function closestInScale(value, scale) {
  let closest = 0;
  let minDiff = Infinity;
  for (const s of scale) {
    const diff = Math.abs(value - s);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
}

// ── Rules ────────────────────────────────────────────────────────────

/**
 * Rule 1 — Spacing System
 * Check that margin and padding values align to the spacing scale.
 * Tolerance: ±1px (accounts for subpixel rounding).
 */
function checkSpacing(element) {
  const issues = [];
  const spacingProps = [
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
  ];

  for (const prop of spacingProps) {
    const raw = element.styles[prop];
    const px = parsePx(raw);
    if (isNaN(px) || px === 0) continue;

    // Check if close to any allowed value (±1px tolerance)
    let onScale = false;
    for (const s of SPACING_SCALE) {
      if (Math.abs(px - s) <= 1) {
        onScale = true;
        break;
      }
    }

    if (!onScale) {
      const closest = closestInScale(px, SPACING_SCALE);
      issues.push({
        id: "design-spacing",
        type: "design",
        message: `<${element.tag}> has ${prop}: ${raw} which does not align to the spacing scale [${[...SPACING_SCALE].join(", ")}].`,
        fix: `Change ${prop} to ${closest}px (nearest scale value).`,
        severity: "low",
      });
    }
  }

  return issues;
}

/**
 * Rule 2 — Font Scale
 * Ensure font sizes match the typographic scale.
 * Tolerance: ±0.5px.
 */
function checkFontScale(element) {
  if (!element.text) return [];

  const px = parsePx(element.styles.fontSize);
  if (isNaN(px)) return [];

  let onScale = false;
  for (const s of FONT_SCALE) {
    if (Math.abs(px - s) <= 0.5) {
      onScale = true;
      break;
    }
  }

  if (!onScale) {
    const closest = closestInScale(px, FONT_SCALE);
    return [
      {
        id: "design-font-scale",
        type: "design",
        message: `Font size ${px}px does not align to the type scale [${[...FONT_SCALE].join(", ")}].`,
        fix: `Change font size to ${closest}px (nearest scale value).`,
        severity: "low",
      },
    ];
  }

  return [];
}

// ── Color Consistency (page-level rule) ──────────────────────────────

/**
 * Rule 3 — Color Usage Consistency
 * Flags when a page uses more than MAX_UNIQUE_COLORS unique foreground colors.
 * This is a page-level check, run once across all elements.
 *
 * @param {Array} elements - All scraped elements.
 * @returns {Array} 0 or 1 issue objects.
 */
function checkColorConsistency(elements) {
  const uniqueColors = new Set();

  for (const el of elements) {
    if (el.text && el.styles.color) {
      uniqueColors.add(el.styles.color);
    }
  }

  if (uniqueColors.size > MAX_UNIQUE_COLORS) {
    return [
      {
        id: "design-color-consistency",
        type: "design",
        element: "page",
        text: "",
        message: `Page uses ${uniqueColors.size} unique text colors (recommended max: ${MAX_UNIQUE_COLORS}). This may indicate an inconsistent color palette.`,
        fix: `Consolidate the color palette to ${MAX_UNIQUE_COLORS} or fewer primary text colors for visual consistency.`,
        severity: "medium",
      },
    ];
  }

  return [];
}

// ── Public API ───────────────────────────────────────────────────────

/** Per-element design rules */
const designRulesPerElement = [checkSpacing, checkFontScale];

/**
 * Run all per-element design rules against a single element.
 * @param {object} element
 * @returns {Array}
 */
function runDesignRules(element) {
  const issues = [];
  for (const rule of designRulesPerElement) {
    issues.push(...rule(element));
  }
  return issues;
}

module.exports = { runDesignRules, checkColorConsistency };
