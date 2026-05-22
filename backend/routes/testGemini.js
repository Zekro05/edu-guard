import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyB_NBtSgqQePmuHlmtBh3r4Y0w1wmqMk8o",
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: [
        { type: "text", text: "Explain how AI works in a few words" }
      ],
    });

    // Access the first candidate
    const candidate = response.candidates[0];

    // Extract text from parts
    const generatedText = candidate.content.parts
      .map(part => part.text)
      .join("\n");

    if (generatedText) {
      console.log("Generated text:\n", generatedText);
    } else {
      console.log("No text found in the candidate content.");
    }

  } catch (err) {
    console.error("Error generating content:", err);
  }
}

main();
