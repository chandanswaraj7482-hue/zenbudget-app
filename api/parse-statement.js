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
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables" });
    }

    const { base64Data, mimeType = 'image/jpeg', password = '' } = req.body || {};
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data in request body" });
    }

    const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '').trim();
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a strict bank passbook and account statement OCR extraction engine.
Analyze this bank account statement, passbook page, or transaction document.
${password ? `Note: User specified statement password '${password}' if needed.` : ''}

CRITICAL RULES:
1. Extract ONLY REAL, VISIBLE transactions from this exact document/image.
2. DO NOT hallucinate, invent, or create mock sample transactions.
3. If an entry is clearly a transaction:
   - date: "YYYY-MM-DD" (or normalized date)
   - title: clean merchant or recipient/sender name (e.g. "Swiggy", "Zomato", "Amazon", "Salary - Infosys", "ATM Cash Withdrawal", "House Rent", "Electricity Bill")
   - amount: positive integer number (the exact amount of the transaction)
   - type: "expense" (for debits/withdrawals/payments) OR "income" (for credits/deposits/salary/refunds)
   - category: One of ["Food", "Groceries", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Investment", "Salary", "Income", "General"]
   - rawNarration: exact raw narration line as printed on the statement

Extract in strict JSON format:
{
  "bankName": string (e.g. "HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Bank Statement"),
  "accountNumber": string (e.g. "XX4821", or empty string),
  "statementPeriod": string (e.g. "Aug 2026", or empty string),
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "title": "Merchant Name",
      "amount": 250,
      "type": "expense",
      "category": "Food",
      "rawNarration": "UPI-SWIGGY-129482..."
    }
  ]
}
Return ONLY valid JSON without markdown code blocks. Extract up to 50 clearest visible transactions.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      });
    } catch (err) {
      console.warn("Fallback to gemini-3.8-flash in parse-statement:", err);
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      });
    }

    const text = response.text ? response.text.replace(/```json|```/g, '').trim() : "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON response from AI");
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("AI Bank Statement Parser Error:", error);
    return res.status(500).json({ error: "Failed to parse bank statement", details: error.message });
  }
}
