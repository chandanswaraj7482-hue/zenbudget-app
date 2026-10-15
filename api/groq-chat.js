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
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing API Key in environment variables" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages, isPremium } = req.body;
    
    // Tone and Manner of Speaking Directive according to user subscription
    const membershipDirective = isPremium
      ? `👑 USER MEMBERSHIP STATUS: ZENBUDGET PRO (VIP MEMBER)\nVIP SPEAKING STYLE & BEHAVIOR:\n- Address them with VIP warmth and respect.\n- Deliver comprehensive, elite, multi-step financial diagnostics, category leak analysis, multi-year compounding insights, and debt elimination strategies.\n- Unlimited depth and detailed tactical guidance. No basic limits or upsells.\n\n`
      : `🌿 USER MEMBERSHIP STATUS: FREE TIER USER (BASIC MODE)\nFREE TIER SPEAKING STYLE & BEHAVIOR:\n- Keep response CRISP, CONCISE, AND BASIC (strictly 2 to 3 sentences or short bullets).\n- Simple, friendly, and practical tone in user's language (Hindi/Hinglish/English).\n- Answer immediately, but omit deep forensic multi-year modeling.\n- Conclude with a helpful short tip: '💡 *Tip: Upgrade to ZenBudget Pro for deep multi-year wealth forecasting & unlimited 24/7 AI chats!*'\n\n`;

    // Convert generic OpenAI-style messages to a single prompt for Gemini
    let promptText = "STRICT AI DIRECTIVE: You are Zen, the dedicated Personal Finance & ZenBudget App AI Coach. You ONLY answer personal finance, budget, savings, expense tracking, and ZenBudget app questions. If the user asks non-financial off-topic questions (e.g. recipes like 'egg kaise bante ha', movies, coding, sports, weather), strictly refuse in a friendly witty Hinglish/English tone stating: 'Main aapka AI Financial Coach hu! 💸 Main sirf money, budget aur savings handle karta hu. Recipe/Search ke liye YouTube/Google dekhein, par agar grocery budget plan karna ho toh batao! 😉🌿'\n\n" + membershipDirective;
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
