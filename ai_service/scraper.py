import asyncio
import json
from playwright.sync_api import sync_playwright

def _scrape_page_sync(url: str, timeout: int = 30000):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            # Give JS-rendered content a moment to settle
            page.wait_for_load_state("networkidle")

            raw_html = page.content()

            # Extract element data + computed styles from the live DOM
            elements = page.evaluate("""
                () => {
                    const INTERACTIVE_TAGS = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
                    const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'BR', 'HR'];
                    
                    const results = [];
                    const allElements = document.querySelectorAll("*");

                    for (const el of allElements) {
                        const tag = el.tagName.toUpperCase();
                        if (SKIP_TAGS.includes(tag)) continue;

                        const computed = window.getComputedStyle(el);

                        // Skip invisible / zero-size elements
                        if (computed.display === 'none' || computed.visibility === 'hidden') {
                            continue;
                        }

                        const rect = el.getBoundingClientRect();
                        const text = (el.innerText || "").trim().substring(0, 200);
                        
                        results.push({
                            tag: tag.toLowerCase(),
                            text: text,
                            ariaLabel: el.getAttribute("aria-label") || "",
                            alt: el.getAttribute("alt") || "",
                            role: el.getAttribute("role") || "",
                            id: el.id || "",
                            className: typeof el.className === "string" ? el.className : "",
                            href: el.getAttribute("href") || "",
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
                                paddingLeft: computed.paddingLeft
                            },
                            boundingBox: {
                                x: Math.round(rect.x),
                                y: Math.round(rect.y),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            }
                        });
                    }
                    return results;
                }
            """)

            browser.close()
            return {"elements": elements, "rawHtml": raw_html}

        except Exception as e:
            browser.close()
            raise e

async def scrape_page(url: str, timeout: int = 30000):
    return await asyncio.to_thread(_scrape_page_sync, url, timeout)

if __name__ == "__main__":
    # Test script
    import sys
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    result = asyncio.run(scrape_page(test_url))
    print(f"Scraped {len(result['elements'])} elements.")
