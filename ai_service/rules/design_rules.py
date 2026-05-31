import re
import math

SPACING_SCALE = {0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64}
FONT_SCALE = {10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72}
MAX_UNIQUE_COLORS = 6

def parse_px(value):
    if not value or not isinstance(value, str):
        return float('nan')
    match = re.match(r'([\d.]+)', value)
    return float(match.group(1)) if match else float('nan')

def closest_in_scale(value, scale):
    if not scale:
        return 0
    return min(scale, key=lambda x: abs(value - x))

def check_spacing(element):
    issues = []
    spacing_props = [
        "marginTop", "marginRight", "marginBottom", "marginLeft",
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"
    ]
    
    styles = element.get("styles", {})
    for prop in spacing_props:
        raw = styles.get(prop)
        px = parse_px(raw)
        if math.isnan(px) or px == 0:
            continue
        
        on_scale = any(abs(px - s) <= 1 for s in SPACING_SCALE)
        
        if not on_scale:
            closest = closest_in_scale(px, SPACING_SCALE)
            issues.append({
                "id": "design-spacing",
                "type": "design",
                "message": f"<{element.get('tag')}> has {prop}: {raw} which does not align to the spacing scale.",
                "fix": f"Change {prop} to {closest}px (nearest scale value).",
                "severity": "low"
            })
    return issues

def check_font_scale(element):
    if not element.get("text"):
        return []
    
    font_size_raw = element.get("styles", {}).get("fontSize")
    px = parse_px(font_size_raw)
    if math.isnan(px):
        return []
    
    on_scale = any(abs(px - s) <= 0.5 for s in FONT_SCALE)
    
    if not on_scale:
        closest = closest_in_scale(px, FONT_SCALE)
        return [{
            "id": "design-font-scale",
            "type": "design",
            "message": f"Font size {px}px does not align to the type scale.",
            "fix": f"Change font size to {closest}px (nearest scale value).",
            "severity": "low"
        }]
    return []

def check_color_consistency(elements):
    unique_colors = set()
    for el in elements:
        if el.get("text") and el.get("styles", {}).get("color"):
            unique_colors.add(el.get("styles", {}).get("color"))
            
    if len(unique_colors) > MAX_UNIQUE_COLORS:
        return [{
            "id": "design-color-consistency",
            "type": "design",
            "element": "page",
            "message": f"Page uses {len(unique_colors)} unique text colors (recommended max: {MAX_UNIQUE_COLORS}).",
            "fix": f"Consolidate palette to {MAX_UNIQUE_COLORS} or fewer primary text colors.",
            "severity": "medium"
        }]
    return []

def run_design_rules(element):
    rules = [check_spacing, check_font_scale]
    issues = []
    for rule in rules:
        issues.extend(rule(element))
    return issues
