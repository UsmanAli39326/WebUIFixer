import os
import json
from typing import List, Dict

# Support for both OpenAI and OpenRouter
def get_ai_client():
    from openai import AsyncOpenAI
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        return AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        ), os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
        
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None, None
        
    if os.getenv("OPENROUTER_API_KEY"):
        return AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        ), os.getenv("AI_MODEL", "openai/gpt-4o-mini")
        
    return AsyncOpenAI(api_key=api_key), os.getenv("AI_MODEL", "gpt-4o-mini")

async def generate_recommendations(raw_html: str, issues: List[Dict]):
    client, model = get_ai_client()
    if not client:
        raise EnvironmentError("AI API key not configured")

    # Build a concise issue summary for the prompt
    issue_list = "\n".join([
        f"{idx + 1}. [{i['severity'].upper()}] {i['issue']} -> Fix: {i['fix']}"
        for idx, i in enumerate(issues[:25]) # Limit to top 25 issues
    ])

    # Truncate HTML to avoid token overflow
    if len(raw_html) > 40000:
        truncated_html = raw_html[:40000] + "\n<!-- [truncated] -->"
    else:
        truncated_html = raw_html

    prompt = f"""You are a web accessibility and design expert.

Below is a snippet of an HTML page and a list of accessibility/design issues found on it.

Fix the issues and return your response in a structured JSON format as follows:
{{
  "problemAnalysis": "First, list out the specific problems from the ISSUES FOUND that you are going to solve and explain how you will solve them using CSS.",
  "styleOverlay": {{
    "selector1": {{ "property": "value", ... }},
    "selector2": {{ "property": "value", ... }}
  }},
  "explanation": "Brief summary of key changes"
}}

RULES:
- 'styleOverlay' should contain CSS changes that improve accessibility (e.g. contrast, font size, spacing).
- CRITICAL: Use highly specific selectors (classes or IDs) found in the HTML. Do NOT use generic tag selectors like 'div', 'a', 'section', 'img' or '*' as this will destroy the site's layout.
- CRITICAL: You can ONLY output valid CSS properties. Do NOT output HTML attributes (like 'alt', 'aria-label', 'src') as CSS properties. If an issue requires an HTML change, ignore it in the styleOverlay.
- Return ONLY the JSON object.

ISSUES FOUND:
{issue_list}

ORIGINAL HTML (Truncated):
{truncated_html}
"""

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000,
            temperature=0.2
        )
        content = response.choices[0].message.content
        if not content:
            return "<!-- [AI Error] No content returned by AI model. -->", None
            
        # Clean up the content in case the model wraps it in markdown code blocks
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        try:
            data = json.loads(content.strip())
        except json.JSONDecodeError:
            import logging
            logging.error(f"Failed to parse AI response: {content}")
            return raw_html, {"issues": [], "error": "AI response unparseable"}
        
        # We no longer ask the AI to rewrite the full HTML as it exceeds output token limits.
        # Instead, we just use the original raw HTML and let the frontend inject the CSS overlay.
        return raw_html, data.get("styleOverlay")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"<!-- [AI Error] An exception occurred: {str(e)} -->", None
