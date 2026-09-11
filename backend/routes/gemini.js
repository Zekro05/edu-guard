import express from "express";
import { ai } from "../config/geminiAi.js";

const router = express.Router();

/* =========================================================
   GEMINI CONFIG
========================================================= */

const GEMINI_MODEL = "models/gemini-3-flash-preview";

const MAX_RETRIES = 4;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


/* =========================================================
   HELPER: GET ERROR STATUS
========================================================= */

const getErrorStatus = (error) => {
  return (
    error?.status ||
    error?.response?.status ||
    error?.error?.code ||
    null
  );
};


/* =========================================================
   HELPER: RETRY GEMINI REQUEST
========================================================= */

const generateWithRetry = async (contents, options = {}) => {
  const {
    maxRetries = MAX_RETRIES,
    config,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🤖 Gemini request attempt ${attempt + 1}/${maxRetries + 1}`
      );

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        ...(config ? { config } : {}),
      });

      console.log("✅ Gemini request successful.");

      return response;
    } catch (error) {
      lastError = error;

      const status = getErrorStatus(error);

      console.error(
        `❌ Gemini attempt ${attempt + 1} failed.`,
        {
          status,
          message: error?.message || "Unknown Gemini error",
        }
      );

      /*
       * Retry only temporary errors.
       *
       * 408 = Request Timeout
       * 429 = Too Many Requests
       * 500 = Internal Server Error
       * 502 = Bad Gateway
       * 503 = Service Unavailable
       * 504 = Gateway Timeout
       */
      const retryableStatuses = [
        408,
        429,
        500,
        502,
        503,
        504,
      ];

      if (!retryableStatuses.includes(Number(status))) {
        throw error;
      }

      if (attempt === maxRetries) {
        console.error(
          "❌ Gemini failed after all retry attempts."
        );

        break;
      }

      /*
       * Exponential backoff:
       *
       * Attempt 1 → wait 1 second
       * Attempt 2 → wait 2 seconds
       * Attempt 3 → wait 4 seconds
       * Attempt 4 → wait 8 seconds
       */
      const delay = Math.min(
        1000 * Math.pow(2, attempt),
        8000
      );

      console.log(
        `⏳ Gemini temporarily unavailable. Retrying in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
};


/* =========================================================
   POST /api/gemini/generate
========================================================= */

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const response = await generateWithRetry(prompt);

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

    if (!text || text.trim().length === 0) {
      console.error(
        "Gemini empty response:",
        response
      );

      return res.status(500).json({
        error: "Empty AI response",
      });
    }

    return res.json({
      text: text.trim(),
    });
  } catch (err) {
    console.error("Gemini API error:", err);

    const status = getErrorStatus(err);

    /*
     * Return 503 instead of 500 when Gemini itself
     * is temporarily unavailable.
     */
    if (Number(status) === 503) {
      return res.status(503).json({
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    if (Number(status) === 429) {
      return res.status(429).json({
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    return res.status(500).json({
      error:
        err.message ||
        "Failed to generate AI content",
    });
  }
});


/* =========================================================
   POST /api/gemini/analyze-incident
========================================================= */

router.post("/analyze-incident", async (req, res) => {
  try {
    const {
      studentName,
      offense,
      location,
      description,
      reporterType,
      status,
    } = req.body;

    const prompt = `
You are EduGuard AI.

Analyze the following student disciplinary incident.

Student:
${studentName || "Unknown"}

Offense:
${offense || "Unknown"}

Location:
${location || "Unknown"}

Reporter:
${reporterType || "Unknown"}

Status:
${status || "Pending"}

Description:
${description || "No description provided"}

Return ONLY valid JSON.

{
  "category": "",
  "confidence": "",
  "riskLevel": "",
  "pattern": "",
  "prediction": "",
  "remarks": "",
  "recommendation": ""
}

Rules:
- category must be one short phrase.
- confidence must be a percentage like "94%".
- riskLevel must be Low, Medium, or High.
- pattern should be 1-2 sentences.
- prediction should be 1 sentence.
- remarks should be 2-3 sentences.
- recommendation should be practical and professional.
- Do not wrap the JSON in markdown.
- Do not add explanations.
`;

    const response = await generateWithRetry(
      prompt,
      {
        config: {
          responseMimeType: "application/json",
        },
      }
    );

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

    if (!text.trim()) {
      console.error(
        "Gemini returned an empty incident analysis."
      );

      return res.status(500).json({
        error:
          "Gemini returned an empty response.",
      });
    }

    /*
     * Remove markdown code fences just in case
     * Gemini still returns them.
     */
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Gemini JSON Parse Error:",
        parseError
      );

      console.error(
        "Gemini returned:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid JSON.",
        raw: text,
      });
    }

    return res.json({
      success: true,

      category:
        analysis.category ||
        offense ||
        "General Incident",

      confidence:
        analysis.confidence ||
        "90%",

      riskLevel:
        analysis.riskLevel ||
        "Low",

      pattern:
        analysis.pattern ||
        "No recurring behavioral pattern identified.",

      prediction:
        analysis.prediction ||
        "No prediction available.",

      remarks:
        analysis.remarks ||
        "No remarks generated.",

      recommendation:
        analysis.recommendation ||
        "No recommendation generated.",
    });
  } catch (err) {
    console.error(
      "Gemini Incident Analysis Error:",
      err
    );

    const status = getErrorStatus(err);

    if (Number(status) === 503) {
      return res.status(503).json({
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    if (Number(status) === 429) {
      return res.status(429).json({
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    return res.status(500).json({
      error:
        err.message ||
        "Failed to analyze incident.",
    });
  }
});


/* =========================================================
   EXPORT
========================================================= */

export default router;

