from rules.wcag_rules import run_wcag_rules, check_heading_hierarchy
from rules.design_rules import run_design_rules, check_color_consistency

SEVERITY_LEVELS = ["critical", "high", "medium", "low"]

def get_severity(rule_id, current_severity):
    """
    Centralized logic to determine or override severity based on rule IDs.
    """
    # Critical overrides for accessibility showstoppers
    critical_rules = ["wcag-missing-text", "wcag-alt-missing", "wcag-missing-label"]
    if rule_id in critical_rules:
        return "critical"
        
    if current_severity.lower() in SEVERITY_LEVELS:
        return current_severity.lower()
        
    return "medium"

def calculate_score(issues, total_elements):
    """
    Calculate an accessibility score from 0 to 100.
    """
    if total_elements == 0:
        return 100
        
    # Penalty weights
    weights = {
        "critical": 25,
        "high": 15,
        "medium": 5,
        "low": 2
    }
    
    total_penalty = 0
    for issue in issues:
        total_penalty += weights.get(issue["severity"], 5)
        
    # Normalize score: starting at 100, subtract penalties
    # We factor in total_elements so large sites aren't unfairly penalized for 1-2 minor issues
    score = 100 - (total_penalty / (1 + total_elements * 0.1))
    return max(0, round(score))

def analyze(elements):
    issues = []
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    type_counts = {"accessibility": 0, "design": 0}

    # Per-element rules
    for element in elements:
        # WCAG rules
        wcag_issues = run_wcag_rules(element)
        for issue in wcag_issues:
            severity = get_severity(issue["id"], issue["severity"])
            issues.append({
                "element": element.get("tag"),
                "id": element.get("id", ""),
                "className": element.get("className", ""),
                "text": element.get("text", "")[:80],
                "issue": issue["message"],
                "fix": issue["fix"],
                "type": issue["type"],
                "severity": severity,
                "ruleId": issue["id"]
            })
            severity_counts[severity] += 1
            type_counts[issue["type"]] += 1

        # Design rules
        design_issues = run_design_rules(element)
        for issue in design_issues:
            severity = get_severity(issue["id"], issue["severity"])
            issues.append({
                "element": element.get("tag"),
                "id": element.get("id", ""),
                "className": element.get("className", ""),
                "text": element.get("text", "")[:80],
                "issue": issue["message"],
                "fix": issue["fix"],
                "type": issue["type"],
                "severity": severity,
                "ruleId": issue["id"]
            })
            severity_counts[severity] += 1
            type_counts[issue["type"]] += 1

    # Page-level rules
    color_issues = check_color_consistency(elements)
    for issue in color_issues:
        severity = get_severity(issue["id"], issue["severity"])
        issues.append({
            "element": issue.get("element", "page"),
            "text": "",
            "issue": issue["message"],
            "fix": issue["fix"],
            "type": issue["type"],
            "severity": severity,
            "ruleId": issue["id"]
        })
        severity_counts[severity] += 1
        type_counts[issue["type"]] += 1

    # WCAG Page-level rules
    heading_issues = check_heading_hierarchy(elements)
    for issue in heading_issues:
        severity = get_severity(issue["id"], issue["severity"])
        issues.append({
            "element": issue.get("element", "page"),
            "text": "",
            "issue": issue["message"],
            "fix": issue["fix"],
            "type": issue["type"],
            "severity": severity,
            "ruleId": issue["id"]
        })
        severity_counts[severity] += 1
        type_counts[issue["type"]] += 1

    total = len(elements)
    compliance = round((1 - len(issues) / max(total, 1)) * 100, 1) if total > 0 else 100.0
    summary = {
        "totalIssues": len(issues),
        "bySeverity": severity_counts,
        "byType": type_counts,
        "elementsScanned": len(elements),
        "currentScore": calculate_score(issues, len(elements)),
        "projectedScore": 100, # Assuming all identified issues are fixed
        "compliancePercentage": compliance
    }

    return {"issues": issues, "summary": summary}
