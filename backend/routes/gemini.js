import express from "express";
import { ai } from "../config/geminiAi.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: prompt,
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || text.trim().length === 0) {
      console.error("Gemini empty response:", response);

      return res.status(500).json({
        error: "Empty AI response",
      });
    }

    return res.json({
      text: text.trim(),
    });

  } catch (err) {
    console.error("Gemini API error:", err);

    return res.status(500).json({
      error: err.message || "Failed to generate AI content",
    });
  }
});

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
  "category":"",
  "confidence":"",
  "riskLevel":"",
  "pattern":"",
  "prediction":"",
  "remarks":"",
  "recommendation":""
}

Rules:
- category must be one short phrase.
- confidence must be a percentage like "94%".
- riskLevel must be Low, Medium, or High.
- pattern should be 1-2 sentences.
- prediction should be 1 sentence.
- remarks should be 2-3 sentences.
- recommendation should be practical and professional.
Do not wrap the JSON in markdown.
Do not add explanations.
`;

    const response = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: prompt,
    });

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

    if (!text.trim()) {
      return res.status(500).json({
        error: "Gemini returned an empty response.",
      });
    }

    // Remove markdown code fences if present
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (e) {
      console.error("Gemini JSON Parse Error:", text);

      return res.status(500).json({
        error: "Gemini returned invalid JSON.",
        raw: text,
      });
    }

    return res.json({
      success: true,

      category:
        analysis.category || offense || "General Incident",

      confidence:
        analysis.confidence || "90%",

      riskLevel:
        analysis.riskLevel || "Low",

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
    console.error("Gemini Incident Analysis Error:", err);

    return res.status(500).json({
      error: err.message || "Failed to analyze incident.",
    });
  }
});


export default router;