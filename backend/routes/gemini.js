import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // store key in .env
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const response = await client.models.generateContent({
      model: "models/gemini-3-flash-preview", 
      contents: prompt,
    });

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No AI output received", response });

    res.json({ text, response }); 
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI content" });
  }
});

export default router;
