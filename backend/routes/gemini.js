import express from "express";
import { ai } from "../config/geminiAi";

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

export default router;