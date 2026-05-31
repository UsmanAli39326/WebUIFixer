import os
from typing import List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from analyzer import analyze
from recommender import generate_recommendations
from scraper import scrape_page

# Load environment variables from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

app = FastAPI(title="AI Driven Website UI Enhancement System - AI Engine")

class AuditRequest(BaseModel):
    url: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai_engine"}

@app.post("/analyze")
async def analyze_website(request: AuditRequest, ai: bool = False):
    try:
        # 1. Scrape the page
        result = await scrape_page(request.url)
        elements = result["elements"]
        raw_html = result["rawHtml"]

        # 2. Analyze elements
        analysis_result = analyze(elements)
        
        # 3. Optionally generate AI fixes
        fixed_html = None
        style_overlay = None
        if ai:
            fixed_html, style_overlay = await generate_recommendations(raw_html, analysis_result["issues"])
        
        return {
            "url": request.url,
            "summary": analysis_result["summary"],
            "issues": analysis_result["issues"],
            "fixedHtml": fixed_html,
            "styleOverlay": style_overlay,
            "rawHtml": raw_html
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=repr(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
