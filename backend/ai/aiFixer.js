/**
 * AI Fixer Module (Optional)
 *
 * Uses OpenAI-compatible API to generate improved HTML/CSS based on detected issues.
 * Supports both direct OpenAI and OpenRouter (set OPENROUTER_API_KEY).
 * Gracefully degrades if no API key is configured.
 */

const OpenAI = require("openai");

/**
 * Check if the AI fixer is available (any supported API key configured).
 */
function isAvailable() {
  return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Build an OpenAI-compatible client based on available env vars.
 * Prefers OPENROUTER_API_KEY if both are set.
 */
function createClient() {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      }),
      model: process.env.AI_MODEL || "openai/gpt-4o-mini",
    };
  }
  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };
}

/**
 * Generate improved HTML/CSS based on the original HTML and detected issues.
 *
 * @param {string} rawHtml - The original page HTML.
 * @param {Array} issues - Array of issue objects from the analyzer.
 * @returns {Promise<string|null>} Improved HTML string, or null on failure.
 */
async function generateFix(rawHtml, issues) {
  if (!isAvailable()) {
    return null;
  }

  const { client, model } = createClient();

  // Build a concise issue summary for the prompt
  const issueList = issues
    .slice(0, 20) // Limit to top 20 issues to stay within token budget
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.severity.toUpperCase()}] ${i.issue} → Fix: ${i.fix}`
    )
    .join("\n");

  // Truncate HTML to avoid token overflow (keep first 8000 chars)
  const truncatedHtml = rawHtml.length > 8000
    ? rawHtml.substring(0, 8000) + "\n<!-- ... truncated ... -->"
    : rawHtml;

  const prompt = `You are a web accessibility and design expert.

Below is an HTML page and a list of accessibility/design issues found on it.

Fix the WCAG accessibility and design system issues listed below. Return ONLY the improved HTML/CSS.

RULES:
- Do NOT invent new features or add new content
- Do NOT remove existing content
- ONLY improve structure, accessibility attributes, and styling
- Ensure all fixes address the listed issues
- Keep the output concise

ISSUES FOUND:
${issueList}

ORIGINAL HTML:
${truncatedHtml}

Return ONLY the improved HTML/CSS code, no explanations.`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[AI Fixer] OpenAI API error:", err.message);
    return null;
  }
}

module.exports = { generateFix, isAvailable };
