import re
import math

def parse_color(color_str):
    if not color_str:
        return None
    
    match = re.match(r'rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)', color_str)
    if not match:
        return None
    
    return {
        "r": int(match.group(1)),
        "g": int(match.group(2)),
        "b": int(match.group(3)),
        "a": float(match.group(4)) if match.group(4) is not None else 1.0
    }

def relative_luminance(color):
    def adjust(c):
        s = c / 255.0
        return s / 12.92 if s <= 0.03928 else math.pow((s + 0.055) / 1.055, 2.4)
    
    rs = adjust(color["r"])
    gs = adjust(color["g"])
    bs = adjust(color["b"])
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs

def contrast_ratio(lum1, lum2):
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)

def parse_px(value):
    if not value or not isinstance(value, str):
        return float('nan')
    match = re.match(r'([\d.]+)', value)
    return float(match.group(1)) if match else float('nan')

def check_color_contrast(element):
    if not element.get("text"):
        return None
    
    styles = element.get("styles", {})
    fg = parse_color(styles.get("color"))
    bg = parse_color(styles.get("backgroundColor"))
    
    if not fg or not bg:
        return None
    
    if bg["a"] == 0:
        return None
    
    fg_lum = relative_luminance(fg)
    bg_lum = relative_luminance(bg)
    ratio = contrast_ratio(fg_lum, bg_lum)
    
    font_size = parse_px(styles.get("fontSize"))
    font_weight = int(styles.get("fontWeight", "400"))
    is_large_text = font_size >= 24 or (font_size >= 18 and font_weight >= 700)
    
    threshold = 3.0 if is_large_text else 4.5
    
    if ratio < threshold:
        return {
            "id": "wcag-contrast",
            "type": "accessibility",
            "message": f"Low color contrast ratio {ratio:.2f}:1 (minimum {threshold}:1 required). Foreground: {styles.get('color')}, Background: {styles.get('backgroundColor')}",
            "fix": f"Increase the contrast between text color and background color to at least {threshold}:1.",
            "severity": "high" if ratio < 2 else "medium"
        }
    return None

def check_font_size(element):
    if not element.get("text"):
        return None
    
    font_size = parse_px(element.get("styles", {}).get("fontSize"))
    if math.isnan(font_size):
        return None
    
    if font_size < 12:
        return {
            "id": "wcag-font-size",
            "type": "accessibility",
            "message": f"Font size {font_size}px is below the 12px minimum for readability.",
            "fix": "Increase font size to at least 12px.",
            "severity": "high" if font_size < 10 else "medium"
        }
    return None

def check_missing_text(element):
    if not element.get("isInteractive"):
        return None
    
    has_text = any([
        element.get("text"),
        element.get("ariaLabel"),
        element.get("alt")
    ])
    
    if not has_text:
        return {
            "id": "wcag-missing-text",
            "type": "accessibility",
            "message": f"Interactive <{element.get('tag')}> element has no text content, aria-label, or alt text.",
            "fix": "Add descriptive text content, an aria-label attribute, or alt text to this element.",
            "severity": "high"
        }
    return None

def check_alt_text_quality(element):
    """
    Check if images have meaningful alt text.
    """
    if element.get("tag") != "img":
        return None
        
    alt = element.get("alt", "").strip()
    
    if not alt:
        return {
            "id": "wcag-alt-missing",
            "type": "accessibility",
            "message": "Image is missing an 'alt' attribute.",
            "fix": "Add a descriptive 'alt' attribute or alt='' if purely decorative.",
            "severity": "high"
        }
        
    # Check for non-descriptive alt text
    low_quality_patterns = [
        "image", "picture", "photo", "img", "pic", "graphic",
        "logo", "icon", "placeholder", "untitled"
    ]
    
    alt_lower = alt.lower()
    if alt_lower in low_quality_patterns or len(alt) < 3:
        return {
            "id": "wcag-alt-low-quality",
            "type": "accessibility",
            "message": f"Alt text '{alt}' is not descriptive enough.",
            "fix": "Provide a meaningful description of the image content.",
            "severity": "medium"
        }
        
    if "image of" in alt_lower or "photo of" in alt_lower:
        return {
            "id": "wcag-alt-redundant",
            "type": "accessibility",
            "message": "Alt text contains redundant phrases like 'image of' or 'photo of'.",
            "fix": "Remove redundant phrases; screen readers already identify the element as an image.",
            "severity": "low"
        }
        
    return None

def check_accessibility_labels(element):
    """
    Check if interactive elements have proper labels for screen readers.
    """
    if not element.get("isInteractive"):
        return None
        
    tag = element.get("tag")
    aria_label = element.get("ariaLabel")
    text = element.get("text")
    
    # Generic check for meaningful labels
    if not aria_label and not text and tag in ["button", "a"]:
         return {
            "id": "wcag-missing-label",
            "type": "accessibility",
            "message": f"Interactive <{tag}> is missing a discernible name for screen readers.",
            "fix": "Add an 'aria-label' or visible text content.",
            "severity": "high"
        }
    return None

def check_heading_hierarchy(elements):
    """
    Page-level rule to check if headings are in the correct order (H1 -> H2 -> H3...).
    """
    issues = []
    headings = [el for el in elements if el.get("tag") in ["h1", "h2", "h3", "h4", "h5", "h6"]]
    
    if not headings:
        return []
    
    last_level = 0
    for h in headings:
        current_level = int(h["tag"][1])
        
        # Check if we skipped a level (e.g., H1 directly to H3)
        if current_level > last_level + 1 and last_level != 0:
            issues.append({
                "id": "wcag-heading-hierarchy",
                "type": "accessibility",
                "element": h["tag"],
                "message": f"Heading level skipped: <{h['tag']}> follows <h{last_level}>. Headings should be nested sequentially.",
                "fix": f"Change <{h['tag']}> to <h{last_level + 1}> or ensure the structure is sequential.",
                "severity": "medium"
            })
        last_level = current_level
        
    return issues

def run_wcag_rules(element):
    rules = [check_color_contrast, check_font_size, check_missing_text, check_accessibility_labels, check_alt_text_quality]
    issues = []
    for rule in rules:
        result = rule(element)
        if result:
            issues.append(result)
    return issues
