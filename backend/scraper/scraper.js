const { chromium } = require("playwright");

/**
 * Scrapes a webpage and extracts DOM elements with computed styles.
 * @param {string} url - The URL to scrape.
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.timeout=30000] - Navigation timeout in ms.
 * @returns {Promise<{ elements: Array, rawHtml: string }>}
 */
async function scrapePage(url, options = {}) {
  const { timeout = 30000 } = options;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    // Give JS-rendered content a moment to settle
    await page.waitForTimeout(2000);

    // Extract raw HTML for the AI fixer
    const rawHtml = await page.content();

    // Extract element data + computed styles from the live DOM
    const elements = await page.evaluate(() => {
      const INTERACTIVE_TAGS = [
        "A",
        "BUTTON",
        "INPUT",
        "SELECT",
        "TEXTAREA",
        "LABEL",
      ];
      const SKIP_TAGS = [
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "META",
        "LINK",
        "BR",
        "HR",
      ];

      const results = [];
      const allElements = document.querySelectorAll("*");

      for (const el of allElements) {
        const tag = el.tagName.toUpperCase();
        if (SKIP_TAGS.includes(tag)) continue;

        const computed = window.getComputedStyle(el);

        // Skip invisible / zero-size elements
        if (computed.display === "none" || computed.visibility === "hidden") {
          continue;
        }

        const rect = el.getBoundingClientRect();

        const text = (el.innerText || "").trim().substring(0, 200);
        const ariaLabel = el.getAttribute("aria-label") || "";
        const alt = el.getAttribute("alt") || "";
        const role = el.getAttribute("role") || "";
        const id = el.id || "";
        const className = el.className || "";
        const href = el.getAttribute("href") || "";

        results.push({
          tag: tag.toLowerCase(),
          text,
          ariaLabel,
          alt,
          role,
          id,
          className: typeof className === "string" ? className : "",
          href,
          isInteractive: INTERACTIVE_TAGS.includes(tag),
          styles: {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            marginTop: computed.marginTop,
            marginRight: computed.marginRight,
            marginBottom: computed.marginBottom,
            marginLeft: computed.marginLeft,
            paddingTop: computed.paddingTop,
            paddingRight: computed.paddingRight,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
          },
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      }

      return results;
    });

    await browser.close();
    browser = null;

    return { elements, rawHtml };
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    // Classify error for better upstream handling
    if (err.message.includes("net::ERR_")) {
      throw new Error(`Network error loading "${url}": ${err.message}`);
    }
    if (err.name === "TimeoutError" || err.message.includes("Timeout")) {
      throw new Error(`Timeout loading "${url}" after ${timeout}ms`);
    }
    throw new Error(`Scraping failed for "${url}": ${err.message}`);
  }
}

module.exports = { scrapePage };
