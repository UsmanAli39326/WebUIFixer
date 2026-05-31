const axios = require("axios");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * Client for communicating with the FastAPI AI Engine.
 */
async function analyzeWebsite(url, ai = false) {
  try {
    const response = await axios.post(`${FASTAPI_URL}/analyze?ai=${ai}`, { url });
    return response.data;
  } catch (err) {
    console.error("[FastAPI Client] Error calling analyze:", err.message);
    throw new Error(`AI Engine unavailable: ${err.message}`);
  }
}

/**
 * Health check for the AI Engine.
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${FASTAPI_URL}/health`);
    return response.data;
  } catch (err) {
    return { status: "down", error: err.message };
  }
}

module.exports = { analyzeWebsite, checkHealth };
