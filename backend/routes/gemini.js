import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await client.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: prompt,
    });

    // 🔥 SAFE EXTRACTION (FIXES YOUR ISSUE)
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

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

export default router;