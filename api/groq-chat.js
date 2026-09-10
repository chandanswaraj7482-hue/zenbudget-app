import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // If user prefers Gemini API
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing API Key in environment variables" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages } = req.body;
    
    // Convert generic OpenAI-style messages to a single prompt for Gemini
    let promptText = "";
    messages.forEach(m => {
      if (m.role === "system") {
        promptText += "System Context: " + m.content + "\n";
      } else {
        promptText += "User Prompt: " + m.content + "\n";
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: promptText,
    });

    // Mocking OpenAI style response format so frontend doesn't break
    return res.status(200).json({
      choices: [
        {
          message: {
            content: response.text
          }
        }
      ]
    });

  } catch (error) {
    console.error("AI Coach Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate AI response", details: error.message });
  }
}
