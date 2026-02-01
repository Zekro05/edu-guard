import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: "AIzaSyB_NBtSgqQePmuHlmtBh3r4Y0w1wmqMk8o", // your Gemini API key
});

export const generateAIAnalysis = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: prompt,
    });

    // extract the text safely
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No AI output received");
    return text;
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
};
